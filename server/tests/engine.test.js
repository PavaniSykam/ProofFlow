const request = require('supertest');
const { setupTestDB } = require('./setup');
const { loginUser, app } = require('./testHelper');
const Workflow = require('../src/models/Workflow');
const Request = require('../src/models/Request');
const StageInstance = require('../src/models/StageInstance');
const AuditLog = require('../src/models/AuditLog');
const { runSlaPasses } = require('../src/jobs/slaScheduler');

describe('ProofFlow Workflow Engine & SLA Scheduler Tests', () => {
  setupTestDB();

  let raviSession;
  let nehaSession;
  let rohanSession;
  let karthikSession;
  let vikramSession;
  let leaveWorkflow;
  let purchaseWorkflow;

  beforeAll(async () => {
    raviSession = await loginUser('ravi.teja@nexora-demo.example');
    nehaSession = await loginUser('neha.joshi@nexora-demo.example');
    rohanSession = await loginUser('rohan.desai@nexora-demo.example');
    karthikSession = await loginUser('karthik.iyer@nexora-demo.example');
    vikramSession = await loginUser('vikram.shah@nexora-demo.example');

    leaveWorkflow = await Workflow.findOne({ key: 'leave-request' });
    purchaseWorkflow = await Workflow.findOne({ key: 'purchase-request' });
  });

  // Rejection lifecycle
  test('Engine: Rejection lifecycle (requires reason, sets terminal state, cancels remaining stages)', async () => {
    const draft = await request(app)
      .post('/api/requests')
      .set('Cookie', raviSession.cookie)
      .send({
        workflowId: leaveWorkflow._id,
        formData: {
          leaveType: 'Casual',
          fromDate: '2026-12-20',
          toDate: '2026-12-21',
          reason: 'Holiday',
        },
      });
    const reqId = draft.body.request._id;
    await request(app).post(`/api/requests/${reqId}/submit`).set('Cookie', raviSession.cookie);

    const activeStage = await StageInstance.findOne({ requestId: reqId, status: 'active' });

    // Reject without reason fails (400)
    const failReject = await request(app)
      .post(`/api/approvals/${activeStage._id}/reject`)
      .set('Cookie', nehaSession.cookie)
      .send({});
    expect(failReject.status).toBe(400);

    // Reject with reason succeeds
    const rejectRes = await request(app)
      .post(`/api/approvals/${activeStage._id}/reject`)
      .set('Cookie', nehaSession.cookie)
      .send({ comment: 'Critical sprint deadline; leave rejected' });
    expect(rejectRes.status).toBe(200);

    const updatedReq = await Request.findById(reqId);
    expect(updatedReq.status).toBe('rejected');
    expect(updatedReq.closedAt).toBeTruthy();

    // Sibling or later stages must be cancelled
    const remainingStages = await StageInstance.find({ requestId: reqId, status: { $in: ['waiting', 'active'] } });
    expect(remainingStages.length).toBe(0);

    // Audit log records rejection
    const audit = await AuditLog.findOne({ requestId: reqId, action: 'rejected' });
    expect(audit).toBeTruthy();
  });

  // Changes requested and Resubmit lifecycle
  test('Engine: Changes requested -> Edit form -> Resubmit -> Approval', async () => {
    const draft = await request(app)
      .post('/api/requests')
      .set('Cookie', raviSession.cookie)
      .send({
        workflowId: leaveWorkflow._id,
        formData: {
          leaveType: 'Casual',
          fromDate: '2026-12-25',
          toDate: '2026-12-26',
          reason: 'Christmas time',
        },
      });
    const reqId = draft.body.request._id;
    await request(app).post(`/api/requests/${reqId}/submit`).set('Cookie', raviSession.cookie);

    const stage1 = await StageInstance.findOne({ requestId: reqId, status: 'active' });

    // Manager requests changes
    const changeRes = await request(app)
      .post(`/api/approvals/${stage1._id}/request-changes`)
      .set('Cookie', nehaSession.cookie)
      .send({ comment: 'Please specify coverage person during leave' });
    expect(changeRes.status).toBe(200);

    const reqAfterChanges = await Request.findById(reqId);
    expect(reqAfterChanges.status).toBe('changes_requested');

    // Requester edits and resubmits
    const resubmitRes = await request(app)
      .post(`/api/requests/${reqId}/resubmit`)
      .set('Cookie', raviSession.cookie)
      .send({
        formData: {
          reason: 'Christmas time with family. Coverage by Divya Reddy.',
        },
      });
    expect(resubmitRes.status).toBe(200);

    const reqAfterResubmit = await Request.findById(reqId);
    expect(reqAfterResubmit.status).toBe('pending');
    expect(reqAfterResubmit.cycle).toBe(2);

    // Check that cycle 1 stage instances are marked superseded
    const cycle1Stages = await StageInstance.find({ requestId: reqId, cycle: 1 });
    expect(cycle1Stages.every((s) => ['superseded', 'changes_requested', 'cancelled'].includes(s.status))).toBe(true);

    // Fresh cycle 2 active stage exists for manager
    const cycle2Stage = await StageInstance.findOne({ requestId: reqId, cycle: 2, status: 'active' });
    expect(cycle2Stage).toBeTruthy();
    expect(cycle2Stage.assignedTo[0].toString()).toBe(nehaSession.user._id.toString());
  });

  // Cancellation lifecycle
  test('Engine: Cancellation (allowed in draft/pending, blocked after locking stage)', async () => {
    const draft = await request(app)
      .post('/api/requests')
      .set('Cookie', raviSession.cookie)
      .send({
        workflowId: leaveWorkflow._id,
        formData: {
          leaveType: 'Casual',
          fromDate: '2027-01-05',
          toDate: '2027-01-06',
          reason: 'New Year errands',
        },
      });
    const reqId = draft.body.request._id;
    await request(app).post(`/api/requests/${reqId}/submit`).set('Cookie', raviSession.cookie);

    // Cancel while pending
    const cancelRes = await request(app)
      .post(`/api/requests/${reqId}/cancel`)
      .set('Cookie', raviSession.cookie);
    expect(cancelRes.status).toBe(200);

    const req = await Request.findById(reqId);
    expect(req.status).toBe('cancelled');

    const activeStages = await StageInstance.find({ requestId: reqId, status: 'active' });
    expect(activeStages.length).toBe(0);
  });

  // SLA Scheduler Tests
  test('SLA Scheduler: Idempotent Reminder, Overdue Notice, and Escalation', async () => {
    // Ravi submits a leave request
    const draft = await request(app)
      .post('/api/requests')
      .set('Cookie', raviSession.cookie)
      .send({
        workflowId: leaveWorkflow._id,
        formData: {
          leaveType: 'Sick',
          fromDate: '2027-02-01',
          toDate: '2027-02-02',
          reason: 'Scheduled health checkup',
        },
      });
    const reqId = draft.body.request._id;
    await request(app).post(`/api/requests/${reqId}/submit`).set('Cookie', raviSession.cookie);

    const activeStage = await StageInstance.findOne({ requestId: reqId, status: 'active' });

    // Simulate time passing: move activatedAt and dueAt backwards
    const pastActivated = new Date(Date.now() - 40 * 60 * 60 * 1000); // 40 hours ago
    const pastDue = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago (overdue)
    activeStage.activatedAt = pastActivated;
    activeStage.dueAt = pastDue;
    await activeStage.save();

    // Run SLA passes
    await runSlaPasses();

    const checkedStage = await StageInstance.findById(activeStage._id);
    expect(checkedStage.reminderSentAt).toBeTruthy();
    expect(checkedStage.overdueNotifiedAt).toBeTruthy();

    // Check audit logs
    const reminderLog = await AuditLog.findOne({ requestId: reqId, action: 'reminder_sent' });
    expect(reminderLog).toBeTruthy();

    const overdueLog = await AuditLog.findOne({ requestId: reqId, action: 'marked_overdue' });
    expect(overdueLog).toBeTruthy();

    // Idempotency: run again, assert no duplicate audit logs
    await runSlaPasses();
    const countReminders = await AuditLog.countDocuments({ requestId: reqId, action: 'reminder_sent' });
    expect(countReminders).toBe(1);
  });
});

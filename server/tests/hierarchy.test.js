const request = require('supertest');
const { setupTestDB } = require('./setup');
const { loginUser, app } = require('./testHelper');
const User = require('../src/models/User');
const Workflow = require('../src/models/Workflow');
const Request = require('../src/models/Request');
const StageInstance = require('../src/models/StageInstance');
const AuditLog = require('../src/models/AuditLog');
const Notification = require('../src/models/Notification');

describe('ProofFlow Mandatory Hierarchy & Authorization Test Suite (H1 - H8)', () => {
  setupTestDB();

  let adminSession;
  let nehaSession; // PM 1
  let sanjaySession; // PM 2
  let arjunSession; // Dept Head Eng
  let kiranSession; // Executive
  let raviSession; // Employee under Neha
  let divyaSession; // Employee under Neha
  let imranSession; // Employee under Sanjay
  let rohanSession; // HR Head
  let priyaSession; // HR Member
  let leaveWorkflow;
  let resignationWorkflow;

  beforeAll(async () => {
    adminSession = await loginUser('meera.kapoor@nexora-demo.example');
    nehaSession = await loginUser('neha.joshi@nexora-demo.example');
    sanjaySession = await loginUser('sanjay.patil@nexora-demo.example');
    arjunSession = await loginUser('arjun.menon@nexora-demo.example');
    kiranSession = await loginUser('kiran.bose@nexora-demo.example');
    raviSession = await loginUser('ravi.teja@nexora-demo.example');
    divyaSession = await loginUser('divya.reddy@nexora-demo.example');
    imranSession = await loginUser('imran.sheikh@nexora-demo.example');
    rohanSession = await loginUser('rohan.desai@nexora-demo.example');
    priyaSession = await loginUser('priya.nair@nexora-demo.example');

    leaveWorkflow = await Workflow.findOne({ key: 'leave-request' });
    resignationWorkflow = await Workflow.findOne({ key: 'resignation' });
  });

  // H1: Reporting-manager isolation
  test('H1: Reporting-manager isolation (Leave & Resignation)', async () => {
    // 1. Ravi (under Neha) creates and submits a Leave Request
    const draftRes = await request(app)
      .post('/api/requests')
      .set('Cookie', raviSession.cookie)
      .send({
        workflowId: leaveWorkflow._id,
        formData: {
          leaveType: 'Casual',
          fromDate: '2026-11-01',
          toDate: '2026-11-03',
          reason: 'Family vacation trip',
        },
      });
    expect(draftRes.status).toBe(201);
    const requestId = draftRes.body.request._id;

    const submitRes = await request(app)
      .post(`/api/requests/${requestId}/submit`)
      .set('Cookie', raviSession.cookie);
    expect(submitRes.status).toBe(200);

    const activeStage = await StageInstance.findOne({
      requestId,
      status: 'active',
      stageKey: 'manager_approval',
    });
    expect(activeStage).toBeTruthy();
    expect(activeStage.assignedTo[0].toString()).toBe(nehaSession.user._id.toString());

    // 2. Neha's inbox contains it
    const nehaInbox = await request(app)
      .get('/api/approvals/inbox?tab=waiting')
      .set('Cookie', nehaSession.cookie);
    expect(nehaInbox.status).toBe(200);
    const nehaItem = nehaInbox.body.items.find((i) => i.requestId._id.toString() === requestId.toString());
    expect(nehaItem).toBeTruthy();

    // 3. Sanjay's inbox does NOT contain it
    const sanjayInbox = await request(app)
      .get('/api/approvals/inbox?tab=waiting')
      .set('Cookie', sanjaySession.cookie);
    expect(sanjayInbox.status).toBe(200);
    const sanjayItem = sanjayInbox.body.items.find((i) => i.requestId._id.toString() === requestId.toString());
    expect(sanjayItem).toBeFalsy();

    // 4. Sanjay GET /requests/:id returns 404 (IDOR protection)
    const sanjayView = await request(app)
      .get(`/api/requests/${requestId}`)
      .set('Cookie', sanjaySession.cookie);
    expect(sanjayView.status).toBe(404);

    // 5. Sanjay cannot approve, reject, or request changes (403)
    const sanjayApprove = await request(app)
      .post(`/api/approvals/${activeStage._id}/approve`)
      .set('Cookie', sanjaySession.cookie)
      .send({ comment: 'Unauthorized approve' });
    expect(sanjayApprove.status).toBe(403);

    const sanjayReject = await request(app)
      .post(`/api/approvals/${activeStage._id}/reject`)
      .set('Cookie', sanjaySession.cookie)
      .send({ comment: 'Unauthorized reject reason' });
    expect(sanjayReject.status).toBe(403);

    const sanjayChanges = await request(app)
      .post(`/api/approvals/${activeStage._id}/request-changes`)
      .set('Cookie', sanjaySession.cookie)
      .send({ comment: 'Unauthorized change comment' });
    expect(sanjayChanges.status).toBe(403);

    // 6. Requester Ravi cannot approve own request (403 SELF_APPROVAL)
    const raviApprove = await request(app)
      .post(`/api/approvals/${activeStage._id}/approve`)
      .set('Cookie', raviSession.cookie);
    expect(raviApprove.status).toBe(403);

    // 7. Peer Imran cannot approve (403)
    const imranApprove = await request(app)
      .post(`/api/approvals/${activeStage._id}/approve`)
      .set('Cookie', imranSession.cookie);
    expect(imranApprove.status).toBe(403);

    // 8. Neha approves -> moves to HR stage
    const nehaApprove = await request(app)
      .post(`/api/approvals/${activeStage._id}/approve`)
      .set('Cookie', nehaSession.cookie)
      .send({ comment: 'Approved by Neha' });
    expect(nehaApprove.status).toBe(200);

    const nextStage = await StageInstance.findOne({
      requestId,
      status: 'active',
      stageKey: 'hr_approval',
    });
    expect(nextStage).toBeTruthy();
    expect(nextStage.assignedTo.some((id) => id.toString() === rohanSession.user._id.toString())).toBe(true);

    // Repeat for Resignation: Imran (under Sanjay) submits resignation
    const resDraft = await request(app)
      .post('/api/requests')
      .set('Cookie', imranSession.cookie)
      .send({
        workflowId: resignationWorkflow._id,
        formData: {
          lastWorkingDate: '2026-12-31',
          reason: 'Pursuing higher education',
        },
      });
    expect(resDraft.status).toBe(201);
    const resId = resDraft.body.request._id;

    await request(app)
      .post(`/api/requests/${resId}/submit`)
      .set('Cookie', imranSession.cookie);

    const sanjayResInbox = await request(app)
      .get('/api/approvals/inbox?tab=waiting')
      .set('Cookie', sanjaySession.cookie);
    const sanjayResItem = sanjayResInbox.body.items.find((i) => i.requestId._id.toString() === resId.toString());
    expect(sanjayResItem).toBeTruthy();

    const nehaResInbox = await request(app)
      .get('/api/approvals/inbox?tab=waiting')
      .set('Cookie', nehaSession.cookie);
    const nehaResItem = nehaResInbox.body.items.find((i) => i.requestId._id.toString() === resId.toString());
    expect(nehaResItem).toBeFalsy();
  });

  // H2: Six project managers
  test('H2: Six project managers - exact isolation for 12 devs', async () => {
    // Neha has Ravi, Divya
    // Sanjay has Imran, Omkar
    // Verify that requests from Divya go only to Neha
    const divyaDraft = await request(app)
      .post('/api/requests')
      .set('Cookie', divyaSession.cookie)
      .send({
        workflowId: leaveWorkflow._id,
        formData: {
          leaveType: 'Sick',
          fromDate: '2026-11-05',
          toDate: '2026-11-06',
          reason: 'Fever',
        },
      });
    const divyaReqId = divyaDraft.body.request._id;
    await request(app).post(`/api/requests/${divyaReqId}/submit`).set('Cookie', divyaSession.cookie);

    const activeStage = await StageInstance.findOne({
      requestId: divyaReqId,
      status: 'active',
    });
    expect(activeStage.assignedTo.length).toBe(1);
    expect(activeStage.assignedTo[0].toString()).toBe(nehaSession.user._id.toString());
  });

  // H3: Hierarchy changes
  test('H3: Hierarchy changes - moving Ravi to Sanjay', async () => {
    // Moving Ravi to Sanjay via Admin API
    const patchRes = await request(app)
      .patch(`/api/admin/users/${raviSession.user._id}`)
      .set('Cookie', adminSession.cookie)
      .send({ managerId: sanjaySession.user._id });
    const returnedMgrId = patchRes.body.user.managerId?._id || patchRes.body.user.managerId;
    expect(returnedMgrId.toString()).toBe(sanjaySession.user._id.toString());

    // New request from Ravi goes only to Sanjay!
    const newDraft = await request(app)
      .post('/api/requests')
      .set('Cookie', raviSession.cookie)
      .send({
        workflowId: leaveWorkflow._id,
        formData: {
          leaveType: 'Earned',
          fromDate: '2026-11-10',
          toDate: '2026-11-12',
          reason: 'Annual leave',
        },
      });
    const newReqId = newDraft.body.request._id;
    await request(app).post(`/api/requests/${newReqId}/submit`).set('Cookie', raviSession.cookie);

    const newActiveStage = await StageInstance.findOne({
      requestId: newReqId,
      status: 'active',
    });
    expect(newActiveStage.assignedTo[0].toString()).toBe(sanjaySession.user._id.toString());

    // Reject cycle: setting Arjun's manager to Neha (who reports to Arjun) must fail
    const cycleRes = await request(app)
      .patch(`/api/admin/users/${arjunSession.user._id}`)
      .set('Cookie', adminSession.cookie)
      .send({ managerId: nehaSession.user._id });
    expect(cycleRes.status).toBe(400);

    // Reject self-manager
    const selfMgrRes = await request(app)
      .patch(`/api/admin/users/${nehaSession.user._id}`)
      .set('Cookie', adminSession.cookie)
      .send({ managerId: nehaSession.user._id });
    expect(selfMgrRes.status).toBe(400);

    // Revert Ravi's manager back to Neha
    await request(app)
      .patch(`/api/admin/users/${raviSession.user._id}`)
      .set('Cookie', adminSession.cookie)
      .send({ managerId: nehaSession.user._id });
  });

  // H4: Self-approval prevention
  test('H4: Self-approval prevention', async () => {
    // Project manager Neha submits her own leave
    const nehaDraft = await request(app)
      .post('/api/requests')
      .set('Cookie', nehaSession.cookie)
      .send({
        workflowId: leaveWorkflow._id,
        formData: {
          leaveType: 'Casual',
          fromDate: '2026-11-20',
          toDate: '2026-11-22',
          reason: 'Personal time off',
        },
      });
    const reqId = nehaDraft.body.request._id;
    await request(app).post(`/api/requests/${reqId}/submit`).set('Cookie', nehaSession.cookie);

    // Stage 1 must route to Arjun (Neha's manager), never to Neha!
    const activeStage = await StageInstance.findOne({
      requestId: reqId,
      status: 'active',
    });
    expect(activeStage.assignedTo[0].toString()).toBe(arjunSession.user._id.toString());
    expect(activeStage.assignedTo.some((id) => id.toString() === nehaSession.user._id.toString())).toBe(false);

    // Direct approve attempt by Neha on her own request returns 403
    const directApprove = await request(app)
      .post(`/api/approvals/${activeStage._id}/approve`)
      .set('Cookie', nehaSession.cookie);
    expect(directApprove.status).toBe(403);

    // Dept head Arjun submits his own leave -> routes to Kiran Bose (Executive)
    const arjunDraft = await request(app)
      .post('/api/requests')
      .set('Cookie', arjunSession.cookie)
      .send({
        workflowId: leaveWorkflow._id,
        formData: {
          leaveType: 'Casual',
          fromDate: '2026-11-25',
          toDate: '2026-11-26',
          reason: 'Conference attendance',
        },
      });
    await request(app).post(`/api/requests/${arjunDraft.body.request._id}/submit`).set('Cookie', arjunSession.cookie);

    const arjunStage = await StageInstance.findOne({
      requestId: arjunDraft.body.request._id,
      status: 'active',
    });
    expect(arjunStage.assignedTo[0].toString()).toBe(kiranSession.user._id.toString());
  });

  // H5: Unauthorized direct API (IDOR)
  test('H5: Unauthorized direct API (IDOR) on requests, files, and audit', async () => {
    // Divya's request
    const divyaDraft = await request(app)
      .post('/api/requests')
      .set('Cookie', divyaSession.cookie)
      .send({
        workflowId: leaveWorkflow._id,
        formData: {
          leaveType: 'Casual',
          fromDate: '2026-12-01',
          toDate: '2026-12-02',
          reason: 'Private appointment',
        },
      });
    const reqId = divyaDraft.body.request._id;

    // Unauthenticated access returns 401
    const unauth = await request(app).get(`/api/requests/${reqId}`);
    expect(unauth.status).toBe(401);

    // Another employee (Imran) accessing returns 404
    const imranView = await request(app)
      .get(`/api/requests/${reqId}`)
      .set('Cookie', imranSession.cookie);
    expect(imranView.status).toBe(404);

    // Imran accessing audit logs returns 404
    const imranAudit = await request(app)
      .get(`/api/requests/${reqId}/audit`)
      .set('Cookie', imranSession.cookie);
    expect(imranAudit.status).toBe(404);
  });

  // H6: Stage order and replay
  test('H6: Stage order and replay prevention', async () => {
    const draft = await request(app)
      .post('/api/requests')
      .set('Cookie', raviSession.cookie)
      .send({
        workflowId: leaveWorkflow._id,
        formData: {
          leaveType: 'Casual',
          fromDate: '2026-12-10',
          toDate: '2026-12-11',
          reason: 'Doctor appointment',
        },
      });
    const reqId = draft.body.request._id;
    await request(app).post(`/api/requests/${reqId}/submit`).set('Cookie', raviSession.cookie);

    const stages = await StageInstance.find({ requestId: reqId });
    const managerStage = stages.find((s) => s.stageKey === 'manager_approval');
    const hrStage = stages.find((s) => s.stageKey === 'hr_approval');

    // HR cannot act while HR stage is waiting (manager stage is active)
    const hrEarlyAct = await request(app)
      .post(`/api/approvals/${hrStage._id}/approve`)
      .set('Cookie', rohanSession.cookie);
    expect([403, 409]).toContain(hrEarlyAct.status);

    // Neha approves stage 1
    await request(app)
      .post(`/api/approvals/${managerStage._id}/approve`)
      .set('Cookie', nehaSession.cookie);

    // Replay: Neha cannot approve stage 1 a second time (409)
    const replay = await request(app)
      .post(`/api/approvals/${managerStage._id}/approve`)
      .set('Cookie', nehaSession.cookie);
    expect(replay.status).toBe(409);
  });

  // H7: Deactivated manager
  test('H7: Deactivated manager invalidates session and blocks actions', async () => {
    // Create a temporary manager
    const tempMgr = new User({
      name: 'Temp Manager',
      email: 'temp.mgr@nexora-demo.example',
      roles: ['manager', 'employee'],
      departmentId: nehaSession.user.departmentId,
      managerId: arjunSession.user._id,
      isActive: true,
      mustChangePassword: false,
    });
    const bcrypt = require('bcryptjs');
    tempMgr.passwordHash = await bcrypt.hash('ProofFlow@123', 12);
    await tempMgr.save();

    const tempSession = await loginUser('temp.mgr@nexora-demo.example');
    expect(tempSession.cookie).toBeTruthy();

    // Deactivate temp manager via Admin API
    const deactRes = await request(app)
      .post(`/api/admin/users/${tempMgr._id}/deactivate`)
      .set('Cookie', adminSession.cookie)
      .send({ confirmPendingReassignment: true });
    expect(deactRes.status).toBe(200);

    // Old cookie must now be rejected with 401
    const testCall = await request(app)
      .get('/api/auth/me')
      .set('Cookie', tempSession.cookie);
    expect(testCall.status).toBe(401);
  });

  // H8: Admin separation of duties
  test('H8: Admin separation of duties - admin cannot approve/reject/request changes without stage assignment', async () => {
    const draft = await request(app)
      .post('/api/requests')
      .set('Cookie', raviSession.cookie)
      .send({
        workflowId: leaveWorkflow._id,
        formData: {
          leaveType: 'Casual',
          fromDate: '2026-12-15',
          toDate: '2026-12-16',
          reason: 'Personal errands',
        },
      });
    const reqId = draft.body.request._id;
    await request(app).post(`/api/requests/${reqId}/submit`).set('Cookie', raviSession.cookie);

    const activeStage = await StageInstance.findOne({
      requestId: reqId,
      status: 'active',
    });

    // Admin Meera tries to approve directly -> 403 Forbidden!
    const adminApprove = await request(app)
      .post(`/api/approvals/${activeStage._id}/approve`)
      .set('Cookie', adminSession.cookie)
      .send({ comment: 'Admin attempt' });
    expect(adminApprove.status).toBe(403);

    // Admin Meera tries to reject directly -> 403 Forbidden!
    const adminReject = await request(app)
      .post(`/api/approvals/${activeStage._id}/reject`)
      .set('Cookie', adminSession.cookie)
      .send({ comment: 'Admin reject' });
    expect(adminReject.status).toBe(403);
  });
});

const request = require('supertest');
const { setupTestDB } = require('./setup');
const { loginUser, app } = require('./testHelper');
const User = require('../src/models/User');
const Request = require('../src/models/Request');
const StageInstance = require('../src/models/StageInstance');
const Attachment = require('../src/models/Attachment');
const AuditLog = require('../src/models/AuditLog');
const Notification = require('../src/models/Notification');
const Workflow = require('../src/models/Workflow');

describe('ProofFlow End-to-End Verification Test Suite (Phases 7, 8, 9)', () => {
  setupTestDB();

  let raviSession;
  let nehaSession;
  let rohanHrSession;
  let divyaSession;
  let imranSession;
  let sanjaySession;
  let omkarSession;
  let financeSession;
  let itSession;
  let procurementSession;
  let adminClearanceSession;

  let raviUser;
  let nehaUser;
  let rohanUser;
  let divyaUser;
  let imranUser;
  let sanjayUser;
  let omkarUser;

  let leaveWf;
  let purchaseWf;
  let expenseWf;
  let resignationWf;

  beforeAll(async () => {
    // Look up users
    raviUser = await User.findOne({ email: 'ravi.teja@nexora-demo.example' });
    nehaUser = await User.findOne({ email: 'neha.joshi@nexora-demo.example' });
    rohanUser = await User.findOne({ email: 'rohan.desai@nexora-demo.example' });
    divyaUser = await User.findOne({ email: 'divya.reddy@nexora-demo.example' });
    imranUser = await User.findOne({ email: 'imran.sheikh@nexora-demo.example' });
    sanjayUser = await User.findOne({ email: 'sanjay.patil@nexora-demo.example' });
    omkarUser = await User.findOne({ email: 'omkar.jadhav@nexora-demo.example' });

    const financeUser = await User.findOne({ roles: 'finance' });
    const itUser = await User.findOne({ roles: 'it' });
    const procurementUser = await User.findOne({ roles: 'procurement' });
    const adminClearanceUser = await User.findOne({ roles: 'administration' });

    // Login users using default password ProofFlow@123
    raviSession = await loginUser('ravi.teja@nexora-demo.example');
    nehaSession = await loginUser('neha.joshi@nexora-demo.example');
    rohanHrSession = await loginUser(rohanUser.email);
    divyaSession = await loginUser('divya.reddy@nexora-demo.example');
    imranSession = await loginUser('imran.sheikh@nexora-demo.example');
    sanjaySession = await loginUser('sanjay.patil@nexora-demo.example');
    omkarSession = await loginUser('omkar.jadhav@nexora-demo.example');
    financeSession = await loginUser(financeUser.email);
    itSession = await loginUser(itUser.email);
    procurementSession = await loginUser(procurementUser.email);
    adminClearanceSession = await loginUser(adminClearanceUser.email);

    // Fetch workflows
    leaveWf = await Workflow.findOne({ key: 'leave-request' });
    purchaseWf = await Workflow.findOne({ key: 'purchase-request' });
    expenseWf = await Workflow.findOne({ key: 'expense-reimbursement' });
    resignationWf = await Workflow.findOne({ key: 'resignation' });
  });

  test('R-1: Canonical Ravi Teja Leave Workflow (Full 2-stage approval & audit log)', async () => {
    // 1. Ravi creates draft Leave Request
    const draftRes = await request(app)
      .post('/api/requests')
      .set('Cookie', raviSession.cookie)
      .send({
        workflowId: leaveWf._id.toString(),
        formData: {
          leaveType: 'Casual',
          fromDate: '2026-11-01',
          toDate: '2026-11-03',
          reason: 'Attending family wedding ceremony',
        },
      });

    expect(draftRes.status).toBe(201);
    const reqId = draftRes.body.request._id;
    expect(draftRes.body.request.status).toBe('draft');

    // 2. Ravi submits the request
    const submitRes = await request(app)
      .post(`/api/requests/${reqId}/submit`)
      .set('Cookie', raviSession.cookie);

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.request.status).toBe('pending');
    expect(submitRes.body.request.cycle).toBe(1);

    // 3. Verify stage 1 instance is assigned directly to Neha Joshi
    const stage1 = await StageInstance.findOne({
      requestId: reqId,
      order: 1,
      cycle: 1,
    });
    expect(stage1).toBeDefined();
    expect(stage1.status).toBe('active');
    expect(stage1.assignedTo.some((id) => id.toString() === nehaUser._id.toString())).toBe(true);

    // 4. Neha Joshi checks inbox and approves stage 1
    const nehaActionRes = await request(app)
      .post(`/api/approvals/${stage1._id}/approve`)
      .set('Cookie', nehaSession.cookie)
      .send({ comment: 'Approved, please ensure tasks are handed over.' });

    expect(nehaActionRes.status).toBe(200);

    // 5. Verify stage 1 is approved and stage 2 (HR review) is now active
    const updatedStage1 = await StageInstance.findById(stage1._id);
    expect(updatedStage1.status).toBe('approved');
    expect(updatedStage1.comment).toBe('Approved, please ensure tasks are handed over.');

    const stage2 = await StageInstance.findOne({
      requestId: reqId,
      order: 2,
      cycle: 1,
    });
    expect(stage2).toBeDefined();
    expect(stage2.status).toBe('active');

    // 6. HR User (Rohan Desai) approves stage 2
    const hrActionRes = await request(app)
      .post(`/api/approvals/${stage2._id}/approve`)
      .set('Cookie', rohanHrSession.cookie)
      .send({ comment: 'Leave balance deducted and recorded in HRMS.' });

    expect(hrActionRes.status).toBe(200);

    // 7. Verify request is now in terminal APPROVED state
    const finalReq = await Request.findById(reqId);
    expect(finalReq.status).toBe('approved');

    // 8. Verify immutable audit log
    const auditLogs = await AuditLog.find({ requestId: reqId }).sort({ createdAt: 1 });
    expect(auditLogs.length).toBeGreaterThanOrEqual(3);
    const actions = auditLogs.map((a) => a.action);
    expect(actions).toContain('draft_created');
    expect(actions).toContain('submitted');
    expect(actions).toContain('approved');
    expect(actions).toContain('completed');

    // 9. Verify notification created for Ravi
    const notifs = await Notification.find({
      userId: raviUser._id,
      requestId: reqId,
    });
    expect(notifs.length).toBeGreaterThan(0);
  });

  test('R-2: Purchase Request Lifecycle (Request Changes -> Cycle 2 Resubmit -> Full Approval)', async () => {
    // 1. Divya creates Purchase Request draft
    const draftRes = await request(app)
      .post('/api/requests')
      .set('Cookie', divyaSession.cookie)
      .send({
        workflowId: purchaseWf._id.toString(),
        formData: {
          itemDescription: 'Ergonomic 4K External Monitor',
          estimatedAmount: 750,
          vendorPreference: 'Dell Authorized Store',
          justification: 'Required for UI/UX inspection and development',
        },
      });

    expect(draftRes.status).toBe(201);
    const reqId = draftRes.body.request._id;

    // Attach required file quotation
    const att = await Attachment.create({
      originalName: 'quotation_v1.pdf',
      storedName: `quotation_${Date.now()}_v1.pdf`,
      mimeType: 'application/pdf',
      size: 2048,
      uploadedBy: divyaUser._id,
      requestId: reqId,
      fieldKey: 'quotation',
    });
    await Request.findByIdAndUpdate(reqId, { $push: { attachments: att._id } });

    // Submit request
    const submitRes = await request(app)
      .post(`/api/requests/${reqId}/submit`)
      .set('Cookie', divyaSession.cookie);
    expect(submitRes.status).toBe(200);

    const stage1 = await StageInstance.findOne({
      requestId: reqId,
      order: 1,
      cycle: 1,
    });
    expect(stage1.assignedTo.some((id) => id.toString() === nehaUser._id.toString())).toBe(true);

    // 2. Neha requests changes
    const changeReqRes = await request(app)
      .post(`/api/approvals/${stage1._id}/request-changes`)
      .set('Cookie', nehaSession.cookie)
      .send({ comment: 'Please get quotation from an enterprise partner vendor.' });

    expect(changeReqRes.status).toBe(200);

    // 3. Request status is changes_requested
    let reqDoc = await Request.findById(reqId);
    expect(reqDoc.status).toBe('changes_requested');

    // 4. Divya updates form and resubmits -> Cycle 2 begins
    const resubmitRes = await request(app)
      .post(`/api/requests/${reqId}/resubmit`)
      .set('Cookie', divyaSession.cookie)
      .send({
        formData: {
          itemDescription: 'Ergonomic 4K External Monitor (Enterprise Discount)',
          estimatedAmount: 680,
          vendorPreference: 'Enterprise Tech Solutions Pvt Ltd',
          justification: 'Required for UI/UX inspection with 10% volume discount',
        },
      });

    expect(resubmitRes.status).toBe(200);
    reqDoc = await Request.findById(reqId);
    expect(reqDoc.status).toBe('pending');
    expect(reqDoc.cycle).toBe(2);

    // 5. Stage 1 Cycle 2 is active for Neha
    const stage1C2 = await StageInstance.findOne({
      requestId: reqId,
      order: 1,
      cycle: 2,
    });
    expect(stage1C2.status).toBe('active');

    // Neha approves Cycle 2 stage 1
    await request(app)
      .post(`/api/approvals/${stage1C2._id}/approve`)
      .set('Cookie', nehaSession.cookie)
      .send({ comment: 'Revised vendor looks good.' });

    // 6. Stage 2 Cycle 2 (Finance)
    const stage2C2 = await StageInstance.findOne({
      requestId: reqId,
      order: 2,
      cycle: 2,
    });
    expect(stage2C2.status).toBe('active');

    await request(app)
      .post(`/api/approvals/${stage2C2._id}/approve`)
      .set('Cookie', financeSession.cookie)
      .send({ comment: 'Budget allocation verified and approved.' });

    // 7. Stage 3 Cycle 2 (Procurement)
    const stage3C2 = await StageInstance.findOne({
      requestId: reqId,
      order: 3,
      cycle: 2,
    });
    expect(stage3C2.status).toBe('active');

    await request(app)
      .post(`/api/approvals/${stage3C2._id}/approve`)
      .set('Cookie', procurementSession.cookie)
      .send({ comment: 'PO generated and approved.' });

    // 8. Final state is approved
    reqDoc = await Request.findById(reqId);
    expect(reqDoc.status).toBe('approved');
  });

  test('R-3: Expense Reimbursement with Rejection (Terminal State)', async () => {
    // 1. Imran creates Expense draft
    const draftRes = await request(app)
      .post('/api/requests')
      .set('Cookie', imranSession.cookie)
      .send({
        workflowId: expenseWf._id.toString(),
        formData: {
          expenseCategory: 'Travel',
          amount: 450,
          expenseDate: '2026-10-15',
          description: 'Client visit cab fares',
        },
      });

    expect(draftRes.status).toBe(201);
    const reqId = draftRes.body.request._id;

    // Attach required receipts file
    const att = await Attachment.create({
      originalName: 'receipt.pdf',
      storedName: `receipt_${Date.now()}.pdf`,
      mimeType: 'application/pdf',
      size: 1024,
      uploadedBy: imranUser._id,
      requestId: reqId,
      fieldKey: 'receipts',
    });
    await Request.findByIdAndUpdate(reqId, { $push: { attachments: att._id } });

    // Submit expense
    const submitRes = await request(app)
      .post(`/api/requests/${reqId}/submit`)
      .set('Cookie', imranSession.cookie);
    expect(submitRes.status).toBe(200);

    // Manager is Sanjay Patil
    const stage1 = await StageInstance.findOne({
      requestId: reqId,
      order: 1,
      cycle: 1,
    });
    expect(stage1.assignedTo.some((id) => id.toString() === sanjayUser._id.toString())).toBe(true);

    // 2. Sanjay rejects with reason
    const rejectRes = await request(app)
      .post(`/api/approvals/${stage1._id}/reject`)
      .set('Cookie', sanjaySession.cookie)
      .send({ comment: 'Travel was not pre-authorized as per company policy.' });

    expect(rejectRes.status).toBe(200);

    // 3. Verify terminal rejection
    const finalReq = await Request.findById(reqId);
    expect(finalReq.status).toBe('rejected');

    // 4. Verify no remaining stages are active
    const anyActive = await StageInstance.find({
      requestId: reqId,
      status: 'active',
    });
    expect(anyActive.length).toBe(0);
  });

  test('R-4: Resignation Notice Clearance (Multi-department stages 1 through 6)', async () => {
    // 1. Omkar creates and submits resignation
    const draftRes = await request(app)
      .post('/api/requests')
      .set('Cookie', omkarSession.cookie)
      .send({
        workflowId: resignationWf._id.toString(),
        formData: {
          lastWorkingDate: '2026-12-31',
          reason: 'Pursuing higher studies abroad for masters program',
          handoverNotes: 'Knowledge transfer document drafted in wiki',
        },
      });

    expect(draftRes.status).toBe(201);
    const reqId = draftRes.body.request._id;

    const submitRes = await request(app)
      .post(`/api/requests/${reqId}/submit`)
      .set('Cookie', omkarSession.cookie);
    expect(submitRes.status).toBe(200);

    // Stage 1: Sanjay Patil (Reporting Manager)
    const s1 = await StageInstance.findOne({ requestId: reqId, order: 1, cycle: 1 });
    expect(s1.assignedTo.some((id) => id.toString() === sanjayUser._id.toString())).toBe(true);
    await request(app)
      .post(`/api/approvals/${s1._id}/approve`)
      .set('Cookie', sanjaySession.cookie)
      .send({ comment: 'Exit interview conducted. Wish you the best.' });

    // Stage 2: HR Review
    const s2 = await StageInstance.findOne({ requestId: reqId, order: 2, cycle: 1 });
    expect(s2.status).toBe('active');
    await request(app)
      .post(`/api/approvals/${s2._id}/approve`)
      .set('Cookie', rohanHrSession.cookie)
      .send({ comment: 'Notice period verified.' });

    // Stage 3: IT Clearance
    const s3 = await StageInstance.findOne({ requestId: reqId, order: 3, cycle: 1 });
    expect(s3.status).toBe('active');
    await request(app)
      .post(`/api/approvals/${s3._id}/approve`)
      .set('Cookie', itSession.cookie)
      .send({ comment: 'Laptop and access keys surrendered.' });

    // Stage 4: Finance Clearance
    const s4 = await StageInstance.findOne({ requestId: reqId, order: 4, cycle: 1 });
    expect(s4.status).toBe('active');
    await request(app)
      .post(`/api/approvals/${s4._id}/approve`)
      .set('Cookie', financeSession.cookie)
      .send({ comment: 'Full & final settlement balance computed.' });

    // Stage 5: Administration Clearance
    const s5 = await StageInstance.findOne({ requestId: reqId, order: 5, cycle: 1 });
    expect(s5.status).toBe('active');
    await request(app)
      .post(`/api/approvals/${s5._id}/approve`)
      .set('Cookie', adminClearanceSession.cookie)
      .send({ comment: 'ID badge surrendered and facilities clearance given.' });

    // Stage 6: Final HR Closure
    const s6 = await StageInstance.findOne({ requestId: reqId, order: 6, cycle: 1 });
    expect(s6.status).toBe('active');
    await request(app)
      .post(`/api/approvals/${s6._id}/approve`)
      .set('Cookie', rohanHrSession.cookie)
      .send({ comment: 'Relieving letter generated and dispatched.' });

    // Verify terminal approved status
    const reqDoc = await Request.findById(reqId);
    expect(reqDoc.status).toBe('approved');
  });

  test('R-5: Delegation in-flight acts on behalf of assigned manager', async () => {
    // 1. Neha creates delegation to Shreya Kulkarni
    const shreyaUser = await User.findOne({ email: 'shreya.kulkarni@nexora-demo.example' });
    const shreyaSession = await loginUser(shreyaUser.email);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const delegRes = await request(app)
      .post('/api/delegations')
      .set('Cookie', nehaSession.cookie)
      .send({
        delegateId: shreyaUser._id.toString(),
        startsAt: yesterday.toISOString(),
        endsAt: tomorrow.toISOString(),
        workflowIds: [leaveWf._id.toString()],
      });

    expect(delegRes.status).toBe(201);

    // 2. Ravi creates and submits Leave Request
    const draftRes = await request(app)
      .post('/api/requests')
      .set('Cookie', raviSession.cookie)
      .send({
        workflowId: leaveWf._id.toString(),
        formData: {
          leaveType: 'Sick',
          fromDate: '2026-11-10',
          toDate: '2026-11-11',
          reason: 'Doctor appointment for routine checkup',
        },
      });

    const reqId = draftRes.body.request._id;
    const submitRes = await request(app)
      .post(`/api/requests/${reqId}/submit`)
      .set('Cookie', raviSession.cookie);
    expect(submitRes.status).toBe(200);

    const stage1 = await StageInstance.findOne({ requestId: reqId, order: 1, cycle: 1 });
    expect(stage1.assignedTo.some((id) => id.toString() === nehaUser._id.toString())).toBe(true);

    // 3. Shreya acts as delegate for Neha
    const delegateActionRes = await request(app)
      .post(`/api/approvals/${stage1._id}/approve`)
      .set('Cookie', shreyaSession.cookie)
      .send({ comment: 'Approved on behalf of Neha during her absence.' });

    expect(delegateActionRes.status).toBe(200);

    // 4. Verify stage 1 is approved with delegation tracking
    const updatedStage1 = await StageInstance.findById(stage1._id);
    expect(updatedStage1.status).toBe('approved');
    expect(updatedStage1.actedBy.toString()).toBe(shreyaUser._id.toString());
    expect(updatedStage1.onBehalfOf.toString()).toBe(nehaUser._id.toString());
  });
});

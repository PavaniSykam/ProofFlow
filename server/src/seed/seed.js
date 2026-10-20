const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const Organization = require('../models/Organization');
const Department = require('../models/Department');
const Role = require('../models/Role');
const User = require('../models/User');
const Workflow = require('../models/Workflow');
const WorkflowVersion = require('../models/WorkflowVersion');
const Counter = require('../models/Counter');
const logger = require('../utils/logger');

const BCRYPT_COST = 12;

async function seed(mongoUriOverride = null) {
  if (config.nodeEnv === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error('Refusing to seed in production environment without ALLOW_PROD_SEED=true');
  }

  const uri = mongoUriOverride || config.mongoUri;
  if (mongoose.connection.readyState === 0) {
    if (process.env.SEED_DNS_SERVER) {
      dns.setServers([process.env.SEED_DNS_SERVER]);
    }
    await mongoose.connect(uri);
  }

  const defaultPassword = config.seedDefaultPassword || 'ProofFlow@123';
  const passwordHash = await bcrypt.hash(defaultPassword, BCRYPT_COST);

  // 1. Organization
  await Organization.findOneAndUpdate(
    {},
    {
      name: 'Nexora Technologies Pvt. Ltd.',
      settings: {
        defaultSlaHours: 48,
        reminderPercent: 75,
        schedulerIntervalSeconds: 60,
      },
    },
    { upsert: true, new: true }
  );

  // 2. Roles
  const rolesData = [
    { key: 'employee', name: 'Employee', isApproverRole: false, isSystem: true },
    { key: 'admin', name: 'Administrator', isApproverRole: false, isSystem: true },
    { key: 'manager', name: 'Manager', isApproverRole: true, isSystem: false },
    { key: 'department_head', name: 'Department Head', isApproverRole: true, isSystem: false },
    { key: 'hr', name: 'Human Resources', isApproverRole: true, isSystem: false },
    { key: 'finance', name: 'Finance', isApproverRole: true, isSystem: false },
    { key: 'it', name: 'Information Technology', isApproverRole: true, isSystem: false },
    { key: 'procurement', name: 'Procurement', isApproverRole: true, isSystem: false },
    { key: 'administration', name: 'Administration', isApproverRole: true, isSystem: false },
    { key: 'executive', name: 'Executive', isApproverRole: true, isSystem: false },
  ];

  for (const r of rolesData) {
    await Role.findOneAndUpdate({ key: r.key }, r, { upsert: true });
  }

  // 3. Departments
  const deptsData = [
    { code: 'ENG', name: 'Engineering' },
    { code: 'HR', name: 'Human Resources' },
    { code: 'FIN', name: 'Finance' },
    { code: 'PROC', name: 'Procurement' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'ADMIN', name: 'Administration' },
  ];

  const deptMap = {};
  for (const d of deptsData) {
    const dept = await Department.findOneAndUpdate(
      { code: d.code },
      { name: d.name, isActive: true },
      { upsert: true, new: true }
    );
    deptMap[d.code] = dept;
  }

  // 4. Users (Two-phase upsert: create users first, then link managerId and department head)
  const usersToSeed = [
    // Executive / Top-level
    {
      name: 'Kiran Bose',
      email: 'kiran.bose@nexora-demo.example',
      roles: ['executive', 'employee'],
      deptCode: 'ADMIN',
      managerEmail: null,
    },
    // Admin
    {
      name: 'Meera Kapoor',
      email: 'meera.kapoor@nexora-demo.example',
      roles: ['admin', 'employee'],
      deptCode: 'ADMIN',
      managerEmail: 'kiran.bose@nexora-demo.example',
    },
    // Engineering Head
    {
      name: 'Arjun Menon',
      email: 'arjun.menon@nexora-demo.example',
      roles: ['department_head', 'employee'],
      deptCode: 'ENG',
      managerEmail: 'kiran.bose@nexora-demo.example',
    },
    // Six Project Managers (Engineering)
    {
      name: 'Neha Joshi',
      email: 'neha.joshi@nexora-demo.example',
      roles: ['manager', 'employee'],
      deptCode: 'ENG',
      managerEmail: 'arjun.menon@nexora-demo.example',
    },
    {
      name: 'Sanjay Patil',
      email: 'sanjay.patil@nexora-demo.example',
      roles: ['manager', 'employee'],
      deptCode: 'ENG',
      managerEmail: 'arjun.menon@nexora-demo.example',
    },
    {
      name: 'Aditya Bhat',
      email: 'aditya.bhat@nexora-demo.example',
      roles: ['manager', 'employee'],
      deptCode: 'ENG',
      managerEmail: 'arjun.menon@nexora-demo.example',
    },
    {
      name: 'Shreya Kulkarni',
      email: 'shreya.kulkarni@nexora-demo.example',
      roles: ['manager', 'employee'],
      deptCode: 'ENG',
      managerEmail: 'arjun.menon@nexora-demo.example',
    },
    {
      name: 'Manoj Gill',
      email: 'manoj.gill@nexora-demo.example',
      roles: ['manager', 'employee'],
      deptCode: 'ENG',
      managerEmail: 'arjun.menon@nexora-demo.example',
    },
    {
      name: 'Tanvi Mehta',
      email: 'tanvi.mehta@nexora-demo.example',
      roles: ['manager', 'employee'],
      deptCode: 'ENG',
      managerEmail: 'arjun.menon@nexora-demo.example',
    },
    // 12 Engineering Employees (2 per manager)
    {
      name: 'Ravi Teja',
      email: 'ravi.teja@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'ENG',
      managerEmail: 'neha.joshi@nexora-demo.example',
    },
    {
      name: 'Divya Reddy',
      email: 'divya.reddy@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'ENG',
      managerEmail: 'neha.joshi@nexora-demo.example',
    },
    {
      name: 'Imran Sheikh',
      email: 'imran.sheikh@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'ENG',
      managerEmail: 'sanjay.patil@nexora-demo.example',
    },
    {
      name: 'Omkar Jadhav',
      email: 'omkar.jadhav@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'ENG',
      managerEmail: 'sanjay.patil@nexora-demo.example',
    },
    {
      name: 'Karan Malhotra',
      email: 'karan.malhotra@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'ENG',
      managerEmail: 'aditya.bhat@nexora-demo.example',
    },
    {
      name: 'Sneha Banerjee',
      email: 'sneha.banerjee@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'ENG',
      managerEmail: 'aditya.bhat@nexora-demo.example',
    },
    {
      name: 'Harish Nambiar',
      email: 'harish.nambiar@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'ENG',
      managerEmail: 'shreya.kulkarni@nexora-demo.example',
    },
    {
      name: 'Isha Chopra',
      email: 'isha.chopra@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'ENG',
      managerEmail: 'shreya.kulkarni@nexora-demo.example',
    },
    {
      name: 'Lokesh Yadav',
      email: 'lokesh.yadav@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'ENG',
      managerEmail: 'manoj.gill@nexora-demo.example',
    },
    {
      name: 'Meghna Das',
      email: 'meghna.das@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'ENG',
      managerEmail: 'manoj.gill@nexora-demo.example',
    },
    {
      name: 'Faisal Khan',
      email: 'faisal.khan@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'ENG',
      managerEmail: 'tanvi.mehta@nexora-demo.example',
    },
    {
      name: 'Nikita Pawar',
      email: 'nikita.pawar@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'ENG',
      managerEmail: 'tanvi.mehta@nexora-demo.example',
    },
    // HR Department
    {
      name: 'Rohan Desai',
      email: 'rohan.desai@nexora-demo.example',
      roles: ['hr', 'department_head', 'employee'],
      deptCode: 'HR',
      managerEmail: 'kiran.bose@nexora-demo.example',
    },
    {
      name: 'Priya Nair',
      email: 'priya.nair@nexora-demo.example',
      roles: ['hr', 'employee'],
      deptCode: 'HR',
      managerEmail: 'rohan.desai@nexora-demo.example',
    },
    {
      name: 'Pooja Singh',
      email: 'pooja.singh@nexora-demo.example',
      roles: ['employee'],
      deptCode: 'HR',
      managerEmail: 'rohan.desai@nexora-demo.example',
    },
    // Finance Department
    {
      name: 'Karthik Iyer',
      email: 'karthik.iyer@nexora-demo.example',
      roles: ['finance', 'department_head', 'employee'],
      deptCode: 'FIN',
      managerEmail: 'kiran.bose@nexora-demo.example',
    },
    {
      name: 'Lakshmi Pillai',
      email: 'lakshmi.pillai@nexora-demo.example',
      roles: ['finance', 'employee'],
      deptCode: 'FIN',
      managerEmail: 'karthik.iyer@nexora-demo.example',
    },
    // Procurement Department
    {
      name: 'Vikram Shah',
      email: 'vikram.shah@nexora-demo.example',
      roles: ['procurement', 'department_head', 'employee'],
      deptCode: 'PROC',
      managerEmail: 'kiran.bose@nexora-demo.example',
    },
    // IT Department
    {
      name: 'Ananya Rao',
      email: 'ananya.rao@nexora-demo.example',
      roles: ['it', 'department_head', 'employee'],
      deptCode: 'IT',
      managerEmail: 'kiran.bose@nexora-demo.example',
    },
    // Administration Department
    {
      name: 'Sunita Verma',
      email: 'sunita.verma@nexora-demo.example',
      roles: ['administration', 'employee'],
      deptCode: 'ADMIN',
      managerEmail: 'kiran.bose@nexora-demo.example',
    },
  ];

  const userMap = {};
  for (const u of usersToSeed) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = new User({
        name: u.name,
        email: u.email,
        passwordHash,
        roles: u.roles,
        departmentId: deptMap[u.deptCode]._id,
        isActive: true,
        mustChangePassword: true,
      });
      await user.save();
    } else {
      user.name = u.name;
      user.roles = u.roles;
      user.departmentId = deptMap[u.deptCode]._id;
      user.isActive = true;
      user.passwordHash = passwordHash;
      await user.save();
    }
    userMap[u.email] = user;
  }

  // Link Managers
  for (const u of usersToSeed) {
    if (u.managerEmail && userMap[u.managerEmail]) {
      await User.findByIdAndUpdate(userMap[u.email]._id, {
        managerId: userMap[u.managerEmail]._id,
      });
    }
  }

  // Set Department Heads
  const deptHeads = {
    ENG: 'arjun.menon@nexora-demo.example',
    HR: 'rohan.desai@nexora-demo.example',
    FIN: 'karthik.iyer@nexora-demo.example',
    PROC: 'vikram.shah@nexora-demo.example',
    IT: 'ananya.rao@nexora-demo.example',
    ADMIN: 'kiran.bose@nexora-demo.example',
  };

  for (const [code, email] of Object.entries(deptHeads)) {
    if (userMap[email]) {
      await Department.findByIdAndUpdate(deptMap[code]._id, {
        headUserId: userMap[email]._id,
      });
    }
  }

  const adminUser = userMap['meera.kapoor@nexora-demo.example'];

  // 5. Seed Workflows & Versions (Leave, Purchase, Expense, Resignation)
  const workflowsData = [
    {
      key: 'leave-request',
      name: 'Leave Request',
      description: 'Employee paid, sick, or casual leave request approval workflow',
      fields: [
        {
          key: 'leaveType',
          label: 'Leave Type',
          type: 'dropdown',
          options: ['Casual', 'Sick', 'Earned'],
          required: true,
          order: 1,
        },
        {
          key: 'fromDate',
          label: 'From Date',
          type: 'date',
          required: true,
          order: 2,
        },
        {
          key: 'toDate',
          label: 'To Date',
          type: 'date',
          required: true,
          order: 3,
        },
        {
          key: 'reason',
          label: 'Reason for Leave',
          type: 'textarea',
          required: true,
          minLength: 5,
          order: 4,
        },
        {
          key: 'medicalCertificate',
          label: 'Medical Certificate (if sick leave)',
          type: 'file',
          required: false,
          file: {
            allowedTypes: ['.pdf', '.png', '.jpg', '.jpeg'],
            maxSizeMB: 5,
            maxFiles: 1,
          },
          order: 5,
        },
      ],
      stages: [
        {
          key: 'manager_approval',
          name: 'Reporting Manager Review',
          order: 1,
          approver: { type: 'reporting_manager' },
          slaHours: 24,
          reminderPercent: 75,
          escalation: {
            enabled: true,
            afterHoursOverdue: 24,
            action: 'reassign',
            target: { type: 'manager_of_approver' },
            nextSlaHours: 24,
            maxLevels: 2,
          },
          locksCancellation: false,
        },
        {
          key: 'hr_approval',
          name: 'HR Leave Record',
          order: 2,
          approver: { type: 'role', roleKey: 'hr' },
          slaHours: 48,
          locksCancellation: true,
        },
      ],
      settings: { allowCancel: true, resubmitMode: 'restart' },
    },
    {
      key: 'purchase-request',
      name: 'Purchase Request',
      description: 'Procurement and equipment purchase approval workflow',
      fields: [
        {
          key: 'itemDescription',
          label: 'Item Description',
          type: 'text',
          required: true,
          order: 1,
        },
        {
          key: 'estimatedAmount',
          label: 'Estimated Amount ($)',
          type: 'number',
          min: 1,
          required: true,
          order: 2,
        },
        {
          key: 'vendorPreference',
          label: 'Preferred Vendor',
          type: 'text',
          required: false,
          order: 3,
        },
        {
          key: 'justification',
          label: 'Business Justification',
          type: 'textarea',
          required: true,
          order: 4,
        },
        {
          key: 'quotation',
          label: 'Vendor Quotation / Pro-forma',
          type: 'file',
          required: true,
          file: {
            allowedTypes: ['.pdf', '.png', '.jpg', '.jpeg'],
            maxSizeMB: 5,
            maxFiles: 1,
          },
          order: 5,
        },
      ],
      stages: [
        {
          key: 'manager_approval',
          name: 'Reporting Manager Approval',
          order: 1,
          approver: { type: 'reporting_manager' },
          slaHours: 24,
          locksCancellation: false,
        },
        {
          key: 'finance_approval',
          name: 'Finance Review',
          order: 2,
          approver: { type: 'role', roleKey: 'finance' },
          slaHours: 48,
          locksCancellation: false,
        },
        {
          key: 'procurement_approval',
          name: 'Procurement Clearance',
          order: 3,
          approver: { type: 'role', roleKey: 'procurement' },
          slaHours: 48,
          locksCancellation: true,
        },
      ],
      settings: { allowCancel: true, resubmitMode: 'restart' },
    },
    {
      key: 'expense-reimbursement',
      name: 'Expense Reimbursement',
      description: 'Business travel, meals, and software expense reimbursement workflow',
      fields: [
        {
          key: 'expenseCategory',
          label: 'Expense Category',
          type: 'dropdown',
          options: ['Travel', 'Meals', 'Office Supplies', 'Software', 'Other'],
          required: true,
          order: 1,
        },
        {
          key: 'amount',
          label: 'Total Amount ($)',
          type: 'number',
          min: 1,
          required: true,
          order: 2,
        },
        {
          key: 'expenseDate',
          label: 'Expense Date',
          type: 'date',
          required: true,
          order: 3,
        },
        {
          key: 'description',
          label: 'Expense Details',
          type: 'textarea',
          required: true,
          order: 4,
        },
        {
          key: 'receipts',
          label: 'Receipts / Invoices',
          type: 'file',
          required: true,
          file: {
            allowedTypes: ['.pdf', '.png', '.jpg', '.jpeg'],
            maxSizeMB: 5,
            maxFiles: 1,
          },
          order: 5,
        },
      ],
      stages: [
        {
          key: 'manager_approval',
          name: 'Manager Verification',
          order: 1,
          approver: { type: 'reporting_manager' },
          slaHours: 24,
          locksCancellation: false,
        },
        {
          key: 'finance_approval',
          name: 'Finance Reimbursement Approval',
          order: 2,
          approver: { type: 'role', roleKey: 'finance' },
          slaHours: 48,
          locksCancellation: true,
        },
      ],
      settings: { allowCancel: true, resubmitMode: 'restart' },
    },
    {
      key: 'resignation',
      name: 'Resignation Workflow',
      description: 'Employee resignation notice and exit clearance workflow',
      fields: [
        {
          key: 'lastWorkingDate',
          label: 'Proposed Last Working Date',
          type: 'date',
          required: true,
          order: 1,
        },
        {
          key: 'reason',
          label: 'Reason for Resignation',
          type: 'textarea',
          required: true,
          order: 2,
        },
        {
          key: 'handoverNotes',
          label: 'Handover Notes',
          type: 'textarea',
          required: false,
          order: 3,
        },
      ],
      stages: [
        {
          key: 'manager_approval',
          name: 'Reporting Manager Discussion & Approval',
          order: 1,
          approver: { type: 'reporting_manager' },
          slaHours: 24,
          locksCancellation: false,
        },
        {
          key: 'hr_review',
          name: 'HR Exit Initiation',
          order: 2,
          approver: { type: 'role', roleKey: 'hr' },
          slaHours: 48,
          locksCancellation: false,
        },
        {
          key: 'it_clearance',
          name: 'IT Clearance',
          order: 3,
          approver: { type: 'role', roleKey: 'it' },
          slaHours: 48,
          locksCancellation: false,
        },
        {
          key: 'finance_clearance',
          name: 'Finance Clearance',
          order: 4,
          approver: { type: 'role', roleKey: 'finance' },
          slaHours: 48,
          locksCancellation: false,
        },
        {
          key: 'admin_clearance',
          name: 'Administration Clearance',
          order: 5,
          approver: { type: 'role', roleKey: 'administration' },
          slaHours: 48,
          locksCancellation: false,
        },
        {
          key: 'hr_closure',
          name: 'Final HR Closure',
          order: 6,
          approver: { type: 'role', roleKey: 'hr' },
          slaHours: 48,
          locksCancellation: true,
        },
      ],
      settings: { allowCancel: true, resubmitMode: 'restart' },
    },
  ];

  for (const wfData of workflowsData) {
    let wf = await Workflow.findOne({ key: wfData.key });
    if (!wf) {
      wf = new Workflow({
        key: wfData.key,
        name: wfData.name,
        description: wfData.description,
        currentVersion: 1,
        isActive: true,
        createdBy: adminUser._id,
        allowedSubmitterRoles: [],
      });
      await wf.save();

      const versionDoc = new WorkflowVersion({
        workflowId: wf._id,
        version: 1,
        fields: wfData.fields,
        stages: wfData.stages,
        settings: wfData.settings,
        publishedAt: new Date(),
        createdBy: adminUser._id,
      });
      await versionDoc.save();
    } else {
      wf.name = wfData.name;
      wf.description = wfData.description;
      wf.isActive = true;
      await wf.save();
    }
  }

  // 6. Reset or ensure counter exists
  const year = new Date().getFullYear();
  await Counter.findOneAndUpdate(
    { _id: `requestNumber_${year}` },
    { $setOnInsert: { seq: 0 } },
    { upsert: true }
  );

  logger.info('Database seeded successfully (idempotent)');
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seed completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = seed;

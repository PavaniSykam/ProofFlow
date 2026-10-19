# ProofFlow – Configurable Organizational Workflow Management System

ProofFlow is an enterprise-grade, configurable MERN organizational workflow engine. It automates multi-stage business requests—including Leave, Purchase, Expense Reimbursement, and Resignation notices—with dynamic stage assignment, strict reporting-manager routing, self-approval prevention, time-bounded delegations, and automated SLA escalations.

---

## Key Features

1. **Pure Function Workflow Engine**:
   - **Dynamic Assignee Resolution**: Assigns approvers based on four generic typed rules: `reporting_manager`, `department_head`, `role` pool, and `specific_user`.
   - **Strict Hierarchical Isolation**: Exactly isolates developers to their designated project managers (e.g. 6 PMs managing 12 developers).
   - **Hierarchical Fallbacks**: In case of inactive managers or cycle avoidance, the engine automatically climbs the reporting tree up to the Department Head or Executive.
   - **Self-Approval Prevention**: Enforced at the engine core. A user can never approve, reject, or request changes on their own request.
   - **Immutable Workflow Versioning**: Active requests are pinned to the version active at creation time. Workflow modifications generate a new version without corrupting in-flight requests.
   - **Cycle Tracking & Resubmissions**: Supports `changes_requested` cycles, keeping complete historical audit trails while advancing fresh stage instances.

2. **Automated SLA Deadlines & Escalation**:
   - Background scheduler runs periodically to detect approaching deadlines and send warning notifications.
   - Automatically reassigns stalled stages to the manager of the approver or designated escalation pool.
   - "Overdue" status is derived dynamically from timestamps rather than hardcoded in the database.

3. **Robust Security Architecture**:
   - **JWT in httpOnly, SameSite=Lax Cookies**: Guards against XSS-based token theft.
   - **Token Versioning**: Instant invalidation of all user sessions upon password reset or account deactivation.
   - **Object-Level Authorization & IDOR Defense**: Returns HTTP 404 (instead of 403) for unauthorized request reads to prevent resource enumeration.
   - **Admin Separation of Duties**: Administrators cannot approve or reject workflow stages unless explicitly assigned as the stage approver.

4. **Modern Responsive React Frontend**:
   - Built with **React 18**, **Vite**, and **Tailwind CSS**.
   - **Role-Aware Navigation**: Adaptive workspaces for Employees, Approvers, and Administrators.
   - **Dynamic Form Renderer**: Renders text, textarea, number, date, dropdowns, checkboxes, and file uploads.
   - **Interactive Org Chart**: Real-time corporate hierarchy tree visualizer.
   - **Live In-App Notifications**: Polled every 30 seconds with instant badge updates.
   - **AI Request Summarizer**: Generates executive summaries for approvers to accelerate reviews.

---

## Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, Mongoose, Joi, bcrypt, jsonwebtoken, Supertest, Jest, `mongodb-memory-server`
- **Frontend**: React 18, Vite, Tailwind CSS, React Router 6, Lucide React, Axios

---

## Seeded Organization ("Nexora Technologies Pvt. Ltd.")

ProofFlow comes with an idempotent seed script creating an organization hierarchy with realistic enterprise departments and employees:

- **Executive**: Kiran Bose (CEO)
- **Engineering**:
  - Department Head: Arjun Menon
  - Project Managers: Neha Joshi, Sanjay Patil, Aditya Bhat, Shreya Kulkarni, Manoj Gill, Tanvi Mehta
  - Developers: Ravi Teja & Divya Reddy (under Neha), Imran Sheikh & Omkar Jadhav (under Sanjay), Karan Malhotra & Sneha Banerjee (under Aditya), Harish Nambiar & Isha Chopra (under Shreya), Lokesh Yadav & Meghna Das (under Manoj), Faisal Khan & Nikita Pawar (under Tanvi)
- **Human Resources**: Rohan Desai (Head), Priya Nair, Pooja Singh
- **Finance**: Meera Kapoor (Head), Vikram Seth, Ananya Iyer
- **IT Operations**: Rajesh Verma (Head), Suresh Kumar, Deepa Rao
- **Procurement**: Amit Sharma (Head), Ritu Jain

### Default Credentials for Testing
- **Password for all seeded accounts**: `ProofFlow@123`
- **Admin**: `meera.kapoor@nexora-demo.example`
- **Project Manager**: `neha.joshi@nexora-demo.example`
- **Employee**: `ravi.teja@nexora-demo.example`

---

## Getting Started

### 1. Server Setup
```bash
cd server
npm install
npm run seed     # Seeds organization, roles, departments, users, and 4 workflows
npm start        # Starts server on http://localhost:5000
```

### 2. Client Setup
```bash
cd client
npm install
npm run dev      # Starts Vite development server on http://localhost:5173
```

### 3. Production Build
```bash
cd client
npm run build    # Compiles production bundle to client/dist
```

---

## Running Test Suites

ProofFlow includes comprehensive test suites running against in-memory MongoDB:

```bash
cd server
npm test
```

### Test Coverage Overview:
1. **Hierarchy & Authorization (`hierarchy.test.js` - 8 tests)**:
   - `H1`: Reporting-manager isolation (Leave & Resignation)
   - `H2`: Six project managers exact isolation for 12 devs
   - `H3`: Hierarchy changes (moving developer between managers)
   - `H4`: Self-approval prevention at all levels
   - `H5`: Unauthorized direct API (IDOR) on requests, files, and audit logs
   - `H6`: Stage order and replay prevention
   - `H7`: Deactivated manager session invalidation & action blocking
   - `H8`: Admin separation of duties

2. **Workflow Engine & SLA (`engine.test.js` - 4 tests)**:
   - Rejection lifecycle and terminal state propagation
   - Changes requested -> Edit form -> Resubmit -> Approval
   - Cancellation rules (draft/pending vs locked stages)
   - Idempotent SLA reminder and escalation scheduler

3. **End-to-End Workflows (`e2e.test.js` - 5 tests)**:
   - `R-1`: Canonical Ravi Teja Leave Request (2-stage review & audit logging)
   - `R-2`: Purchase Request Lifecycle (Request changes -> Cycle 2 Resubmit -> PO clearance)
   - `R-3`: Expense Reimbursement with Rejection
   - `R-4`: Resignation Notice (6-stage departmental clearance)
   - `R-5`: Temporary Delegation in-flight acting on behalf of assigned manager

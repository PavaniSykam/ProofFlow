import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import ChangePassword from './pages/auth/ChangePassword';

// Employee Pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import RequestCatalog from './pages/employee/RequestCatalog';
import NewRequest from './pages/employee/NewRequest';
import EditRequest from './pages/employee/EditRequest';
import MyRequests from './pages/employee/MyRequests';
import RequestDetail from './pages/employee/RequestDetail';

// Approver Pages
import ApproverDashboard from './pages/approver/ApproverDashboard';
import ApproverInbox from './pages/approver/ApproverInbox';
import Delegations from './pages/approver/Delegations';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminWorkflows from './pages/admin/AdminWorkflows';
import WorkflowBuilder from './pages/admin/WorkflowBuilder';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminRoles from './pages/admin/AdminRoles';
import AdminOrgChart from './pages/admin/AdminOrgChart';
import AdminRequestMonitor from './pages/admin/AdminRequestMonitor';

// Common Error Pages
import NotFound from './pages/common/NotFound';
import Forbidden from './pages/common/Forbidden';

export default function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Force Change Password Route */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* Authenticated Workspace Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <EmployeeDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/catalog"
        element={
          <ProtectedRoute>
            <Layout>
              <RequestCatalog />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/requests/new/:workflowId"
        element={
          <ProtectedRoute>
            <Layout>
              <NewRequest />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/requests/:id/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <EditRequest />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/requests/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <RequestDetail />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-requests"
        element={
          <ProtectedRoute>
            <Layout>
              <MyRequests />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Approver Routes */}
      <Route
        path="/approver/dashboard"
        element={
          <ProtectedRoute approverOnly>
            <Layout>
              <ApproverDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/approver/inbox"
        element={
          <ProtectedRoute approverOnly>
            <Layout>
              <ApproverInbox />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/delegations"
        element={
          <ProtectedRoute approverOnly>
            <Layout>
              <Delegations />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/workflows"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminWorkflows />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/workflows/new"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <WorkflowBuilder />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/workflows/:id/edit"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <WorkflowBuilder />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminUsers />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/org-chart"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminOrgChart />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminDepartments />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminRoles />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/requests"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <AdminRequestMonitor />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Fallback Aliases */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/approver" element={<Navigate to="/approver/dashboard" replace />} />

      {/* Error Routes */}
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

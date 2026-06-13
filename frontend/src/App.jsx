import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/student/Dashboard';
import StudentProfile from './pages/student/Profile';
import StudentSkills from './pages/student/Skills';
import StudentCertifications from './pages/student/Certifications';
import StudentProjects from './pages/student/Projects';
import StudentResumes from './pages/student/Resumes';
import StudentCoding from './pages/student/Coding';
import StudentDrives from './pages/student/Drives';
import FacultyQueue from './pages/faculty/Queue';
import FacultyMentees from './pages/faculty/Mentees';
import HODDashboard from './pages/hod/Dashboard';
import HODSearch from './pages/hod/Search';
import HODRoles from './pages/hod/Roles';
import HODDrives from './pages/hod/Drives';
import AdminDashboard from './pages/admin/Dashboard';

const HomeRedirect = ({ user }) => {
  if (!user) return <Navigate to="/login" />;
  if (user.baseRole === 'hod') return <Navigate to="/hod/dashboard" />;
  if (user.baseRole === 'faculty') return <Navigate to="/faculty/queue" />;
  if (user.baseRole === 'admin') return <Navigate to="/admin/dashboard" />;
  return <Navigate to="/dashboard" />;
};

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <HomeRedirect user={user} /> : <LoginPage />} />

      {/* Student */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRoles={['student']}>
            <Layout>
              <StudentDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute requiredRoles={['student']}>
            <Layout>
              <StudentProfile />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/skills"
        element={
          <ProtectedRoute requiredRoles={['student']}>
            <Layout>
              <StudentSkills />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/certifications"
        element={
          <ProtectedRoute requiredRoles={['student']}>
            <Layout>
              <StudentCertifications />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute requiredRoles={['student']}>
            <Layout>
              <StudentProjects />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resumes"
        element={
          <ProtectedRoute requiredRoles={['student']}>
            <Layout>
              <StudentResumes />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/coding"
        element={
          <ProtectedRoute requiredRoles={['student']}>
            <Layout>
              <StudentCoding />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/drives"
        element={
          <ProtectedRoute requiredRoles={['student']}>
            <Layout>
              <StudentDrives />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Faculty */}
      <Route
        path="/faculty/queue"
        element={
          <ProtectedRoute requiredRoles={['faculty', 'hod']}>
            <Layout>
              <FacultyQueue />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/mentees"
        element={
          <ProtectedRoute requiredRoles={['faculty', 'hod']}>
            <Layout>
              <FacultyMentees />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* HOD */}
      <Route
        path="/hod/dashboard"
        element={
          <ProtectedRoute requiredRoles={['hod']}>
            <Layout>
              <HODDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hod/search"
        element={
          <ProtectedRoute requiredRoles={['hod']}>
            <Layout>
              <HODSearch />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hod/roles"
        element={
          <ProtectedRoute requiredRoles={['hod']}>
            <Layout>
              <HODRoles />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hod/drives"
        element={
          <ProtectedRoute requiredRoles={['hod']}>
            <Layout>
              <HODDrives />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="/" element={<HomeRedirect user={user} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

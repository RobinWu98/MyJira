import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { WorkViewPage } from "./pages/WorkViewPage";

export function App() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface text-slate-600">
        Loading...
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={auth.isAuthenticated ? <ProjectsPage /> : <Navigate to="/login" replace />} />
      <Route path="/profile" element={auth.isAuthenticated ? <ProfilePage /> : <Navigate to="/login" replace />} />
      <Route path="/work" element={auth.isAuthenticated ? <WorkViewPage /> : <Navigate to="/login" replace />} />
      <Route
        path="/projects/:projectId"
        element={auth.isAuthenticated ? <ProjectDetailPage /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

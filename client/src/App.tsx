import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import FormPreviewPage from "./pages/FormPreviewPage";
import TriageMapPage from "./pages/TriageMapPage";
import AuditLogPage from "./pages/AuditLogPage";
import DataPolicyPage from "./pages/DataPolicyPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/schemas/:id" element={<FormPreviewPage />} />
            <Route path="/triage" element={<TriageMapPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/data-policy" element={<DataPolicyPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

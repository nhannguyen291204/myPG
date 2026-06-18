import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { DraftProvider } from "./lib/draft";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./routes/AppLayout";
import Login from "./pages/Login";
import Inspect from "./pages/Inspect";
import Result from "./pages/Result";
import History from "./pages/History";
import InspectionDetail from "./pages/InspectionDetail";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import CustomModel from "./pages/CustomModel";
import CheckImage from "./pages/CheckImage";

export default function App() {
  return (
    <AuthProvider>
      <DraftProvider>
        <BrowserRouter>
          <Routes>
            {/* Màn công khai */}
            <Route path="/login" element={<Login />} />

            {/* Cần đăng nhập */}
            <Route element={<ProtectedRoute />}>
              {/* Khung app: tab dưới + <Outlet/> */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Inspect />} />
                <Route path="/result" element={<Result />} />
                <Route path="/history" element={<History />} />
                <Route path="/history/:id" element={<InspectionDetail />} />
                <Route path="/check-image" element={<CheckImage />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/settings" element={<Settings />} />

                {/* Chỉ Quản lý/Admin: Quản lý người dùng + Model tùy chỉnh (QC bị chặn) */}
                <Route element={<ProtectedRoute requireRole="supervisor" />}>
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/models" element={<CustomModel />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DraftProvider>
    </AuthProvider>
  );
}

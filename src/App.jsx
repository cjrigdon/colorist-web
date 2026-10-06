import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './App.css';
import {Route, BrowserRouter, Routes, Navigate} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Support from "./pages/Support";
import YoutubeCallback from "./YoutubeCallback";
import SharedLink from "./pages/SharedLink";
import { isAuthenticated } from "./services/api";

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
      <BrowserRouter>
          <Routes>
              <Route path="/" element={<Login />}></Route>
              <Route path="/register" element={<Register />}></Route>
              <Route path="/verify-email" element={<VerifyEmail />}></Route>
              <Route path="/forgot-password" element={<ForgotPassword />}></Route>
              {/* Signed-in users see it inside the app layout; it stays public for everyone else */}
              <Route path="/privacy-policy" element={isAuthenticated() ? <Dashboard /> : <PrivacyPolicy />}></Route>
              <Route path="/support" element={<Support />}></Route>
              <Route path="/auth/youtube" element={<YoutubeCallback />}></Route>
              <Route path="/shared/:token" element={<SharedLink />}></Route>
              <Route path="/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          </Routes>
      </BrowserRouter>
  );
}

export default App;
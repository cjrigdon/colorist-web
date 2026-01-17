import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './App.css';
import {Route, BrowserRouter, Routes, Navigate} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import YoutubeCallback from "./YoutubeCallback";

function App() {
  return (
      <BrowserRouter>
          <Routes>
              <Route path="/" element={<Login />}></Route>
              <Route path="/register" element={<Register />}></Route>
              <Route path="/forgot-password" element={<ForgotPassword />}></Route>
              <Route path="/auth/youtube" element={<YoutubeCallback />}></Route>
              <Route path="/*" element={<Dashboard />} />
          </Routes>
      </BrowserRouter>
  );
}

export default App;
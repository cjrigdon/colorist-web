import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './App.css';
import {Route, BrowserRouter, Routes} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import YoutubeCallback from "./YoutubeCallback";

function App() {
  return (
      <BrowserRouter>
          <Routes>
              <Route path="/" element={<Login />}></Route>
              <Route path="/register" element={<Register />}></Route>
              <Route path="/dashboard" element={<Dashboard />}></Route>
              <Route path="/auth/youtube" element={<YoutubeCallback />}></Route>
          </Routes>
      </BrowserRouter>
  );
}

export default App;
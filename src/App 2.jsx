import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Features from "./pages/Features";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Artist from "./pages/Artist";
import ProjectDetail from "./pages/ProjectDetail";
import VerifyEmail from "./pages/VerifyEmail";

function App() {
  return (
    <Router>
      <Navbar />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/artist" element={<Artist />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
        </Routes>
      </main>

      <Footer />
    </Router>
  );
}

export default App;

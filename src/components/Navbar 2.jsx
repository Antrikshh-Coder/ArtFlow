import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-inner">

        {/* LOGO */}
        <div className="nav-logo">
          🎨 <span>ArtFlow</span>
        </div>

        {/* LINKS */}
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/features">Features</Link>
          <Link to="/about">About</Link>
          {user && <Link to="/dashboard">Dashboard</Link>}
        </div>

        {/* ACTIONS */}
        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-user">Welcome, {user.name}</span>
              <button onClick={logout} className="nav-cta">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-login">Login</Link>
              <Link to="/register" className="nav-cta">
                Get Started
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}

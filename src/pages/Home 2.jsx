import "../styles/home.css";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" />;

  return (
    <main className="home">

      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="hero-left">
          <h1>
            Where Digital Art <br />
            <span>Collaboration Flows</span>
          </h1>

          <p>
            ArtFlow is a real-time digital art commissioning platform that helps
            artists and clients collaborate clearly, give visual feedback,
            track milestones, and deliver artwork without confusion.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="btn primary">
              Start a Commission
            </Link>
            <Link to="/login" className="btn outline">
              I’m an Artist
            </Link>
          </div>

          <div className="hero-tags">
            <span>🎨 Live Canvas</span>
            <span>✏️ Visual Feedback</span>
            <span>💬 Real-Time Chat</span>
            <span>📌 Milestones</span>
          </div>
        </div>

        <div className="hero-right">
          <div className="mockup">
            <h4>ArtFlow Workspace</h4>
            <ul>
              <li>🎨 Artwork Canvas</li>
              <li>✏️ Annotations</li>
              <li>💬 Project Chat</li>
              <li>📌 Milestone Review</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ===== PROBLEM ===== */}
      <section className="section">
        <h2>The Problem</h2>
        <p>
          Traditional art commissions rely on emails, chats, and shared folders.
          This leads to unclear feedback, lost revisions, and miscommunication.
        </p>

        <div className="cards">
          <div className="card">❌ Scattered messages</div>
          <div className="card">❌ No visual feedback</div>
          <div className="card">❌ No progress tracking</div>
        </div>
      </section>

      {/* ===== SOLUTION ===== */}
      <section className="section dark">
        <h2>The ArtFlow Solution</h2>
        <p>
          ArtFlow provides a single collaborative workspace where every sketch,
          annotation, message, and decision is tracked in real time.
        </p>

        <div className="cards">
          <div className="card">
            <h3>🎨 Visual Collaboration</h3>
            <p>Draw feedback directly on artwork.</p>
          </div>

          <div className="card">
            <h3>💬 Live Communication</h3>
            <p>Instant chat between artist and client.</p>
          </div>

          <div className="card">
            <h3>📌 Structured Milestones</h3>
            <p>Clear approvals at every stage.</p>
          </div>
        </div>
      </section>

      {/* ===== UNIQUE FEATURE ===== */}
      <section className="section highlight">
        <h2>What Makes ArtFlow Unique?</h2>
        <p>
          ArtFlow records the creative journey itself — not just the final
          artwork. Every revision, annotation, and approval becomes part of a
          project timeline.
        </p>

        <div className="cards">
          <div className="card">🧠 Decision Timeline</div>
          <div className="card">🔄 Revision Replay</div>
          <div className="card">🔐 Secure Project Access</div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta">
        <h2>Start Collaborating Smarter</h2>
        <p>
          Whether you are an artist or a client, ArtFlow helps you collaborate
          clearly and deliver confidently.
        </p>

        <Link to="/register" className="btn primary large">
          Get Started
        </Link>
      </section>

    </main>
  );
}

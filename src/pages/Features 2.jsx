export default function Features() {
    return (
      <section className="page features">
        <h1>Platform Features</h1>
  
        <div className="grid">
          <div className="card">
            <h3>🖌 Real-Time Image Annotations</h3>
            <p>
              Clients can draw feedback directly on artwork images. Artists see updates instantly, enabling faster iterative collaboration.
            </p>
          </div>
  
          <div className="card">
            <h3>💬 Real-Time Chat</h3>
            <p>
              Each project has a dedicated chat room with persistent messages stored in MongoDB.
            </p>
          </div>
  
          <div className="card">
            <h3>📍 Milestone Tracking</h3>
            <p>
              Projects are split into milestones with approval workflow. Status updates are reflected instantly for both clients and artists.
            </p>
          </div>
  
          <div className="card">
            <h3>☁ Secure Uploads</h3>
            <p>
              Artwork uploads are handled securely, optionally using AWS S3 presigned URLs.
            </p>
          </div>
  
          <div className="card">
            <h3>🖼 Portfolio & Project Navigation</h3>
            <p>
              Easily navigate between artist portfolios, individual commission projects, and payment/escrow management.
            </p>
          </div>
  
          <div className="card">
            <h3>🔒 Secure Access</h3>
            <p>
              JWT-based authentication ensures only the artist-client pair can access private projects.
            </p>
          </div>
  
          <div className="card">
            <h3>💰 Payment & Escrow Simulation</h3>
            <p>
              Simulated payment workflow for milestone approvals and project completion.
            </p>
          </div>
  
          <div className="card">
            <h3>🔔 Real-Time Notifications</h3>
            <p>
              Instant alerts for new messages, milestone updates, and artwork uploads.
            </p>
          </div>
  
          <div className="card">
            <h3>📂 Project History</h3>
            <p>
              All projects, milestones, and chat transcripts are stored in MongoDB for easy reference.
            </p>
          </div>

          <div className="card">
            <h3>🧾 Activity Feed (Audit Timeline)</h3>
            <p>
              Every important action is logged (status changes, annotations, chat messages, collaborator updates) so teams can review what happened and when.
            </p>
          </div>
        </div>
      </section>
    );
  }
  
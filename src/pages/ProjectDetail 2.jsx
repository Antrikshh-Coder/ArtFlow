import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import Chat from "../components/Chat";
import ImageAnnotation from "../components/ImageAnnotation";
import "./ProjectDetail.css";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("annotations");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [activities, setActivities] = useState([]);
  const [activitiesLoaded, setActivitiesLoaded] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await API.get(`/projects/${id}`);
        setProject(res.data);
      } catch (err) {
        console.error("Failed to fetch project:", err);
        if (err.response?.status === 404) {
          navigate("/dashboard");
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id, navigate]);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!id) return;
      setActivitiesLoading(true);
      setActivitiesError("");
      try {
        const res = await API.get(`/projects/${id}/activity`);
        setActivities(res.data || []);
        setActivitiesLoaded(true);
      } catch (err) {
        console.error("Failed to fetch activity:", err);
        setActivitiesError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to load activity"
        );
      } finally {
        setActivitiesLoading(false);
      }
    };

    if (activeTab === "activity" && !activitiesLoaded && !activitiesLoading) {
      fetchActivity();
    }
  }, [activeTab, activitiesLoaded, activitiesLoading, id]);

  const inviteCollaborator = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    try {
      const res = await API.post(`/projects/${id}/collaborators`, {
        email: inviteEmail.trim()
      });
      setProject(res.data);
      setInviteEmail("");
    } catch (err) {
      console.error("Failed to invite collaborator:", err);
      setInviteError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to add collaborator"
      );
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return <div className="page">Loading project...</div>;
  }

  if (!project) {
    return <div className="page">Project not found</div>;
  }

  const currentUserId = user?._id || user?.id;
  const canInviteCollaborators =
    (project.client?._id && String(project.client._id) === String(currentUserId)) ||
    (project.artist?._id && String(project.artist._id) === String(currentUserId));

  const updateStatus = async (nextStatus) => {
    if (!id) return;
    setUpdatingStatus(true);
    setStatusError("");
    try {
      const res = await API.patch(`/projects/${id}/status`, { status: nextStatus });
      setProject(res.data);
    } catch (err) {
      console.error("Failed to update project status:", err);
      setStatusError(err.response?.data?.error || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="project-detail">
      <div className="project-header">
        <div className="project-header-top">
          <button className="btn-secondary" onClick={() => navigate("/dashboard")}>Back</button>

          <div className="project-header-actions">
            <div className="project-status-control">
              <label>Status</label>
              <select
                value={project.status}
                onChange={(e) => updateStatus(e.target.value)}
                disabled={updatingStatus}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="project-save-indicator">
              {updatingStatus ? "Saving..." : "All changes saved"}
            </div>
          </div>
        </div>

        {statusError ? <div className="project-status-error">{statusError}</div> : null}

        <h1>{project.title}</h1>
        <p>{project.description}</p>
        <div className="project-info">
          <span>Client: {project.client?.name}</span>
          <span>Artist: {project.artist?.name}</span>
        </div>
      </div>

      <div className="project-tabs">
        <button
          className={`tab-button ${activeTab === "annotations" ? "active" : ""}`}
          onClick={() => setActiveTab("annotations")}
        >
          Annotations
        </button>
        <button
          className={`tab-button ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          Chat
        </button>
        <button
          className={`tab-button ${activeTab === "milestones" ? "active" : ""}`}
          onClick={() => setActiveTab("milestones")}
        >
          Milestones
        </button>
        <button
          className={`tab-button ${activeTab === "activity" ? "active" : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          Activity
        </button>
      </div>

      <div className="project-content">
        <div className="project-main">
          {activeTab === "annotations" && (
            <ImageAnnotation projectId={id} user={user} />
          )}
          
          {activeTab === "chat" && (
            <Chat projectId={id} user={user} />
          )}
          
          {activeTab === "milestones" && (
            <div className="milestones-container">
              <h3>Project Milestones</h3>
              {(project.milestones?.length ?? 0) === 0 ? (
                <p>No milestones defined yet</p>
              ) : (
                (project.milestones || []).map((milestone, index) => (
                  <div key={index} className="milestone-card">
                    <h4>{milestone.title}</h4>
                    <p>{milestone.description}</p>
                    <div className="milestone-details">
                      <span className="status">{milestone.status}</span>
                      <span className="amount">${milestone.amount}</span>
                      {milestone.dueDate && (
                        <span className="due-date">
                          Due: {new Date(milestone.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {milestone.assets?.length > 0 && (
                      <div className="assets">
                        <h5>Assets:</h5>
                        {milestone.assets.map((asset, assetIndex) => (
                          <div key={assetIndex} className="asset-item">
                            <a href={asset.url} target="_blank" rel="noopener noreferrer">
                              {asset.filename}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="activity-container">
              <div className="activity-header">
                <h3>Activity Feed</h3>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setActivitiesLoaded(false);
                    setActivities([]);
                  }}
                  disabled={activitiesLoading}
                >
                  Refresh
                </button>
              </div>

              {activitiesError ? (
                <div className="project-status-error">{activitiesError}</div>
              ) : null}

              {activitiesLoading ? (
                <p>Loading activity...</p>
              ) : activities.length === 0 ? (
                <p>No activity yet</p>
              ) : (
                <div className="activity-list">
                  {activities.map((a) => (
                    <div key={a._id} className="activity-item">
                      <div className="activity-top">
                        <div className="activity-message">{a.message}</div>
                        <div className="activity-time">
                          {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                        </div>
                      </div>
                      <div className="activity-meta">
                        <span className="activity-actor">
                          {a.actor?.name ? `By ${a.actor.name}` : ""}
                        </span>
                        <span className="activity-type">{a.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="project-sidebar">
          <div className="sidebar-section">
            <h3>Project Details</h3>
            <div className="detail-item">
              <label>Status:</label>
              <span className="status-badge">{project.status}</span>
            </div>
            <div className="detail-item">
              <label>Created:</label>
              <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <label>Last Updated:</label>
              <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Participants</h3>
            <div className="participant">
              <div className="participant-info">
                <strong>Client:</strong> {project.client?.name}
              </div>
              <div className="participant-email">{project.client?.email}</div>
            </div>
            <div className="participant">
              <div className="participant-info">
                <strong>Artist:</strong> {project.artist?.name}
              </div>
              <div className="participant-email">{project.artist?.email}</div>
            </div>

            {project.collaborators?.length > 0 && (
              <div className="participant">
                <div className="participant-info">
                  <strong>Collaborators:</strong>
                </div>
                {project.collaborators.map((c) => (
                  <div key={c._id} className="participant-email">{c.name} ({c.email})</div>
                ))}
              </div>
            )}

            {(project.pendingCollaboratorEmails?.length ?? 0) > 0 && (
              <div className="participant">
                <div className="participant-info">
                  <strong>Pending Invites:</strong>
                </div>
                {(project.pendingCollaboratorEmails || []).map((e) => (
                  <div key={e} className="participant-email">{e}</div>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Collaboration</h3>
            {inviteError ? <div className="project-status-error">{inviteError}</div> : null}
            {canInviteCollaborators ? (
              <div className="detail-item" style={{ gap: "0.5rem" }}>
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Invite by email"
                  style={{ flex: 1, padding: "0.5rem", borderRadius: "6px", border: "1px solid var(--border)", background: "rgba(255, 255, 255, 0.05)", color: "var(--text)" }}
                />
                <button className="btn-primary" onClick={inviteCollaborator} disabled={inviting}>
                  {inviting ? "Adding..." : "Add"}
                </button>
              </div>
            ) : (
              <div className="detail-item">
                <span style={{ color: "var(--muted)" }}>
                  Only the client or artist can add collaborators.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

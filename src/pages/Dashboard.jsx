import { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { user, logout } = useAuth();
  const location = useLocation();
  const userId = user?._id || user?.id;

  const welcomeText = useMemo(() => {
    const mode = location.state?.welcomeMode;
    if (mode === "registered") return "Welcome";
    return "Welcome back";
  }, [location.state]);

  useEffect(() => {
    if (!userId) return;

    try {
      const cacheKey = `dashboard_projects_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setProjects(JSON.parse(cached));
      }
    } catch (err) {
      console.error("Failed to read cached projects:", err);
    }
  }, [userId]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const res = await API.get("/projects/my");
        setProjects(res.data);

        if (userId) {
          const cacheKey = `dashboard_projects_${userId}`;
          localStorage.setItem(cacheKey, JSON.stringify(res.data));
        }
      } catch (err) {
        console.error("Failed to fetch projects:", err);

        if (err?.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchProjects();
    }
  }, [user, location.key]);

  const createProject = async () => {
    if (!newProject.title.trim()) return;

    try {
      const projectData = {
        ...newProject,
        client: userId,
        status: "active"
      };
      
      const res = await API.post("/projects/create", projectData);
      setProjects((prev) => {
        const next = [res.data, ...prev];
        if (userId) {
          const cacheKey = `dashboard_projects_${userId}`;
          localStorage.setItem(cacheKey, JSON.stringify(next));
        }
        return next;
      });

      setNewProject({ title: "", description: "" });
      setShowCreateModal(false);
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const filteredProjects = projects.filter(project => {
    const title = String(project.title || "");
    const description = String(project.description || "");
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || project.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case "active": return "#28a745";
      case "completed": return "#007bff";
      case "paused": return "#ffc107";
      default: return "#6c757d";
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading && projects.length === 0) {
    return <div className="page">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>{welcomeText}, {user?.name}!</h1>
          <p>Manage your art commissions and collaborations</p>
        </div>
        <div className="header-actions">
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            + New Project
          </button>
          <button onClick={logout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>{projects.length}</h3>
          <p>Total Projects</p>
        </div>
        <div className="stat-card">
          <h3>{projects.filter(p => p.status === "active").length}</h3>
          <p>Active</p>
        </div>
        <div className="stat-card">
          <h3>{projects.filter(p => p.status === "completed").length}</h3>
          <p>Completed</p>
        </div>
        <div className="stat-card">
          <h3>{projects.filter(p => p.milestones?.length || 0).reduce((acc, p) => acc + (p.milestones?.length || 0), 0)}</h3>
          <p>Total Milestones</p>
        </div>
      </div>

      <div className="dashboard-controls">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      <div className="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects found</h3>
            <p>Start by creating your first art commission project</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Create Project
            </button>
          </div>
        ) : (
          filteredProjects.map(project => (
            <div key={project._id} className="project-card">
              <div className="project-header-info">
                <h3>{project.title}</h3>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(project.status) }}
                >
                  {getStatusText(project.status)}
                </span>
              </div>
              
              <p className="project-description">{project.description}</p>
              
              <div className="project-meta">
                <div className="participants">
                  <span>Client: {project.client?.name}</span>
                  <span>Artist: {project.artist?.name}</span>
                </div>
                <div className="project-dates">
                  <small>Created: {new Date(project.createdAt).toLocaleDateString()}</small>
                </div>
              </div>

              {project.milestones && project.milestones.length > 0 && (
                <div className="milestones-preview">
                  <h4>Milestones ({project.milestones.length})</h4>
                  <div className="milestone-progress">
                    {project.milestones.map((milestone, index) => (
                      <div 
                        key={index} 
                        className={`milestone-dot ${milestone.status}`}
                        title={milestone.title}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="project-actions">
                <Link to={`/project/${project._id}`} className="btn-primary">
                  Open Project
                </Link>
                <Link to={`/project/${project._id}`} className="btn-secondary">
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create New Project</h2>
            <div className="form-group">
              <label>Project Title</label>
              <input
                type="text"
                value={newProject.title}
                onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                placeholder="Enter project title"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                placeholder="Describe your art commission project"
                rows={4}
              />
            </div>
            <div className="modal-actions">
              <button onClick={createProject} className="btn-primary">
                Create Project
              </button>
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

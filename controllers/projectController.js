import Project from "../models/Project.js";
import User from "../models/User.js";
import Activity from "../models/Activity.js";
import auth from "../middleware/auth.js";

const logActivity = async ({ projectId, actorId, type, message, meta }) => {
  try {
    await Activity.create({
      project: projectId,
      actor: actorId,
      type,
      message,
      meta
    });
  } catch (err) {
    console.error("ACTIVITY LOG ERROR:", err);
  }
};

export const createProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      client: req.user._id
    };
    
    const project = await Project.create(projectData);
    const populatedProject = await Project.findById(project._id)
      .populate("client artist collaborators");
    
    res.json(populatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("client artist collaborators")
      .populate("milestones.annotations.author", "name email");

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const isCollaborator = (project.collaborators || []).some(
      (c) => c._id.toString() === req.user._id.toString()
    );

    // Check if user is authorized to view this project
    if (project.client._id.toString() !== req.user._id.toString() && 
        (!project.artist || project.artist._id.toString() !== req.user._id.toString()) &&
        !isCollaborator) {
      return res.status(403).json({ error: "Not authorized to view this project" });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("client artist collaborators")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ client: req.user._id }, { artist: req.user._id }, { collaborators: req.user._id }]
    })
      .populate("client artist collaborators")
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Only client or artist can add collaborators
    if (
      project.client.toString() !== req.user._id.toString() &&
      (!project.artist || project.artist.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        error: "Not authorized",
        message: "Only the client or artist can add collaborators"
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      if (!project.pendingCollaboratorEmails) project.pendingCollaboratorEmails = [];
      const alreadyPending = project.pendingCollaboratorEmails.some(
        (e) => String(e).toLowerCase() === normalizedEmail
      );
      if (!alreadyPending) {
        project.pendingCollaboratorEmails.push(normalizedEmail);
        await project.save();

        await logActivity({
          projectId: project._id,
          actorId: req.user._id,
          type: "collaborator_invited",
          message: `${req.user?.name || "Someone"} invited ${normalizedEmail} to collaborate`,
          meta: { collaboratorEmail: normalizedEmail }
        });
      }

      const populatedProject = await Project.findById(project._id).populate(
        "client artist collaborators"
      );
      return res.json(populatedProject);
    }

    if (!project.collaborators) project.collaborators = [];
    const already = project.collaborators.some((c) => c.toString() === user._id.toString());
    if (!already) {
      project.collaborators.push(user._id);
      await project.save();

      await logActivity({
        projectId: project._id,
        actorId: req.user._id,
        type: "collaborator_added",
        message: `${req.user?.name || "Someone"} added ${user.name} as a collaborator`,
        meta: { collaboratorId: user._id, collaboratorEmail: user.email }
      });
    }

    const populatedProject = await Project.findById(project._id).populate(
      "client artist collaborators"
    );
    res.json(populatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["active", "completed", "paused", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const isCollaborator = project.collaborators?.some(
      (c) => c.toString() === req.user._id.toString()
    );

    // Only client or artist or collaborator on the project can update status
    if (
      project.client.toString() !== req.user._id.toString() &&
      (!project.artist || project.artist.toString() !== req.user._id.toString()) &&
      !isCollaborator
    ) {
      return res.status(403).json({
        error: "Not authorized",
        message: "Not authorized to update project status"
      });
    }

    project.status = status;
    await project.save();

    await logActivity({
      projectId: project._id,
      actorId: req.user._id,
      type: "status_changed",
      message: `${req.user?.name || "Someone"} changed status to ${status}`,
      meta: { status }
    });

    const populatedProject = await Project.findById(project._id).populate(
      "client artist collaborators"
    );

    res.json(populatedProject);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addAnnotation = async (req, res) => {
  try {
    const { projectId, milestoneIndex } = req.params;
    const { tool, color, imageData, comment } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const isCollaborator = project.collaborators?.some(
      (c) => c.toString() === req.user._id.toString()
    );

    // Check authorization
    if (project.client.toString() !== req.user._id.toString() && 
        (!project.artist || project.artist.toString() !== req.user._id.toString()) &&
        !isCollaborator) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const annotation = {
      author: req.user._id,
      tool,
      color,
      imageData,
      comment,
      timestamp: new Date(),
      milestoneIndex: parseInt(milestoneIndex) || 0
    };

    // Initialize milestones if needed
    if (!project.milestones) project.milestones = [];
    if (!project.milestones[milestoneIndex]) {
      project.milestones[parseInt(milestoneIndex)] = {
        title: `Milestone ${parseInt(milestoneIndex) + 1}`,
        annotations: []
      };
    }

    project.milestones[parseInt(milestoneIndex)].annotations.push(annotation);
    await project.save();

    await logActivity({
      projectId: project._id,
      actorId: req.user._id,
      type: "annotation_added",
      message: `${req.user?.name || "Someone"} added an annotation`,
      meta: {
        milestoneIndex: parseInt(milestoneIndex) || 0,
        tool,
        color,
        comment
      }
    });

    res.json({ ok: true, annotation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const saveCanvasVersion = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { imageData, description } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const isCollaborator = project.collaborators?.some(
      (c) => c.toString() === req.user._id.toString()
    );

    // Check authorization
    if (project.client.toString() !== req.user._id.toString() && 
        (!project.artist || project.artist.toString() !== req.user._id.toString()) &&
        !isCollaborator) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!project.canvasData) {
      project.canvasData = { versions: [] };
    }

    const newVersion = {
      imageData,
      createdBy: req.user._id,
      createdAt: new Date(),
      description: description || `Version ${project.canvasData.versions.length + 1}`
    };

    project.canvasData.versions.push(newVersion);
    project.canvasData.currentVersion = imageData;

    await project.save();

    await logActivity({
      projectId: project._id,
      actorId: req.user._id,
      type: "canvas_saved",
      message: `${req.user?.name || "Someone"} saved a canvas version`,
      meta: { description: newVersion.description }
    });
    res.json({ ok: true, version: newVersion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProjectActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const isCollaborator = project.collaborators?.some(
      (c) => c.toString() === req.user._id.toString()
    );

    if (
      project.client.toString() !== req.user._id.toString() &&
      (!project.artist || project.artist.toString() !== req.user._id.toString()) &&
      !isCollaborator
    ) {
      return res.status(403).json({
        error: "Not authorized",
        message: "You do not have access to this project's activity"
      });
    }

    const activities = await Activity.find({ project: id })
      .populate("actor", "name email")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

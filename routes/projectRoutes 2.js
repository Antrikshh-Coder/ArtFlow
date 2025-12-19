import { Router } from "express";
import auth from "../middleware/auth.js";
import {
  createProject,
  getProject,
  getProjects,
  getMyProjects,
  updateProjectStatus,
  addCollaborator,
  addAnnotation,
  saveCanvasVersion,
  getProjectActivity
} from "../controllers/projectController.js";

const router = Router();

router.get("/", getProjects);
router.get("/my", auth, getMyProjects);
router.post("/create", auth, createProject);
router.get("/:id", auth, getProject);
router.get("/:id/activity", auth, getProjectActivity);
router.patch("/:id/status", auth, updateProjectStatus);
router.post("/:id/collaborators", auth, addCollaborator);
router.post("/:projectId/milestones/:milestoneIndex/annotations", auth, addAnnotation);
router.post("/:projectId/canvas", auth, saveCanvasVersion);

export default router;

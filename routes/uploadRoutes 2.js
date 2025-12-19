import { Router } from "express";
import { presign } from "../controllers/uploadController.js";

const router = Router();

router.post("/presign", presign);

export default router;

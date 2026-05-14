import { Router } from "express";
import {
  addEmergencyFollowup,
  createReport,
  deleteReport,
  getAdminStats,
  getAllReports,
  getMyReports,
  getPublicStats,
  updateReportStatus
} from "../controllers/reportController.js";
import { authenticate, requireAdmin, requireAuth } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/stats/public", getPublicStats);
router.post("/", authenticate, upload.single("photo"), createReport);
router.patch("/:id/followup", upload.single("photo"), addEmergencyFollowup);
router.get("/my", authenticate, requireAuth, getMyReports);
router.get("/", authenticate, requireAdmin, getAllReports);
router.get("/stats/admin", authenticate, requireAdmin, getAdminStats);
router.patch("/:id/status", authenticate, requireAdmin, updateReportStatus);
router.delete("/:id", authenticate, requireAdmin, deleteReport);

export default router;

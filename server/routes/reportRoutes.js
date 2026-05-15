import { Router } from "express";
import {
  addEmergencyFollowup,
  createReport,
  deleteReport,
  getAdminStats,
  getReportActivity,
  getAllReports,
  getMyReports,
  getPublicStats,
  updateReportStatus
} from "../controllers/reportController.js";
import { authenticate, requireActiveOrganization, requireAdmin, requireAuth } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = Router();

router.get("/stats/public", getPublicStats);
router.post("/", authenticate, upload.single("photo"), createReport);
router.patch("/:id/followup", upload.single("photo"), addEmergencyFollowup);
router.get("/my", authenticate, requireAuth, requireActiveOrganization, getMyReports);
router.get("/:id/activity", authenticate, requireAuth, requireActiveOrganization, getReportActivity);
router.get("/", authenticate, requireAdmin, requireActiveOrganization, getAllReports);
router.get("/stats/admin", authenticate, requireAdmin, requireActiveOrganization, getAdminStats);
router.patch("/:id/status", authenticate, requireAdmin, requireActiveOrganization, updateReportStatus);
router.delete("/:id", authenticate, requireAdmin, requireActiveOrganization, deleteReport);

export default router;

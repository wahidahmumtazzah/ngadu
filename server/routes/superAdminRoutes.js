import { Router } from "express";
import {
  getSuperAdminOrganizationDetail,
  getSuperAdminOrganizations,
  getSuperAdminOverview,
  updateSuperAdminOrganizationStatus
} from "../controllers/superAdminController.js";
import { authenticate, requireAuth, requireSuperAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authenticate, requireAuth, requireSuperAdmin);

router.get("/overview", getSuperAdminOverview);
router.get("/organizations", getSuperAdminOrganizations);
router.get("/organizations/:id", getSuperAdminOrganizationDetail);
router.patch("/organizations/:id/status", updateSuperAdminOrganizationStatus);

export default router;

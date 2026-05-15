import { Router } from "express";
import {
  listOrganizations,
  reportOrganizationAbuse,
  registerOrganization,
  resendOrganizationVerificationEmail,
  verifyOrganizationEmail
} from "../controllers/organizationController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { createRateLimiter } from "../middlewares/rateLimitMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = Router();
const isProduction = process.env.NODE_ENV === "production";

const registerOrganizationRateLimit = createRateLimiter({
  keyPrefix: "organization-register",
  windowMs: isProduction ? 24 * 60 * 60 * 1000 : 60 * 1000,
  limit: isProduction ? 2 : 50,
  resolveKey: (req) => req.ip || "unknown",
  message: "Batas pembuatan instansi untuk hari ini sudah tercapai."
});

const resendVerificationRateLimit = createRateLimiter({
  keyPrefix: "organization-resend",
  windowMs: 15 * 60 * 1000,
  limit: 3,
  resolveKey: (req) => `${req.ip}:${String(req.body?.email || "").trim().toLowerCase() || "unknown"}`,
  message: "Terlalu sering mengirim ulang verifikasi. Coba lagi beberapa menit lagi."
});

const reportOrganizationRateLimit = createRateLimiter({
  keyPrefix: "organization-report-abuse",
  windowMs: 24 * 60 * 60 * 1000,
  limit: 3,
  resolveKey: (req) => `${req.ip}:${req.params?.id || "unknown"}`,
  message: "Batas pelaporan instansi untuk hari ini sudah tercapai."
});

router.get("/", listOrganizations);
router.get("/verify", verifyOrganizationEmail);
router.post("/resend-verification", resendVerificationRateLimit, resendOrganizationVerificationEmail);
router.post("/register", registerOrganizationRateLimit, upload.single("logo"), registerOrganization);
router.post("/:id/report-abuse", authenticate, reportOrganizationRateLimit, reportOrganizationAbuse);

export default router;

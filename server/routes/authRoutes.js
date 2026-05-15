import { Router } from "express";
import {
  getMyNotifications,
  login,
  markAllNotificationsRead,
  markNotificationRead,
  me,
  register,
  updateMe
} from "../controllers/authController.js";
import { authenticate, requireActiveOrganization, requireAuth } from "../middlewares/authMiddleware.js";
import { createRateLimiter } from "../middlewares/rateLimitMiddleware.js";

const router = Router();
const isProduction = process.env.NODE_ENV === "production";

const loginRateLimit = createRateLimiter({
  keyPrefix: "auth-login",
  windowMs: isProduction ? 15 * 60 * 1000 : 60 * 1000,
  limit: isProduction ? 5 : 20,
  resolveKey: (req) => `${req.ip}:${String(req.body?.email || "").trim().toLowerCase() || "unknown"}`,
  message: "Terlalu banyak percobaan login. Coba lagi dalam beberapa menit."
});

const registerRateLimit = createRateLimiter({
  keyPrefix: "auth-register",
  windowMs: 24 * 60 * 60 * 1000,
  limit: 8,
  resolveKey: (req) => `${req.ip}:${String(req.body?.organizationId || "unknown")}`,
  message: "Batas pendaftaran akun tercapai untuk hari ini."
});

router.post("/register", authenticate, requireAuth, registerRateLimit, register);
router.post("/login", loginRateLimit, login);
router.get("/me", authenticate, requireAuth, requireActiveOrganization, me);
router.patch("/me", authenticate, requireAuth, requireActiveOrganization, updateMe);
router.get("/notifications", authenticate, requireAuth, requireActiveOrganization, getMyNotifications);
router.patch("/notifications/read-all", authenticate, requireAuth, requireActiveOrganization, markAllNotificationsRead);
router.patch("/notifications/:id/read", authenticate, requireAuth, requireActiveOrganization, markNotificationRead);

export default router;

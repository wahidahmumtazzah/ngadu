import { Router } from "express";
import { login, me, register, updateMe } from "../controllers/authController.js";
import { authenticate, requireAuth } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, requireAuth, me);
router.patch("/me", authenticate, requireAuth, updateMe);

export default router;

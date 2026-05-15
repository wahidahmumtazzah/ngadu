import { Router } from "express";
import { getAdminUsers, updateAdminUser } from "../controllers/adminController.js";
import { authenticate, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/users", authenticate, requireAdmin, getAdminUsers);
router.patch("/users/:id", authenticate, requireAdmin, updateAdminUser);

export default router;

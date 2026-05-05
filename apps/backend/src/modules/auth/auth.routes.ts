import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../shared/middleware/auth.middleware";

const router = Router();

// Public
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);

// Protected
router.post("/logout", authenticate, AuthController.logout);
router.patch("/fcm-token", authenticate, AuthController.updateFcmToken);

export default router;

import { Router } from "express";
import { SessionsController } from "./sessions.controller";
import { authenticate } from "../../shared/middleware/auth.middleware";

const router = Router();
router.use(authenticate);

router.post("/", SessionsController.start);
router.get("/:id", SessionsController.getById);
router.patch("/:id/end", SessionsController.end);
router.get("/:id/summary", SessionsController.getSummary);

export default router;

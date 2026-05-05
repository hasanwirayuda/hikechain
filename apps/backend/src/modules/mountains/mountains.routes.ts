import { Router } from "express";
import { MountainsController } from "./mountains.controller";
import { authenticate } from "../../shared/middleware/auth.middleware";

const router = Router();
router.use(authenticate);

router.get("/", MountainsController.list);
router.get("/:id", MountainsController.getById);

export default router;

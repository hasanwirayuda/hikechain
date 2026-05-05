import { Router } from "express";
import { GroupsController } from "./groups.controller";
import { authenticate } from "../../shared/middleware/auth.middleware";

const router = Router();
router.use(authenticate);

router.post("/", GroupsController.create);
router.post("/join", GroupsController.join);
router.get("/:id", GroupsController.getById);
router.delete("/:id/members/:userId", GroupsController.removeMember);
router.delete("/:id/leave", GroupsController.leave);

export default router;

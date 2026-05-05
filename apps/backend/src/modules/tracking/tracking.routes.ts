import { Router } from "express";
import { TrackingController } from "./tracking.controller";
import { authenticate } from "../../shared/middleware/auth.middleware";

const router = Router();
router.use(authenticate);

router.post("/:id/locations", TrackingController.uploadLocations);
router.get("/:id/locations/latest", TrackingController.getLatestLocations);

export default router;

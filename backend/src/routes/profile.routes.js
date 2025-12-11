import { Router } from "express";
import { 
    getProfileHeader, 
    getProfileHeatmap, 
    getProfileTimelineGraph 
} from "../controllers/profile.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// getProfileHeader,
// getProfileTimelineGraph,
// getProfileHeatmap

router.route("/getProfileHeader").get(verifyJWT,getProfileHeader)
router.route("/getProfileTimelineGraph").get(verifyJWT,getProfileTimelineGraph)
router.route("/getProfileHeatmap").get(verifyJWT,getProfileHeatmap)

export default router
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getFeed,
    getMostFollowedUsers,
    getMostLikedIncidents,
    getNearestReminders,
    getTopInsights,
    getRecentLogs,
    getQuickInsights 
} from "../controllers/dashboard.controller.js";

const router = Router();

router.route("/getFeed").get(verifyJWT,getFeed)

router.route("/getMostLikedIncidents").get(verifyJWT,getMostLikedIncidents)
router.route("/getNearestReminders").get(verifyJWT,getNearestReminders)
router.route("/getTopInsights").get(verifyJWT,getTopInsights)
router.route("/getMostFollowedUsers").get(verifyJWT,getMostFollowedUsers)
router.route("/getRecentLogs").get(verifyJWT,getRecentLogs)
router.route("/getQuickInsights").get(verifyJWT,getQuickInsights)

export default router
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createIncidentLog,
    deleteIncidentLog,
    getAllIncidents, 
    getBookmarkedLogs, 
    toggleBookmark
} from "../controllers/incident.controller.js";

const router = Router();

// getAllIncidents,
// createIncidentLog,
// deleteIncidentLog,
// toggleBookmark,
// getBookmarkedLogs,

router.route("/getAllIncidents").get(verifyJWT,getAllIncidents)
router.route("/createIncidentLog").post(verifyJWT,createIncidentLog)
router.route("/deleteIncidentLog").delete(verifyJWT,deleteIncidentLog)
router.route("/toggleBookmark").post(verifyJWT,toggleBookmark)
router.route("/getBookmarkedLogs").get(verifyJWT,getBookmarkedLogs)

export default router
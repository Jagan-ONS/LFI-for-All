import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    addManualReminder, 
    addPeriodicReminder, 
    deleteReminder, 
    getCalendarMonthData, 
    getDetailsForDay, 
    getFilteredReminders,
    updateReminder
} from "../controllers/reminder.controller.js";
const router = Router();

router.route("/addManualReminder").post(verifyJWT,addManualReminder)
router.route("/addPeriodicReminder").post(verifyJWT,addPeriodicReminder)
router.route("/getCalendarMonthData").get(verifyJWT,getCalendarMonthData)
router.route("/getFilteredReminders").get(verifyJWT,getFilteredReminders)
router.route("/getDetailsForDay").get(verifyJWT,getDetailsForDay)
router.route("/updateReminder/:reminderId").patch(verifyJWT,updateReminder)
router.route("/deleteReminder/:reminderId").delete(verifyJWT,deleteReminder)

export default router
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    deleteHabit,
    updateHabit,
    deleteHabitLog,
    logHabit,
    createHabit,
    getHabitPageData
} from "../controllers/habit.controller.js";

const router = Router();

    

router.route("/deleteHabit").delete(verifyJWT,deleteHabit)
router.route("/deleteHabitLog").delete(verifyJWT,deleteHabitLog)
router.route("/updateHabit").patch(verifyJWT,updateHabit)
router.route("/logHabit").post(verifyJWT,logHabit)
router.route("/createHabit").post(verifyJWT,createHabit)
router.route("/getHabitPageData").get(verifyJWT,getHabitPageData)
export default router
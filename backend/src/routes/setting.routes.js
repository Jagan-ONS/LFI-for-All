import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { logout, updateDetails, updateEmail, updatePassword } from "../controllers/settings.controller.js";

const router = Router();

router.route("/update-password").patch(verifyJWT,updatePassword)
router.route("/update-details").patch(verifyJWT,updateDetails)
router.route("/update-email").patch(verifyJWT,updateEmail)
router.route("/logout").post(verifyJWT,logout)
export default router
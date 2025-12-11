import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createJournal, 
    deleteJournal, 
    deleteJournalEntry, 
    getAllJournalsOfAType, 
    getJournalEntry, 
    verifyJournalPassword 
} from "../controllers/journal.controller.js";

const router = Router();

// createJournal,
// getAllJournalsOfAType,
// verifyJournalPassword,
// getJournalEntry,
// createOrUpdateJournalEntry,
// deleteJournal,
// deleteJournalEntry

router.route("/createJournal").post(verifyJWT,createJournal)
router.route("/getAllJournalsOfAType").get(verifyJWT,getAllJournalsOfAType)
router.route("/verifyJournalPassword").post(verifyJWT,verifyJournalPassword)
router.route("/getJournalEntry").get(verifyJWT,getJournalEntry)
router.route("/createOrUpdateJournalEntry").post(verifyJWT,createJournal)
router.route("/deleteJournal").delete(verifyJWT,deleteJournal)
router.route("/deleteJournalEntry").delete(verifyJWT,deleteJournalEntry)


export default router
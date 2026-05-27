import express from "express";
import { sendContactMessage, getContactInfo } from "../controllers/contactController.js";
const router = express.Router();
// POST - Send contact message
router.post("/send", sendContactMessage);
// GET - Get contact information
router.get("/info", getContactInfo);
export default router;
//# sourceMappingURL=contactRoutes.js.map
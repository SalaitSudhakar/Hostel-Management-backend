import express from 'express';
import { authMiddleware, roleMiddleware } from '../Middlewares/authMiddleware.js';
import { deleteResidentAccount, getResidentDetails, updateResidentDetails } from '../Controllers/residentController.js';


const router = express.Router();

/* Get resident details */
router.get( 
    "/profile", 
    authMiddleware,
    roleMiddleware(["resident"]),
    getResidentDetails
  );

/* Update resident details */
router.put("/profile/edit", authMiddleware, roleMiddleware(["resident"]), updateResidentDetails);

/* Delete Resident Account */
router.delete("/delete-account", authMiddleware, roleMiddleware(["admin"]), deleteResidentAccount);
export default router;
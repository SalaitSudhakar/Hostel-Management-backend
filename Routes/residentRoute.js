import express from 'express';
import { getResidentProfile, createResident, getAllResidents, updateResidentProfile } from '../Controllers/residentController.js';
import { authMiddleware, roleMiddleware } from '../Middlewares/authMiddleware.js'; // Import your middlewares

const router = express.Router();

// Route to get a resident's profile by ID (protected by authMiddleware)
router.get('/profile/:id', authMiddleware, getResidentProfile);

// Route to create a new resident 
router.post('/create', authMiddleware, roleMiddleware('resident'), createResident);

// Route to update a resident's profile by ID 
router.put('/update/:id', authMiddleware, roleMiddleware('resident'), updateResidentProfile);

// Route to get all residents
router.get('/getAll', authMiddleware, roleMiddleware('admin'), getAllResidents);

export default router;
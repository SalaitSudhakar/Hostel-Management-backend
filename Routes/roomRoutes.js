import express from 'express';
import { authMiddleware, roleMiddleware } from '../Middlewares/authMiddleware.js';
import { addRoom, assignRoomToResident, getAllRooms, getAvailableRooms, getRoomsWithResidents, updateRoomAvailability } from '../Controllers/roomController.js';

const router = express.Router();

router.get('/getAvailableRooms', getAvailableRooms);
router.put('/assignRoom', authMiddleware, roleMiddleware('resident'), assignRoomToResident);
router.put('/updateRoomAvailability', authMiddleware, roleMiddleware('admin'), updateRoomAvailability);
router.post('/create', authMiddleware, roleMiddleware('admin'), addRoom);
router.get('/get-all-rooms',  getAllRooms);
router.get('/get-residents-with-rooms', authMiddleware, roleMiddleware('admin'), getRoomsWithResidents);

export default router;
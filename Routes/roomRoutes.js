import express from 'express';
import { authMiddleware, adminMiddleware } from './../Middlewares/authMiddleware';
import { createRoom, deleteRoom, getAllRooms, updateRoom } from '../Controllers/roomControllers';


const router = express.Router();

router.post("/create-room", authMiddleware, adminMiddleware, createRoom);
router.put("/update-room", authMiddleware, adminMiddleware, updateRoom);
router.delete("/delete-room", authMiddleware, adminMiddleware, deleteRoom);
router.get("/get-rooms", authMiddleware, getAllRooms);
router.get("/get-single-room", authMiddleware, getSingleRoom);

export default router;
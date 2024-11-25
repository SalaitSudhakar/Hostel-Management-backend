import express from "express";
import { authMiddleware, roleMiddleware } from '../Middlewares/authMiddleware.js';

const router = express.Router();

router.get("/billing-report", authMiddleware, roleMiddleware("resident")
})

import express from "express";
import {
  createRevenue,
  getAllRevenue,
  getRevenueByCategory,
  updateRevenue,
  deleteRevenue,
} from "../Controllers/revenueController.js";


const router = express.Router();

// Revenue routes
router.post("/revenue", createRevenue);
router.get("/revenue", getAllRevenue);
router.get("/revenue/category/:category", getRevenueByCategory);
router.patch("/revenue/:revenueId", updateRevenue);
router.delete("/revenue/:revenueId", deleteRevenue);

export default router;
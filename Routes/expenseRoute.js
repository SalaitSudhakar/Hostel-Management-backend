import express from "express";
import {
    createExpense,
    getAllExpenses,
    getExpensesByCategory,
    updateExpense,
    deleteExpense,
  } from "../Controllers/expenseController.js";


  const router = express.Router();
  router.post("/expense", createExpense);
  router.get("/expense", getAllExpenses);
  router.get("/expense/category/:category", getExpensesByCategory);
  router.patch("/expense/:expenseId", updateExpense);
  router.delete("/expense/:expenseId", deleteExpense);
   
  export default router;
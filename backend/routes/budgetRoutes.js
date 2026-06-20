import express from "express";
import { getBudgets, createBudget, analyzeBudgets, updateBudget, deleteBudget } from "../controllers/budgetController.js";
import { protect } from "../middlewares/authMiddleware.js";

const budgetRouter = express.Router();

budgetRouter.use(protect);

budgetRouter.get("/", getBudgets);
budgetRouter.post("/", createBudget);
budgetRouter.post("/analyze", analyzeBudgets);
budgetRouter.put("/:id", updateBudget);
budgetRouter.delete("/:id", deleteBudget);

export default budgetRouter;
import express from "express";
import { getInsights, buildMonthlyInsight, buildSavingsTips, buildBudgetAlert, generateInsight } from "../controllers/insightController.js";
import { protect } from "../middlewares/authMiddleware.js";

const insightRouter = express.Router();

insightRouter.use(protect);

insightRouter.get("/", getInsights);
insightRouter.post("/generate", generateInsight);
// insightRouter.post("/build-monthly-insight", buildMonthlyInsight);
// insightRouter.post("/build-savings-tips", buildSavingsTips);
// insightRouter.post("/build-budget-alert", buildBudgetAlert);

export default insightRouter;
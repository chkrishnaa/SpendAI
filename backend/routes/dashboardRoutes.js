import express from 'express';
import { getSummary, getCategoryBreakdown, getMonthlyTrend } from '../controllers/dashboardController.js';
import { protect } from "../middlewares/authMiddleware.js";

const dashboardRouter = express.Router();

dashboardRouter.use(protect);

dashboardRouter.get('/summary', getSummary);
dashboardRouter.get('/category-breakdown', getCategoryBreakdown);
dashboardRouter.get('/monthly-trend', getMonthlyTrend);

export default dashboardRouter;
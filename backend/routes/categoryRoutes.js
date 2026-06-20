import express from "express";
import { getCategories, createCategory, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import { protect } from "../middlewares/authMiddleware.js";

const categoryRouter = express.Router();

categoryRouter.use(protect);

categoryRouter.get("/", getCategories);
categoryRouter.post("/", createCategory);
categoryRouter.put("/:id", updateCategory);
categoryRouter.delete("/:id", deleteCategory);

export default categoryRouter;
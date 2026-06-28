import express from "express";
import {
  createExpenseController,
  deleteExpenseController,
  getAllExpensesController,
  getExpenseByIdController,
  updateExpenseController,
} from "../controllers/expense.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authRequired);
router.use(authorization("owner"));

router.post("/", createExpenseController);

router.get("/", getAllExpensesController);

router.get("/:id", getExpenseByIdController);

router.put("/:id", updateExpenseController);

router.delete("/:id", deleteExpenseController);

export default router;

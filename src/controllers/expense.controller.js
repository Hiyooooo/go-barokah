import {
  createExpenseService,
  deleteExpenseService,
  getAllExpensesService,
  getExpenseByIdService,
  updateExpenseService,
} from "../services/expense.service.js";

export async function createExpenseController(req, res, next) {
  try {
    const expense = await createExpenseService(req.body);
    res.status(201).json({
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllExpensesController(req, res, next) {
  try {
    const expenses = await getAllExpensesService(req.query);
    res.json({
      message: "Expenses retrieved successfully",
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
}

export async function getExpenseByIdController(req, res, next) {
  try {
    const expense = await getExpenseByIdService(req.params.id);
    res.json({
      message: "Expense retrieved successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateExpenseController(req, res, next) {
  try {
    const expense = await updateExpenseService(req.params.id, req.body);
    res.json({
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteExpenseController(req, res, next) {
  try {
    await deleteExpenseService(req.params.id);
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    next(error);
  }
}

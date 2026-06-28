import {
  createExpense,
  deleteExpense,
  findAllExpenses,
  findExpenseById,
  updateExpense,
} from "../repositories/expense.repository.js";
import {
  badRequest,
  isEmptyValue,
  isNonEmptyString,
  notFound,
  parseNonNegativeNumber,
  parsePositiveInt,
} from "../utils/index.js";

export const EXPENSE_CATEGORIES = [
  "SALARY",
  "RENT",
  "UTILITIES",
  "DEPRECIATION",
  "TAX",
  "OTHER",
];

function parseCategory(raw) {
  const normalized = String(raw).trim().toUpperCase();
  if (!EXPENSE_CATEGORIES.includes(normalized)) {
    throw badRequest(
      `Invalid category. Valid values: ${EXPENSE_CATEGORIES.join(", ")}`
    );
  }
  return normalized;
}

function parseDate(value, fieldName) {
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    throw badRequest(`Invalid ${fieldName} format. Use YYYY-MM-DD`);
  }
  return parsed;
}

export async function createExpenseService(payload) {
  const { category, description, amount, date } = payload;

  if (isEmptyValue(category))    throw badRequest("category is required");
  if (isEmptyValue(description)) throw badRequest("description is required");
  if (isEmptyValue(amount))      throw badRequest("amount is required");
  if (isEmptyValue(date))        throw badRequest("date is required");

  const parsedCategory = parseCategory(category);

  if (!isNonEmptyString(description)) {
    throw badRequest("description must be a non-empty string");
  }

  const parsedAmount = parseNonNegativeNumber(amount, "amount");

  const parsedDate = parseDate(date, "date");

  return await createExpense({
    category:    parsedCategory,
    description: description.trim(),
    amount:      parsedAmount,
    date:        parsedDate,
  });
}

export async function getAllExpensesService(filters = {}) {
  let startDate, endDate, category;

  if (filters.startDate) {
    startDate = parseDate(filters.startDate, "startDate");
  }

  if (filters.endDate) {
    endDate = parseDate(filters.endDate, "endDate");
    endDate.setHours(23, 59, 59, 999);
  }

  if (startDate && endDate && startDate > endDate) {
    throw badRequest("startDate cannot be after endDate");
  }

  if (filters.category) {
    category = parseCategory(filters.category);
  }

  return await findAllExpenses({ startDate, endDate, category });
}

export async function getExpenseByIdService(id) {
  const parsedId = parsePositiveInt(id, "expense id");

  const expense = await findExpenseById(parsedId);
  if (!expense) throw notFound("Expense not found");

  return expense;
}

export async function updateExpenseService(id, payload) {
  const parsedId = parsePositiveInt(id, "expense id");

  const existing = await findExpenseById(parsedId);
  if (!existing) throw notFound("Expense not found");

  const data = {};

  if (payload.category !== undefined) {
    data.category = parseCategory(payload.category);
  }

  if (payload.description !== undefined) {
    if (!isNonEmptyString(payload.description)) {
      throw badRequest("description must be a non-empty string");
    }
    data.description = payload.description.trim();
  }

  if (payload.amount !== undefined) {
    data.amount = parseNonNegativeNumber(payload.amount, "amount");
  }

  if (payload.date !== undefined) {
    data.date = parseDate(payload.date, "date");
  }

  if (Object.keys(data).length === 0) {
    throw badRequest("No fields to update");
  }

  return await updateExpense(parsedId, data);
}

export async function deleteExpenseService(id) {
  const parsedId = parsePositiveInt(id, "expense id");

  const existing = await findExpenseById(parsedId);
  if (!existing) throw notFound("Expense not found");

  return await deleteExpense(parsedId);
}

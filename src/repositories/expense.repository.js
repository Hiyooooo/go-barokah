import prisma from "../config/prisma.js";

export async function createExpense(data) {
  return await prisma.expense.create({ data });
}

export async function findAllExpenses(filters = {}) {
  const { startDate, endDate, category } = filters;

  return await prisma.expense.findMany({
    where: {
      ...(startDate && endDate && {
        date: { gte: startDate, lte: endDate },
      }),
      ...(category && { category }),
    },
    orderBy: { date: "desc" },
  });
}

export async function findExpenseById(id) {
  return await prisma.expense.findUnique({ where: { id } });
}

export async function updateExpense(id, data) {
  return await prisma.expense.update({ where: { id }, data });
}

export async function deleteExpense(id) {
  return await prisma.expense.delete({ where: { id } });
}

export async function sumExpensesByDateRange(startDate, endDate, onlyCategories = []) {
  return await prisma.expense.aggregate({
    where: {
      date: { gte: startDate, lte: endDate },
      ...(onlyCategories.length > 0 && { category: { in: onlyCategories } }),
    },
    _sum: { amount: true },
  });
}

export async function groupExpensesByCategory(startDate, endDate) {
  return await prisma.expense.groupBy({
    by: ["category"],
    where: { date: { gte: startDate, lte: endDate } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });
}

export async function getExpensesTrendMonthly(startDate, endDate) {
  return await prisma.$queryRaw`
    SELECT
      DATE_FORMAT(date, '%Y-%m') AS bulan,
      SUM(amount)                AS total
    FROM expenses
    WHERE date BETWEEN ${startDate} AND ${endDate}
    GROUP BY DATE_FORMAT(date, '%Y-%m')
    ORDER BY bulan ASC
  `;
}

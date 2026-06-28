import {
  getCashInflowAggregation,
  getRevenueAggregation,
  getRevenuePerProduct,
} from "../repositories/analytics.repository.js";
import {
  groupExpensesByCategory,
  getExpensesTrendMonthly,
  sumExpensesByDateRange,
} from "../repositories/expense.repository.js";
import { badRequest } from "../utils/index.js";

function parseDateRange(startDate, endDate) {
  if (!startDate) throw badRequest("startDate is required");
  if (!endDate)   throw badRequest("endDate is required");

  const start = new Date(startDate);
  const end   = new Date(endDate);

  if (isNaN(start.getTime())) throw badRequest("Invalid startDate format. Use YYYY-MM-DD");
  if (isNaN(end.getTime()))   throw badRequest("Invalid endDate format. Use YYYY-MM-DD");

  end.setHours(23, 59, 59, 999);

  if (start > end) throw badRequest("startDate cannot be after endDate");

  return { start, end };
}

export async function getOmzetService(filters = {}) {
  const { start, end } = parseDateRange(filters.startDate, filters.endDate);

  const [revenue, perProduct] = await Promise.all([
    getRevenueAggregation(start, end),
    getRevenuePerProduct(start, end),
  ]);

  const omzet             = revenue._sum.itemsSubtotal ?? 0;
  const totalDiscount     = revenue._sum.discountTotal  ?? 0;
  const totalTransactions = revenue._count.id           ?? 0;
  const averagePerTransaction = totalTransactions > 0 ? omzet / totalTransactions : 0;

  const perProductFormatted = perProduct.map((p) => ({
    product_id:   p.productId,
    product_name: p.productName,
    qty_sold:     p._sum.quantity   ?? 0,
    revenue:      p._sum.subtotal   ?? 0,
    cogs:         p._sum.totalCost  ?? 0,
    gross_profit: p._sum.grossProfit ?? 0,
  }));

  return {
    period: { start_date: filters.startDate, end_date: filters.endDate },
    omzet,
    total_discount:           totalDiscount,
    total_transactions:       totalTransactions,
    average_per_transaction:  averagePerTransaction,
    per_product:              perProductFormatted,
  };
}

export async function getNetProfitService(filters = {}) {
  const { start, end } = parseDateRange(filters.startDate, filters.endDate);

  const [revenue, operatingExpenseResult, taxResult, breakdownByCategory] =
    await Promise.all([
      getRevenueAggregation(start, end),
      sumExpensesByDateRange(start, end, ["SALARY", "RENT", "UTILITIES", "DEPRECIATION", "OTHER"]),
      sumExpensesByDateRange(start, end, ["TAX"]),
      groupExpensesByCategory(start, end),
    ]);

  const omzet = revenue._sum.itemsSubtotal ?? 0;
  const cogs  = revenue._sum.totalCost     ?? 0;

  const grossProfit        = omzet - cogs;
  const grossMarginPercent = omzet > 0 ? (grossProfit / omzet) * 100 : 0;

  const operatingExpenses  = operatingExpenseResult._sum.amount ?? 0;
  const operatingProfit    = grossProfit - operatingExpenses;

  const tax                = taxResult._sum.amount ?? 0;
  const netProfit          = operatingProfit - tax;
  const netMarginPercent   = omzet > 0 ? (netProfit / omzet) * 100 : 0;

  const expenseBreakdown = breakdownByCategory
    .filter((b) => (b._sum.amount ?? 0) > 0)
    .map((b) => ({
      category: b.category,
      amount:   b._sum.amount ?? 0,
    }));

  return {
    period: { start_date: filters.startDate, end_date: filters.endDate },
    omzet,
    cogs,
    filter_1: {
      label:         "Gross Profit",
      value:         grossProfit,
      margin_percent: grossMarginPercent,
    },
    operating_expenses: {
      total:     operatingExpenses,
      breakdown: expenseBreakdown,
    },
    filter_2: {
      label: "Operating Profit",
      value: operatingProfit,
    },
    tax,
    filter_3: {
      label:         "Net Profit",
      value:         netProfit,
      margin_percent: netMarginPercent,
    },
  };
}

export async function getCashFlowService(filters = {}) {
  const { start, end } = parseDateRange(filters.startDate, filters.endDate);

  const [cashIn, expenseResult] = await Promise.all([
    getCashInflowAggregation(start, end),
    sumExpensesByDateRange(start, end),
  ]);

  const totalInflow    = cashIn._sum.grandTotal  ?? 0; 
  const shippingFee    = cashIn._sum.shippingFee ?? 0;
  const productRevenue = totalInflow - shippingFee;

  const cogs             = cashIn._sum.totalCost    ?? 0;
  const operatingExpenses = expenseResult._sum.amount ?? 0;
  const totalOutflow     = cogs + operatingExpenses;

  const netCashFlow = totalInflow - totalOutflow;
  const status =
    netCashFlow > 0 ? "POSITIVE" :
    netCashFlow === 0 ? "BREAK_EVEN" :
    "NEGATIVE";

  return {
    period: { start_date: filters.startDate, end_date: filters.endDate },
    cash_in: {
      total: totalInflow,
      breakdown: {
        product_sales: productRevenue,
        shipping_fee_received: shippingFee,
      },
    },
    cash_out: {
      total: totalOutflow,
      breakdown: {
        cogs,
        operating_expenses: operatingExpenses,
      },
    },
    net_cash_flow: netCashFlow,
    status,
  };
}

export async function getCostAnalysisService(filters = {}) {
  const { start, end } = parseDateRange(filters.startDate, filters.endDate);

  const [totalResult, breakdown, trend] = await Promise.all([
    sumExpensesByDateRange(start, end),
    groupExpensesByCategory(start, end),
    getExpensesTrendMonthly(start, end),
  ]);

  const totalCost = totalResult._sum.amount ?? 0;

  const monthCount =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) + 1;
  const monthlyAverage = monthCount > 0 ? totalCost / monthCount : totalCost;

  const breakdownFormatted = breakdown.map((b) => ({
    category: b.category,
    total:    b._sum.amount ?? 0,
    percent:  totalCost > 0 ? ((b._sum.amount ?? 0) / totalCost) * 100 : 0,
  }));

  const trendFormatted = trend.map((t) => ({
    month: t.bulan,
    total: Number(t.total),
  }));

  return {
    period:          { start_date: filters.startDate, end_date: filters.endDate },
    total_cost:      totalCost,
    monthly_average: monthlyAverage,
    breakdown:       breakdownFormatted,
    monthly_trend:   trendFormatted,
  };
}

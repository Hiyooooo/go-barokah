import {
  createCashSaleService,
  getCashSaleReceiptService,
  getCashSaleService,
} from "../services/cash-sale.service.js";

export async function createCashSaleController(req, res, next) {
  try {
    const data = await createCashSaleService(req.user.id, req.body);
    res.status(201).json({ message: "Success create cash sale", data });
  } catch (error) {
    next(error);
  }
}

export async function getCashSaleReceiptController(req, res, next) {
  try {
    const html = await getCashSaleReceiptService(
      req.user.id,
      req.params.saleNumber,
    );
    res.type("html").send(html);
  } catch (error) {
    next(error);
  }
}

export async function getCashSaleController(req, res, next) {
  try {
    const data = await getCashSaleService(req.user.id, req.params.saleNumber);
    res.status(200).json({ message: "Success get cash sale", data });
  } catch (error) {
    next(error);
  }
}

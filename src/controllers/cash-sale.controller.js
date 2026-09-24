import {
  createCashSaleService,
  getCashSalesService,
  getCashSaleReceiptService,
  getCashSaleService,
  cancelCashSaleService,
} from "../services/cash-sale.service.js";

export async function createCashSaleController(req, res, next) {
  try {
    const data = await createCashSaleService(
      req.user.id,
      req.body,
      req.get("Idempotency-Key"),
    );
    const message =
      data.status === "PENDING"
        ? "Transaksi berhasil dibuat, silakan selesaikan pembayaran"
        : "Success create cash sale";
    res.status(201).json({ message, data });
  } catch (error) {
    next(error);
  }
}

export async function getCashSalesController(req, res, next) {
  try {
    const result = await getCashSalesService(
      req.user.id,
      req.query,
      req.user.role,
    );
    res.status(200).json({
      message: "Success get cash sales",
      data: result.data,
      meta: result.meta,
    });
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

export async function cancelCashSaleController(req, res, next) {
  try {
    const data = await cancelCashSaleService(req.user.id, req.params.saleNumber);
    res.status(200).json({ message: "Transaksi berhasil dibatalkan", data });
  } catch (error) {
    next(error);
  }
}

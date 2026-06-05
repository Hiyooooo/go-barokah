import {
  cancelMyOrderService,
  createOrderService,
  createPickupOrderService,
  getAllOrdersService,
  getMyOrderByIdService,
  getMyOrdersService,
  getOrderByIdForAdminService,
  updateOrderStatusService,
  updatePaymentStatusService,
} from "../services/order.service.js";

export async function createOrderController(req, res, next) {
  try {
    const result = await createOrderService(req.user.id, req.body);

    return res.status(201).json({
      message: "Success create order",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPickupOrderController(req, res, next) {
  try {
    const result = await createPickupOrderService(req.user.id, req.body);

    return res.status(201).json({
      message: "Success create pickup order",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyOrdersController(req, res, next) {
  try {
    const result = await getMyOrdersService(req.user.id, req.query);

    return res.status(200).json({
      message: "Success get orders",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyOrderByIdController(req, res, next) {
  try {
    const result = await getMyOrderByIdService(req.user.id, req.params.id);

    return res.status(200).json({
      message: "Success get order",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelMyOrderController(req, res, next) {
  try {
    const result = await cancelMyOrderService(req.user.id, req.params.id);

    return res.status(200).json({
      message: "Success cancel order",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllOrdersController(req, res, next) {
  try {
    const result = await getAllOrdersService(req.query);

    return res.status(200).json({
      message: "Success get all orders",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderByIdForAdminController(req, res, next) {
  try {
    const result = await getOrderByIdForAdminService(req.params.id);

    return res.status(200).json({
      message: "Success get order",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatusController(req, res, next) {
  try {
    const result = await updateOrderStatusService(req.params.id, req.body);

    return res.status(200).json({
      message: "Success update order status",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePaymentStatusController(req, res, next) {
  try {
    const result = await updatePaymentStatusService(req.params.id, req.body);

    return res.status(200).json({
      message: "Success update payment status",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

import {
  clearCartService,
  createCartItemService,
  deleteCartItemService,
  getCartService,
  updateCartItemService,
} from "../services/cart.service.js";

export async function getCartController(req, res, next) {
  try {
    const result = await getCartService(req.user.id);

    return res.status(200).json({
      message: "Success get cart",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCartItemController(req, res, next) {
  try {
    const result = await createCartItemService(req.user.id, req.body);

    return res.status(201).json({
      message: "Success add product to cart",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCartItemController(req, res, next) {
  try {
    const result = await updateCartItemService(
      req.user.id,
      req.params.productId,
      req.body,
    );

    return res.status(200).json({
      message: "Success update cart item",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCartItemController(req, res, next) {
  try {
    const result = await deleteCartItemService(req.user.id, req.params.productId);

    return res.status(200).json({
      message: "Success delete cart item",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function clearCartController(req, res, next) {
  try {
    const result = await clearCartService(req.user.id);

    return res.status(200).json({
      message: "Success clear cart",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

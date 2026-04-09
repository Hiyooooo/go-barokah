import {
  createProductService,
  deleteProductService,
  getAllProductsService,
  getProductByIdService,
  updateProductService,
} from "../services/product.service.js";

export async function getAllProductsController(req, res, next) {
  try {
    const products = await getAllProductsService();
    return res.status(200).json({
      message: "Success get all products",
      data: products,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductByIdController(req, res, next) {
  try {
    const product = await getProductByIdService(req.params.id);
    return res.status(200).json({
      message: "Success get product",
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProductController(req, res, next) {
  try {
    const result = await createProductService(req.body);
    return res.status(201).json({
      message: "Success create product",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProductController(req, res, next) {
  try {
    const result = await updateProductService(req.params.id, req.body);
    return res.status(200).json({
      message: "Success update product",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProductController(req, res, next) {
  try {
    const result = await deleteProductService(req.params.id);
    return res.status(200).json({
      message: "Success delete product",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

import {
  createCategoryService,
  deleteCategoryService,
  getAllCategoryService,
  getCategoryByIdService,
  updateCategoryService,
} from "../services/category.service.js";

export async function getAllCategoryController(req, res, next) {
  try {
    const category = await getAllCategoryService();
    return res.status(200).json({
      message: "Successfull get all category",
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategoryByIdController(req, res, next) {
  try {
    const category = await getCategoryByIdService(req.params.id);
    return res.status(200).json({
      message: "Successfull get category",
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategoryController(req, res, next) {
  try {
    const category = await createCategoryService(req.body);
    return res.status(201).json({
      message: "Successfull create category",
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCategoryController(req, res, next) {
  try {
    const category = await updateCategoryService(req.params.id, req.body);
    return res.status(200).json({
      message: "Successfull updated category",
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategoryController(req, res, next) {
  try {
    const category = await deleteCategoryService(req.params.id);
    return res.status(200).json({
      message: "Successfull delete category",
      data: category,
    });
  } catch (error) {
    next(error);
  }
}

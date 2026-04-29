import {
  createTypeService,
  deleteTypeService,
  getAllTypeService,
  getTypeByIdService,
  updateTypeService,
} from "../services/type.service.js";

export async function getAllTypeController(req, res, next) {
  try {
    const type = await getAllTypeService();
    return res.status(200).json({
      message: "Successfull get all type",
      data: type,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTypeByIdController(req, res, next) {
  try {
    const type = await getTypeByIdService(req.params.id);
    return res.status(200).json({
      message: "Successfull get category",
      data: type,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTypeController(req, res, next) {
  try {
    const type = await createTypeService(req.body);
    return res.status(201).json({
      message: "Successfull create type",
      data: type,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTypeController(req, res, next) {
  try {
    const type = await updateTypeService(req.params.id, req.body);
    return res.status(200).json({
      message: "Successfull updated type",
      data: type,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTypeController(req, res, next) {
  try {
    const type = await deleteTypeService(req.params.id);
    return res.status(200).json({
      message: "Successfull delete type",
      data: type,
    });
  } catch (error) {
    next(error);
  }
}

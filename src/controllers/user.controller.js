import {
  getMyProfileService,
  updateAccountService,
} from "../services/user.service.js";

export async function getMyProfileController(req, res, next) {
  try {
    const result = await getMyProfileService(req.user.id);
    return res.status(200).json({
      message: "Success get profile",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAccountController(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await updateAccountService(userId, req.body);
    return res.status(200).json({
      message: "Success update account",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

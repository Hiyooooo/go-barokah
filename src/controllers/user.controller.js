import { updateAccountService } from "../services/user.service.js";

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

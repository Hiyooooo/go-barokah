import { googleLoginService, loginService, registerService } from "../services/auth.service.js";

export async function registerController(req, res, next) {
    try {
        const result = await registerService(req.body);
        return res.status(201).json({
            message: "Successfully register",
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export async function loginController(req, res, next) {
    try {
        const result = await loginService(req.body);
        return res.status(200).json({
            message: "Successfully login",
            data: result
        });
    } catch (error) {
        next(error);
    }
}

export async function googleLoginController(req, res, next) {
    try {
        const result = await googleLoginService(req.body);
        return res.status(200).json({
            message: "Successfully login with Google",
            data: result
        });
    } catch (error) {
        next(error);
    }
}

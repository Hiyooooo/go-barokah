import { loginService, registerService } from "../services/auth.service.js";

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function isValidPhone(phone) {
  const regex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  return regex.test(phone);
}

export async function registerController(req, res, next) {
    try {
        const { email, password, username, phone_number, image_url } = req.body;

        if (!email || !password || !username) {
            return res.status(400).json({ message: "Email, password, and username are required" });
        }
        if (!isEmail(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        if (phone_number && !isValidPhone(phone_number)) {
            return res.status(400).json({message: "Invalid phone number format"})
        }

        const result = await registerService({ email, password, username, phone_number, image_url });
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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Invalid username or password" });
        }
        const result = await loginService({ email, password });
        return res.status(200).json({
            message: "Successfully login",
            data: result
        });
    } catch (error) {
        next(error);
    }
}

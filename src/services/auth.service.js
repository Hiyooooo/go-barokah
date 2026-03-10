import { createAccount, findByEmail, findByPhone } from "../repositories/auth.repository.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";

export function sanitizeUser(account) {
    return {
        id: account.id,
        email: account.email,
        username: account.name,
        phone_number: account.phoneNumber,
        image_url: account.imageUrl,
        role: account.role,
        createdAt: account.createdAt
    };
}

export async function registerService({ email, password, username, phone_number, image_url }) {
    const existingEmail = await findByEmail(email);
    if (existingEmail) {
        const err = new Error("Email already taken");
        err.statusCode = 400;
        throw err;
    }

    const existingPhone = await findByPhone(phone_number)
    if(existingPhone){
        const err = new Error("Phone number already taken")
        err.statusCode = 400;
        throw err
    }

    const passwordHash = await hashPassword(password);
    const account = await createAccount({
        email,
        password: passwordHash,
        username,
        role: "user",
        phone_number,
        image_url
    });

    return { account: sanitizeUser(account)};
}

export async function loginService({ email, password }) {
    const account = await findByEmail(email);
    if (!account) {
        const err = new Error("Invalid username or password");
        err.statusCode = 400;
        throw err;
    }

    const ok = await comparePassword(password, account.password);
    if (!ok) {
        const err = new Error("Invalid username or password");
        err.statusCode = 400;
        throw err;
    }

    const token = signToken({ sub: account.id, email: account.email });
    return { account: sanitizeUser(account), token };
}

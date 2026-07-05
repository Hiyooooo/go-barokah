import {
    getAllAdminAccountService,
    getAllUserAccountService,
    removeAdminService,
    setAdminService
} from "../services/employee.service.js";

export async function getAllUserAccountController(req, res, next) {
    try {
        const allUserAccount = await getAllUserAccountService()
        return res.status(200).json({
            message: "Success get all user accounts",
            data: allUserAccount
        })
    } catch (error) {
        next(error)
    }
}

export async function getAllAdminAccountController(req, res, next) {
    try {
        const allAdminAccount = await getAllAdminAccountService()
        return res.status(200).json({
            message: "Success get all admin accounts",
            data: allAdminAccount
        })
    } catch (error) {
        next(error)
    }
}

export async function setAdminController(req, res, next) {
    try {
        const { email } = req.body
        const result = await setAdminService(email)
        return res.status(200).json({
            message: "Successfully promoted account to admin",
            data: result
        })
    } catch (error) {
        next(error)
    }
}

export async function removeAdminController(req, res, next) {
    try {
        const { email } = req.body
        const result = await removeAdminService(email)
        return res.status(200).json({
            message: "Successfully demoted account to user",
            data: result
        })
    } catch (error) {
        next(error)
    }
}
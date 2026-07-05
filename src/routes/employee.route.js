import express from "express"
import { authorization, authRequired } from "../middlewares/auth.middleware.js"
import {
    getAllAdminAccountController,
    getAllUserAccountController,
    removeAdminController,
    setAdminController
} from "../controllers/employee.controller.js"

const router = express.Router()

router.use(authRequired)
router.use(authorization("owner"))

router.get("/users", getAllUserAccountController)

router.get("/admins", getAllAdminAccountController)

router.patch("/promote", setAdminController)

router.patch("/demote", removeAdminController)

export default router
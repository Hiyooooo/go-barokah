import express from "express";
import {
  createAddressController,
  deleteAdressController,
  getAddressByIdController,
  getAllAdressController,
  updateAddressController,
} from "../controllers/address.controller.js";
import { authRequired, authorization } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.use(authRequired);
router.use(authorization("user", "admin"));

router.get("/", getAllAdressController);
router.post("/", createAddressController);
router.get("/:id", getAddressByIdController);
router.patch("/:id", updateAddressController);
router.delete("/:id", deleteAdressController);

export default router;

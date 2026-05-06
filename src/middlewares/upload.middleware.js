import fs from "node:fs";
import multer from "multer";
import { badRequest } from "../utils/index.js";

const productImageFolder = "uploads/products";

fs.mkdirSync(productImageFolder, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, productImageFolder);
  },
  filename(req, file, cb) {
    const extension = file.originalname.split(".").pop();
    const newFileName = `${Date.now()}-product.${extension}`;
    cb(null, newFileName);
  },
});

function imageOnly(req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    return cb(badRequest("Product image must be an image file"));
  }

  cb(null, true);
}

export const uploadProductImage = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: imageOnly,
});

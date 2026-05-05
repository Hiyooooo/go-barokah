import fs from "node:fs/promises";
import path from "node:path";
import { isLocalUploadPath } from "./validators.js";

export async function deletelocalUploadFile(
  fileUrl,
  uploadPath = "/uploads/products",
) {
  if (!isLocalUploadPath(fileUrl, uploadPath)) {
    return;
  }

  const fileName = path.basename(fileUrl);
  const uploadFolder = uploadPath.replace(/^\/+/, "");
  const filePath = path.join(process.cwd(), uploadFolder, fileName);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

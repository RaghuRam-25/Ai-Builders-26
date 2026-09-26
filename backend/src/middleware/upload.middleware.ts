import fs from "node:fs";
import path from "node:path";

import multer from "multer";

import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/heic",
]);

const ALLOWED_EXT = new Set([".pdf", ".png", ".jpg", ".jpeg", ".webp", ".heic"]);

fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXT.has(ext) ? ext : ".bin";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${safeExt}`);
  },
});

export const documentUpload = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(
        ApiError.unsupportedMediaType(
          "Only PDF and image files (PNG, JPEG, WEBP, HEIC) are accepted",
        ),
      );
      return;
    }
    cb(null, true);
  },
}).single("document");

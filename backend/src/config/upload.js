import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AppError } from '../middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'features');

const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx']);
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${base || 'document'}-${unique}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return cb(new AppError('Format non autorisé. Formats acceptés : PDF, Word (.doc, .docx)', 400));
  }
  cb(null, true);
}

export const uploadFeatureAttachment = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 1 },
  fileFilter,
});

export function deleteAttachmentFile(relativePath) {
  if (!relativePath) return;
  const absolute = path.resolve(relativePath);
  if (absolute.startsWith(UPLOAD_DIR) && fs.existsSync(absolute)) {
    try {
      fs.unlinkSync(absolute);
    } catch (e) {
      console.error('Erreur suppression fichier pièce jointe:', e);
    }
  }
}

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';

const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE ?? 10485760) },
});

export const adminMediaRouter = Router();

adminMediaRouter.use(requireAdmin());

adminMediaRouter.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const media = await prisma.mediaFile.create({
    data: {
      filename: req.file.originalname,
      path: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });

  res.status(201).json({
    id: media.id,
    url: `/uploads/${media.path}`,
    filename: media.filename,
    mimeType: media.mimeType,
  });
});

adminMediaRouter.get('/', async (_req, res) => {
  const files = await prisma.mediaFile.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(
    files.map((f) => ({
      ...f,
      url: `/uploads/${f.path}`,
    })),
  );
});

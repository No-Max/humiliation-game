import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma.js';
import { requireAdmin } from '../../middleware/auth.js';

const uploadDir = process.env.UPLOAD_DIR ?? 'uploads';
fs.mkdirSync(uploadDir, { recursive: true });

const MAX_UPLOAD_SIZE = Number(process.env.MAX_UPLOAD_SIZE ?? 10485760);
const MAX_ANSWER_MEDIA_UPLOAD_SIZE = Number(
  process.env.MAX_ANSWER_MEDIA_UPLOAD_SIZE ?? 5 * 1024 * 1024,
);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

function mediaFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  if (
    file.mimetype.startsWith('image/')
    || file.mimetype.startsWith('audio/')
    || file.mimetype.startsWith('video/')
  ) {
    cb(null, true);
    return;
  }
  cb(new Error('Можно загружать только изображения, аудио или видео'));
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE },
  fileFilter: mediaFileFilter,
});

const uploadAnswerMedia = multer({
  storage,
  limits: { fileSize: MAX_ANSWER_MEDIA_UPLOAD_SIZE },
  fileFilter: mediaFileFilter,
});

function uploadErrorMessage(err: unknown, maxBytes: number): string {
  if (err && typeof err === 'object' && 'code' in err && err.code === 'LIMIT_FILE_SIZE') {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return `Файл слишком большой. Максимум ${maxMb} МБ`;
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Ошибка загрузки';
}

async function persistUpload(req: Request, res: Response) {
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
}

export const adminMediaRouter = Router();

adminMediaRouter.use(requireAdmin());

adminMediaRouter.post('/upload', (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: uploadErrorMessage(err, MAX_UPLOAD_SIZE) });
      return;
    }
    await persistUpload(req, res);
  });
});

adminMediaRouter.post('/upload/answer-media', (req, res) => {
  uploadAnswerMedia.single('file')(req, res, async (err) => {
    if (err) {
      res.status(400).json({ error: uploadErrorMessage(err, MAX_ANSWER_MEDIA_UPLOAD_SIZE) });
      return;
    }
    await persistUpload(req, res);
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

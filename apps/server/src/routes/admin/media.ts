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

adminMediaRouter.get('/', async (req, res) => {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, Number.parseInt(String(req.query.limit ?? '20'), 10) || 20),
  );
  const kind = String(req.query.kind ?? 'all');
  const search = String(req.query.search ?? '').trim();

  const kindWhere =
    kind === 'image'
      ? { mimeType: { startsWith: 'image/' } }
      : kind === 'audio'
        ? { mimeType: { startsWith: 'audio/' } }
        : kind === 'video'
          ? { mimeType: { startsWith: 'video/' } }
          : {};

  const where = {
    ...kindWhere,
    ...(search
      ? { filename: { contains: search, mode: 'insensitive' as const } }
      : {}),
  };

  const [total, files] = await Promise.all([
    prisma.mediaFile.count({ where }),
    prisma.mediaFile.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

  res.json({
    items: files.map((f) => ({
      ...f,
      url: `/uploads/${f.path}`,
    })),
    page,
    limit,
    total,
    totalPages,
  });
});

adminMediaRouter.put('/:id', async (req, res) => {
  const id = String(req.params.id);
  const filename = String(req.body?.filename ?? '').trim();
  if (!filename) {
    res.status(400).json({ error: 'filename required' });
    return;
  }

  try {
    const media = await prisma.mediaFile.update({
      where: { id },
      data: { filename },
    });
    res.json({
      ...media,
      url: `/uploads/${media.path}`,
    });
  } catch {
    res.status(404).json({ error: 'Media not found' });
  }
});

adminMediaRouter.delete('/:id', requireAdmin(['ADMIN']), async (req, res) => {
  const id = String(req.params.id);
  const media = await prisma.mediaFile.findUnique({ where: { id } });
  if (!media) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }

  const filePath = path.join(uploadDir, media.path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await prisma.mediaFile.delete({ where: { id: media.id } });
  res.status(204).send();
});

import path from 'path';
import { fileURLToPath } from 'url';

/** Корень пакета apps/server (рядом с prisma/, uploads/). */
export function getServerRoot(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
}

/** Абсолютный путь к каталогу загрузок (UPLOAD_DIR или uploads/). */
export function resolveUploadDir(): string {
  const serverRoot = getServerRoot();
  const configured = process.env.UPLOAD_DIR?.trim();
  if (!configured) {
    return path.join(serverRoot, 'uploads');
  }
  return path.isAbsolute(configured)
    ? configured
    : path.join(serverRoot, configured);
}

/** Максимальный размер одного файла медиа правильного ответа (5 МБ). */
export const MAX_ANSWER_MEDIA_BYTES = 5 * 1024 * 1024;

export function formatMaxAnswerMediaSize(): string {
  return '5 МБ';
}

export function isAnswerMediaTooLarge(file: File): boolean {
  return file.size > MAX_ANSWER_MEDIA_BYTES;
}

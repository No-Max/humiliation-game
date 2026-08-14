export function stripHtml(html: string): string {
  if (!html) return '';
  if (!html.includes('<')) return html;
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isEmptyRichText(html: string): boolean {
  return !stripHtml(html);
}

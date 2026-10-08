export const SITE_NAME = 'Игра на унижение';

export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '')
  || 'https://ingame.by';

export const DEFAULT_DESCRIPTION =
  'Онлайн квиз для друзей: выбирайте выпуск, собирайте команды, отвечайте на вопросы и соревнуйтесь за баллы.';

export function plainTextFromHtml(html: string, maxLength = 160): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

export type RouteSeoMeta = {
  title: string;
  description?: string;
  /** Public pages only; game and session URLs stay noindex. */
  index?: boolean;
};

function setMeta(content: string, attr: 'name' | 'property', key: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applyRouteSeo(meta: RouteSeoMeta, path: string) {
  const description = meta.description ?? DEFAULT_DESCRIPTION;
  const documentTitle =
    meta.title === SITE_NAME ? meta.title : `${meta.title} — ${SITE_NAME}`;
  const robots = meta.index === false ? 'noindex, nofollow' : 'index, follow';
  const canonical = `${SITE_URL}${path}`;
  const ogImage = `${SITE_URL}/apple-touch-icon.png`;

  document.title = documentTitle;
  setMeta(description, 'name', 'description');
  setMeta(robots, 'name', 'robots');
  setMeta(documentTitle, 'property', 'og:title');
  setMeta(description, 'property', 'og:description');
  setMeta('website', 'property', 'og:type');
  setMeta(SITE_NAME, 'property', 'og:site_name');
  setMeta(canonical, 'property', 'og:url');
  setMeta(ogImage, 'property', 'og:image');
  setMeta('ru_RU', 'property', 'og:locale');
  setCanonical(canonical);
}

const ratioByUrl = new Map<string, number>();

export function getCachedMediaRatio(url: string): number | undefined {
  return ratioByUrl.get(url);
}

export function setCachedMediaRatio(url: string, ratio: number): void {
  ratioByUrl.set(url, ratio);
}

export function mediaUrlsKey(urls: string[] | undefined): string {
  return urls?.join('\0') ?? '';
}

export function syncMediaLayoutState(urls: string[] | undefined): {
  aspectRatios: number[];
  loaded: boolean[];
} {
  const list = urls ?? [];
  const aspectRatios = list.map((url) => ratioByUrl.get(url) ?? 1);
  const loaded = list.map((url) => ratioByUrl.has(url));
  return { aspectRatios, loaded };
}

export function allMediaCached(urls: string[] | undefined): boolean {
  const list = urls ?? [];
  return list.length > 0 && list.every((url) => ratioByUrl.has(url));
}

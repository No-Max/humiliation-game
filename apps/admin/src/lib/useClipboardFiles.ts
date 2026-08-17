export function filesFromClipboard(event: ClipboardEvent): File[] {
  const fromFiles = Array.from(event.clipboardData?.files ?? []);
  if (fromFiles.length) return fromFiles;

  const fromItems: File[] = [];
  for (const item of Array.from(event.clipboardData?.items ?? [])) {
    if (item.kind !== 'file') continue;
    const file = item.getAsFile();
    if (file) fromItems.push(file);
  }
  return fromItems;
}

export function focusPasteBlock(event: MouseEvent, root: HTMLElement | null) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest('button, input, a, textarea, select')) return;
  root?.focus();
}

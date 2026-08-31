import { onScopeDispose, ref, type Ref } from 'vue';

export function filesFromDataTransfer(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) return [];
  return Array.from(dataTransfer.files);
}

function getZoneRoot(event: DragEvent, root?: Ref<HTMLElement | null>): HTMLElement | null {
  if (root?.value) return root.value;
  return event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
}

function isNodeInsideZone(zone: HTMLElement, node: EventTarget | null): boolean {
  return node instanceof Node && zone.contains(node);
}

export function useMediaDropZone(options: {
  accept: (file: File) => boolean;
  onFiles: (files: File[]) => void | Promise<void>;
  disabled?: Ref<boolean>;
  root?: Ref<HTMLElement | null>;
}) {
  const dragOver = ref(false);

  function canDrop(dataTransfer: DataTransfer | null): boolean {
    if (!dataTransfer) return false;
    return Array.from(dataTransfer.types).includes('Files');
  }

  function clearDragOver() {
    dragOver.value = false;
  }

  function onDragEnter(event: DragEvent) {
    if (options.disabled?.value || !canDrop(event.dataTransfer)) return;
    event.preventDefault();

    const zone = getZoneRoot(event, options.root);
    if (!zone) {
      dragOver.value = true;
      return;
    }

    if (isNodeInsideZone(zone, event.relatedTarget)) return;
    dragOver.value = true;
  }

  function onDragLeave(event: DragEvent) {
    if (!dragOver.value) return;
    event.preventDefault();

    const zone = getZoneRoot(event, options.root);
    if (!zone) {
      clearDragOver();
      return;
    }

    if (isNodeInsideZone(zone, event.relatedTarget)) return;
    clearDragOver();
  }

  function onDragOver(event: DragEvent) {
    if (options.disabled?.value || !canDrop(event.dataTransfer)) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  async function onDrop(event: DragEvent) {
    event.preventDefault();
    clearDragOver();
    if (options.disabled?.value) return;

    const files = filesFromDataTransfer(event.dataTransfer).filter(options.accept);
    if (!files.length) return;
    await options.onFiles(files);
  }

  document.addEventListener('dragend', clearDragOver);
  onScopeDispose(() => {
    document.removeEventListener('dragend', clearDragOver);
  });

  return {
    dragOver,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
  };
}

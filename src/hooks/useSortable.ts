import { useEffect, useRef, type RefObject } from 'react';
import Sortable from 'sortablejs';

export function useSortable(
  onReorder: (oldIndex: number, newIndex: number) => void,
): RefObject<HTMLDivElement | null> {
  const listRef = useRef<HTMLDivElement | null>(null);
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const instance = Sortable.create(el, {
      handle: '.grip',
      animation: 180,
      ghostClass: 'stop-card-ghost',
      dragClass: 'stop-card-dragging',
      onEnd: (evt) => {
        if (evt.oldIndex == null || evt.newIndex == null || evt.oldIndex === evt.newIndex) return;
        onReorderRef.current(evt.oldIndex, evt.newIndex);
      },
    });
    return () => {
      try {
        instance.destroy();
      } catch {
        // already destroyed
      }
    };
  }, []);

  return listRef;
}

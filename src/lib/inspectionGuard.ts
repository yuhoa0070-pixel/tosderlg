export function enableInspectionGuard(): void {
  if (!import.meta.env.PROD) return;

  document.body.dataset.protectContent = 'true';
  document.addEventListener('contextmenu', (event) => event.preventDefault());
  document.addEventListener('copy', (event) => {
    const target = event.target;
    const isEditable =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable);
    if (!isEditable) event.preventDefault();
  });
  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const devToolsShortcut =
      event.key === 'F12' ||
      ((event.ctrlKey || event.metaKey) && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
      (event.metaKey && event.altKey && ['i', 'j', 'c', 'u'].includes(key)) ||
      ((event.ctrlKey || event.metaKey) && key === 'u');

    if (!devToolsShortcut) return;
    event.preventDefault();
    event.stopPropagation();
  });
}

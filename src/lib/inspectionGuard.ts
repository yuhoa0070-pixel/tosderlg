export function enableInspectionGuard(): void {
  if (!import.meta.env.PROD) return;

  document.addEventListener('contextmenu', (event) => event.preventDefault());
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

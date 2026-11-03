import { onMount, onUnmount, ref } from 'jinge';
// Sticky offsets use measured header widths: the native table layout can distribute spare width.
export function useTableLayout() {
  const table = ref<HTMLTableElement>();
  let frame = 0,
    disposed = false;
  let resize: ResizeObserver | undefined, mutation: MutationObserver | undefined;
  function measure() {
    frame = 0;
    if (disposed || !table.value) return;
    const headers = [
      ...table.value.querySelectorAll<HTMLTableCellElement>(':scope > thead > tr > th'),
    ];
    if (!headers[0]?.offsetWidth) return;
    const rows = [
      ...table.value.querySelectorAll<HTMLTableRowElement>(':scope > tbody > .ja-table-row'),
    ];
    let left = 0,
      right = 0;
    for (let index = 0; index < headers.length; index++) {
      const header = headers[index];
      if (header.classList.contains('fixed-left')) {
        header.style.left = `${left}px`;
        for (const row of rows) if (row.cells[index]) row.cells[index].style.left = `${left}px`;
        left += header.offsetWidth;
      }
    }
    for (let index = headers.length - 1; index >= 0; index--) {
      const header = headers[index];
      if (header.classList.contains('fixed-right')) {
        header.style.right = `${right}px`;
        for (const row of rows) if (row.cells[index]) row.cells[index].style.right = `${right}px`;
        right += header.offsetWidth;
      }
    }
  }
  function schedule() {
    if (!disposed && !frame) frame = requestAnimationFrame(measure);
  }
  onMount(() => {
    if (typeof ResizeObserver !== 'undefined') resize = new ResizeObserver(schedule);
    function observe() {
      resize?.disconnect();
      if (table.value) {
        resize?.observe(table.value);
        for (const header of table.value.querySelectorAll('thead th'))
          resize?.observe(header, { box: 'border-box' });
      }
      schedule();
    }
    mutation = new window.MutationObserver(observe);
    mutation.observe(table.value!, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', schedule);
    observe();
  });
  onUnmount(() => {
    disposed = true;
    cancelAnimationFrame(frame);
    resize?.disconnect();
    mutation?.disconnect();
    window.removeEventListener('resize', schedule);
  });
  return table;
}

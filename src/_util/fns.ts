import { setImmediate } from 'jinge';

export function debounce(fn: () => void, delay = 20) {
  let tm = 0;
  return () => {
    if (tm > 0) {
      clearTimeout(tm);
      tm = 0;
    }
    tm = window.setTimeout(() => {
      tm = 0;
      fn();
    }, delay);
  };
}

export function throttle(fn: () => void, delay = 0) {
  let tm = 0;
  return delay <= 0
    ? () => {
        if (tm === 0)
          tm = setImmediate(() => {
            tm = 0;
            fn();
          });
      }
    : () => {
        if (tm === 0)
          tm = window.setTimeout(() => {
            tm = 0;
            fn();
          }, delay);
      };
}

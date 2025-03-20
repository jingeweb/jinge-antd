/**
 * 移植自：(Copied from:) https://github.com/floating-ui/floating-ui/blob/master/packages/dom/src/autoUpdate.ts
 */

type OverflowAncestors = (Element | Window | VisualViewport)[];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getWindow(node?: any): typeof window {
  return node?.ownerDocument?.defaultView ?? window;
}
function getDocumentElement(node: Node | Window): HTMLElement {
  return ((isNode(node) ? node.ownerDocument : node.document) ?? window.document)?.documentElement;
}
function isNode(value: unknown): value is Node {
  return value instanceof Node || value instanceof getWindow(value).Node;
}

function getNodeName(node: Node | Window): string {
  if (isNode(node)) {
    return (node.nodeName || '').toLowerCase();
  }
  // Mocked nodes in testing environments may not be instances of Node. By
  // returning `#document` an infinite loop won't occur.
  // https://github.com/floating-ui/floating-ui/issues/2317
  return '#document';
}
function isShadowRoot(value: unknown): value is ShadowRoot {
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}

function getParentNode(node: Node): Node {
  if (getNodeName(node) === 'html') {
    return node;
  }

  const result =
    // Step into the shadow DOM of the parent of a slotted node.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node as any).assignedSlot ??
    // DOM Element detected.
    node.parentNode ??
    // ShadowRoot detected.
    (isShadowRoot(node) && node.host) ??
    // Fallback.
    getDocumentElement(node);

  return isShadowRoot(result) ? result.host : result;
}
function isLastTraversableNode(node: Node): boolean {
  return ['html', 'body', '#document'].includes(getNodeName(node));
}
function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
export function isOverflowElement(element: Element): boolean {
  const { overflow, overflowX, overflowY, display } = getComputedStyle(element);
  return (
    /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) &&
    !['inline', 'contents'].includes(display)
  );
}

function getNearestOverflowAncestor(node: Node): HTMLElement {
  const parentNode = getParentNode(node);

  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : (node as Document).body;
  }

  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }

  return getNearestOverflowAncestor(parentNode);
}
function getFrameElement(win: Window): Element | null {
  return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}
function getOverflowAncestors(
  node: Node,
  list: OverflowAncestors = [],
  traverseIframes = true,
): OverflowAncestors {
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === node.ownerDocument?.body;
  const win = getWindow(scrollableAncestor);

  if (isBody) {
    const frameElement = getFrameElement(win);
    return list.concat(
      win,
      win.visualViewport ?? [],
      isOverflowElement(scrollableAncestor) ? scrollableAncestor : [],
      frameElement && traverseIframes ? getOverflowAncestors(frameElement) : [],
    );
  }

  return list.concat(
    scrollableAncestor,
    getOverflowAncestors(scrollableAncestor, [], traverseIframes),
  );
}

function rectsAreEqual(a: DOMRect, b: DOMRect) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export interface AutoUpdateOptions {
  /**
   * Whether to update the position when an overflow ancestor is scrolled.
   * @default true
   */
  ancestorScroll?: boolean;
  /**
   * Whether to update the position when an overflow ancestor is resized. This
   * uses the native `resize` event.
   * @default true
   */
  ancestorResize?: boolean;
  /**
   * Whether to update the position when either the reference or floating
   * elements resized. This uses a `ResizeObserver`.
   * @default true
   */
  elementResize?: boolean;
  /**
   * Whether to update the position when the reference relocated on the screen
   * due to layout shift.
   * @default true
   */
  layoutShift?: boolean;
}

// https://samthor.au/2021/observing-dom/
function observeMove(element: Element, onMove: () => void) {
  let io: IntersectionObserver | null = null;
  let timeoutId: NodeJS.Timeout;

  const root = getDocumentElement(element);

  function cleanup() {
    clearTimeout(timeoutId);
    io?.disconnect();
    io = null;
  }

  function refresh(skip = false, threshold = 1) {
    cleanup();

    const elementRectForRootMargin = element.getBoundingClientRect();
    const { left, top, width, height } = elementRectForRootMargin;

    if (!skip) {
      onMove();
    }

    if (!width || !height) {
      return;
    }

    const insetTop = Math.floor(top);
    const insetRight = Math.floor(root.clientWidth - (left + width));
    const insetBottom = Math.floor(root.clientHeight - (top + height));
    const insetLeft = Math.floor(left);
    const rootMargin = `${-insetTop}px ${-insetRight}px ${-insetBottom}px ${-insetLeft}px`;

    const options = {
      rootMargin,
      threshold: Math.max(0, Math.min(1, threshold)) || 1,
    };

    let isFirstUpdate = true;

    function handleObserve(entries: IntersectionObserverEntry[]) {
      const ratio = entries[0].intersectionRatio;

      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          return refresh();
        }

        if (!ratio) {
          // If the reference is clipped, the ratio is 0. Throttle the refresh
          // to prevent an infinite loop of updates.
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7);
          }, 1000);
        } else {
          refresh(false, ratio);
        }
      }

      if (
        ratio === 1 &&
        !rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())
      ) {
        // It's possible that even though the ratio is reported as 1, the
        // element is not actually fully within the IntersectionObserver's root
        // area anymore. This can happen under performance constraints. This may
        // be a bug in the browser's IntersectionObserver implementation. To
        // work around this, we compare the element's bounding rect now with
        // what it was at the time we created the IntersectionObserver. If they
        // are not equal then the element moved, so we refresh.
        refresh();
      }

      isFirstUpdate = false;
    }

    // Older browsers don't support a `document` as the root and will throw an
    // error.
    try {
      io = new IntersectionObserver(handleObserve, {
        ...options,
        // Handle <iframe>s
        root: root.ownerDocument,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      io = new IntersectionObserver(handleObserve, options);
    }

    io.observe(element);
  }

  refresh(true);

  return cleanup;
}

/**
 * Automatically updates the position of the floating element when necessary.
 * Should only be called when the floating element is mounted on the DOM or
 * visible on the screen.
 * @returns cleanup function that should be invoked when the floating element is
 * removed from the DOM or hidden from the screen.
 * @see https://floating-ui.com/docs/autoUpdate
 */
export function autoUpdate(
  referenceEl: HTMLElement,
  floating: HTMLElement,
  update: () => void,
  options: AutoUpdateOptions = {},
) {
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === 'function',
    layoutShift = typeof IntersectionObserver === 'function',
  } = options;

  const ancestors =
    ancestorScroll || ancestorResize
      ? [
          ...(referenceEl ? getOverflowAncestors(referenceEl) : []),
          ...getOverflowAncestors(floating),
        ]
      : [];

  ancestors.forEach((ancestor) => {
    ancestorScroll && ancestor.addEventListener('scroll', update, { passive: true });
    ancestorResize && ancestor.addEventListener('resize', update);
  });

  const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;

  let reobserveFrame = -1;
  let resizeObserver: ResizeObserver | null = null;

  if (elementResize) {
    resizeObserver = new ResizeObserver(([firstEntry]) => {
      if (firstEntry && firstEntry.target === referenceEl && resizeObserver) {
        // Prevent update loops when using the `size` middleware.
        // https://github.com/floating-ui/floating-ui/issues/1740
        resizeObserver.unobserve(floating);
        cancelAnimationFrame(reobserveFrame);
        reobserveFrame = requestAnimationFrame(() => {
          resizeObserver?.observe(floating);
        });
      }
      update();
    });

    if (referenceEl) {
      resizeObserver.observe(referenceEl);
    }
    resizeObserver.observe(floating);
  }

  update();

  return () => {
    ancestors.forEach((ancestor) => {
      ancestorScroll && ancestor.removeEventListener('scroll', update);
      ancestorResize && ancestor.removeEventListener('resize', update);
    });

    cleanupIo?.();
    resizeObserver?.disconnect();
    resizeObserver = null;
  };
}

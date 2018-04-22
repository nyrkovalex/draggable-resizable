import { fitLeft, fitTop } from './fit';

function noop() {
}

export interface Point {
  x: number;
  y: number;
}

const px = (value: number) => value + 'px';

function createGhost(params: GhostParams): Ghost {
  const ghost = params.proto.cloneNode() as HTMLElement;
  ghost.removeAttribute('id');
  ghost.style.position = 'absolute';
  ghost.style.boxSizing = 'border-box';

  let dragPoint: Point | null = null;

  function onMouseMove(e: MouseEvent) {
    if (!dragPoint) {
      return;
    }
    const ghostRect = ghost.getBoundingClientRect();
    const containerRect = params.container.getBoundingClientRect();

    const left = e.clientX - dragPoint.x;
    const top = e.clientY - dragPoint.y;

    const targetRect = {
      top,
      left,
      right: left + ghostRect.width,
      bottom: top + ghostRect.height,
      width: ghostRect.width,
      height: ghostRect.height,
    };

    ghost.style.left = px(fitLeft(targetRect, containerRect));
    ghost.style.top = px(fitTop(targetRect, containerRect));
  }

  function onMouseUp(e: Event) {
    if (!dragPoint) {
      return;
    }
    dragPoint = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    const rect = ghost.getBoundingClientRect();
    params.container.removeChild(ghost);
    params.onDrop({
      x: rect.left,
      y: rect.top,
    });
  }

  function startDrag(e: MouseEvent) {
    const targetRect = params.proto.getBoundingClientRect();
    dragPoint = {
      x: e.clientX - targetRect.left,
      y: e.clientY - targetRect.top,
    };

    ghost.style.width = px(targetRect.width);
    ghost.style.height = px(targetRect.height);
    ghost.style.left = px(targetRect.left);
    ghost.style.top = px(targetRect.top);
    params.container.appendChild(ghost);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    params.onDrag(ghost);
  }

  params.proto.addEventListener('mousedown', startDrag);

  return {
    el: ghost,
    destroy () {
      params.proto.removeEventListener('mousedown', startDrag);
    },
  };
}

interface GhostParams {
  proto: HTMLElement;
  container: HTMLElement;
  onDrop: (point: Point) => void;
  onDrag: (ghost: HTMLElement) => void;
  restrictBounds: boolean;
}

interface Ghost {
  el: HTMLElement;
  destroy(): void;
}

const defaultParams: Params = {
  container: document.body,
  logger: console,
  onDrop: noop,
  onDrag: noop,
  restrictBounds: false,
};

export function draggable(target: HTMLElement, inputParams: Partial<Params> = {}): void {
  const params = {
    ...defaultParams,
    ...inputParams,
  };

  const ghost = createGhost({
    container: params.container,
    proto: target,
    onDrop: params.onDrop,
    onDrag: params.onDrag,
    restrictBounds: params.restrictBounds,
  });
}

export interface Params {
  container: HTMLElement;
  logger: Console;
  onDrop: (point: Point) => void;
  onDrag: (ghost: HTMLElement) => void;
  restrictBounds: boolean;
}

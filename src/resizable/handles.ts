import { Point, Rect } from '../size';
import { Ghost } from '../ghost';
import { Parametrized, IDestructable } from '../util';

export interface DragPoint extends Point {
  protoRect: Rect;
}

export abstract class ResizeHandle extends
  Parametrized<ResizeHandle.Params> implements IDestructable {
  protected dragPoint: DragPoint | null = null;

  constructor(params: ResizeHandle.Params) {
    super(params);
    this.params.el.addEventListener('mousedown', this.onResizeStart);
  }

  private onResizeStart = (e: MouseEvent) => {
    this.params.container.appendChild(this.params.ghost.el);
    const targetRect = this.params.proto.getBoundingClientRect();
    const { width, height } = targetRect;
    this.params.ghost.setSize({ width, height });
    this.params.ghost.place({
      left: targetRect.left,
      top: targetRect.top,
    });
    this.dragPoint = {
      x: e.clientX,
      y: e.clientY,
      protoRect: targetRect,
    };
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    this.params.onResizeStart();
  }

  private onMouseUp = () => {
    this.dragPoint = null;
    const rect = this.params.ghost.relativeRect;
    this.params.onResizeEnd(rect);
    this.params.container.removeChild(this.params.ghost.el);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  private onMouseMove = (e: MouseEvent) => requestAnimationFrame(() => {
    if (!this.dragPoint) {
      return;
    }
    this.resize(this.dragPoint, e);
  })

  protected resizeLeft(dragPoint: DragPoint, e: MouseEvent) {
    const xDiff = dragPoint.x - e.clientX;
    const left = dragPoint.protoRect.left - xDiff;
    this.params.ghost.growLeft(left);
  }

  protected resizeTop(dragPoint: DragPoint, e: MouseEvent) {
    const yDiff = dragPoint.y - e.clientY;
    const top = dragPoint.protoRect.top - yDiff;
    this.params.ghost.growTop(top);
  }

  protected resizeRight(dragPoint: DragPoint, e: MouseEvent) {
    const xDiff = e.clientX - dragPoint.x;
    const right = dragPoint.protoRect.right + xDiff;
    this.params.ghost.growRight(right);
  }

  protected resizeBottom(dragPoint: DragPoint, e: MouseEvent) {
    const yDiff = e.clientY - dragPoint.y;
    const bottom = dragPoint.protoRect.bottom + yDiff;
    this.params.ghost.growBottom(bottom);
  }

  destroy(): void {
    this.params.el.removeEventListener('mousedown', this.onResizeStart);
  }

  protected abstract resize(dragPoint: Point, e: MouseEvent): void;
}

export namespace ResizeHandle {
  export interface Params {
    el: HTMLElement;
    container: HTMLElement;
    proto: HTMLElement;
    ghost: Ghost;
    onResizeStart: () => void;
    onResizeEnd: (result: Rect) => void;
  }

  export interface Constructor {
    new(params: Params): ResizeHandle;
  }
}

export class LeftResizeHandle extends ResizeHandle {
  resize(dragPoint: DragPoint, e: MouseEvent) {
    this.resizeLeft(dragPoint, e);
  }
}

export class RightResizeHandle extends ResizeHandle {
  resize(dragPoint: DragPoint, e: MouseEvent) {
    this.resizeRight(dragPoint, e);
  }
}

export class TopResizeHandle extends ResizeHandle {
  resize(dragPoint: DragPoint, e: MouseEvent) {
    this.resizeTop(dragPoint, e);
  }
}

export class BottomResizeHandle extends ResizeHandle {
  resize(dragPoint: DragPoint, e: MouseEvent) {
    this.resizeBottom(dragPoint, e);
  }
}

export class TopLeftResizeHandle extends ResizeHandle {
  resize(dragPoint: DragPoint, e: MouseEvent) {
    this.resizeLeft(dragPoint, e);
    this.resizeTop(dragPoint, e);
  }
}

export class TopRightResizeHandle extends ResizeHandle {
  resize(dragPoint: DragPoint, e: MouseEvent) {
    this.resizeRight(dragPoint, e);
    this.resizeTop(dragPoint, e);
  }
}

export class BottomRightResizeHandle extends ResizeHandle {
  resize(dragPoint: DragPoint, e: MouseEvent) {
    this.resizeRight(dragPoint, e);
    this.resizeBottom(dragPoint, e);
  }
}

export class BottomLeftResizeHandle extends ResizeHandle {
  resize(dragPoint: DragPoint, e: MouseEvent) {
    this.resizeLeft(dragPoint, e);
    this.resizeBottom(dragPoint, e);
  }
}

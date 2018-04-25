import { Point, Rect } from '../size';
import { Ghost } from '../ghost';
import { Parametrized, IDestructable, Bounds, SizeParams, BorderParams } from '../util';

export interface DragPoint extends Point {
  protoBounds: Bounds;
}

export abstract class ResizeHandle extends
  Parametrized<ResizeHandle.Params> implements IDestructable {
  protected dragPoint: DragPoint | null = null;
  protected aspectRatio: number;

  constructor(params: ResizeHandle.Params) {
    super(params);
    this.params.el.addEventListener('mousedown', this.onResizeStart);
    this.aspectRatio = this.calculateAspectRatio();
  }

  private calculateAspectRatio() {
    if (!this.params.keepAspectRatio) {
      return 0;
    }
    const protoRect = this.params.proto.getBoundingClientRect();
    return protoRect.width / protoRect.height;
  }

  private onResizeStart = (e: MouseEvent) => {
    e.stopPropagation();
    this.params.container.appendChild(this.params.ghost.el);
    const targetRect = this.params.proto.getBoundingClientRect();
    const { width, height } = targetRect;
    this.params.ghost.setSize({ width, height });
    this.params.ghost.place({
      left: targetRect.left,
      top: targetRect.top,
    });
    this.dragPoint = this.captureDragPoint(e, targetRect);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    this.params.onResizeStart();
  }

  private captureDragPoint(e: MouseEvent, targetRect: Rect) {
    return {
      x: e.clientX,
      y: e.clientY,
      protoBounds: {
        bottom: targetRect.bottom,
        left: targetRect.left,
        right: targetRect.right,
        top: targetRect.top,
      },
    };
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
    const bounds = this.boundsUpdate(this.dragPoint, e);
    const fixedBounds = this.fixBounds({
      ...this.dragPoint.protoBounds,
      ...bounds,
    });
    if (!this.params.keepAspectRatio) {
      this.params.ghost.fitInto(fixedBounds);
      return;
    }
    const boundsAspectRatio = fixedBounds.width / fixedBounds.height;
    const fitByWidth = boundsAspectRatio.toFixed(8) < this.aspectRatio.toFixed(8);
    const fittedBounds = fitByWidth
      ? this.fitByWidth(fixedBounds)
      : this.fitByHeight(fixedBounds);
    this.params.ghost.fitInto(
      fittedBounds,
      this.aspectRatio,
    );
  })

  protected leftBound(dragPoint: DragPoint, e: MouseEvent) {
    const xDiff = dragPoint.x - e.clientX;
    const left = dragPoint.protoBounds.left - xDiff;
    return Math.min(
      dragPoint.protoBounds.right -
      this.params.minSize.width -
      this.params.borderSize.horizontal,
      left,
    );
  }

  protected topBound(dragPoint: DragPoint, e: MouseEvent) {
    const yDiff = dragPoint.y - e.clientY;
    const top = dragPoint.protoBounds.top - yDiff;
    return Math.min(
      dragPoint.protoBounds.bottom -
      this.params.minSize.height -
      this.params.borderSize.vertical,
      top,
    );
  }

  protected rightBound(dragPoint: DragPoint, e: MouseEvent) {
    const xDiff = e.clientX - dragPoint.x;
    const right = dragPoint.protoBounds.right + xDiff;
    return Math.max(
      dragPoint.protoBounds.left +
      this.params.minSize.width +
      this.params.borderSize.horizontal,
      right,
    );
  }

  protected bottomBound(dragPoint: DragPoint, e: MouseEvent) {
    const yDiff = e.clientY - dragPoint.y;
    const bottom = dragPoint.protoBounds.bottom + yDiff;
    return Math.max(
      dragPoint.protoBounds.top +
      this.params.minSize.height +
      this.params.borderSize.vertical,
      bottom,
    );
  }

  protected fixBounds(requestedBounds: Bounds): Rect {
    const container = this.params.ghost.containerRect;
    return {
      left: Math.max(requestedBounds.left, container.left),
      bottom: Math.min(requestedBounds.bottom, container.bottom),
      top: Math.max(requestedBounds.top, container.top),
      right: Math.min(requestedBounds.right, container.right),
      get width() {
        return this.right - this.left;
      },
      get height() {
        return this.bottom - this.top;
      },
    };
  }

  protected fitBottom(bounds: Bounds): Bounds {
    const width = bounds.right - bounds.left;
    const height = width / this.aspectRatio;
    const bottom = bounds.top + height;
    return {
      bottom,
      top: bounds.top,
      right: bounds.right,
      left: bounds.left,
    };
  }

  protected fitLeft(bounds: Bounds): Bounds {
    const height = bounds.bottom - bounds.top;
    const width = height * this.aspectRatio;
    const left = bounds.right - width;
    return {
      left,
      right: bounds.right,
      top: bounds.top,
      bottom: bounds.bottom,
    };
  }

  protected fitTop(bounds: Bounds): Bounds {
    const width = bounds.right - bounds.left;
    const height = width / this.aspectRatio;
    const top = bounds.bottom - height;
    return {
      top,
      bottom: bounds.bottom,
      right: bounds.right,
      left: bounds.left,
    };
  }

  protected fitRight(bounds: Bounds): Bounds {
    const height = bounds.bottom - bounds.top;
    const width = height * this.aspectRatio;
    const right = bounds.left + width;
    return {
      right,
      left: bounds.left,
      top: bounds.top,
      bottom: bounds.bottom,
    };
  }

  protected fitHorizontalCenter(bounds: Bounds): Bounds {
    const height = bounds.bottom - bounds.top;
    const width = height * this.aspectRatio;
    const oldWidth = bounds.right - bounds.left;
    const increment = (width - oldWidth) / 2;
    const left = bounds.left - increment;
    const right = bounds.right + increment;
    return {
      right,
      left,
      top: bounds.top,
      bottom: bounds.bottom,
    };
  }

  protected fitVerticalCenter(bounds: Bounds): Bounds {
    const width = bounds.right - bounds.left;
    const height = width / this.aspectRatio;
    const oldHeight = bounds.bottom - bounds.top;
    const increment = (height - oldHeight) / 2;
    const top = bounds.top - increment;
    const bottom = bounds.bottom + increment;
    return {
      top,
      bottom,
      right: bounds.right,
      left: bounds.left,
    };
  }

  destroy(): void {
    this.params.el.removeEventListener('mousedown', this.onResizeStart);
  }

  protected abstract boundsUpdate(dragPoint: Point, e: MouseEvent): Partial<Bounds>;
  protected abstract fitByWidth(bounds: Bounds): Bounds;
  protected abstract fitByHeight(bounds: Bounds): Bounds;
}

export namespace ResizeHandle {
  export interface Params {
    el: HTMLElement;
    container: HTMLElement;
    proto: HTMLElement;
    ghost: Ghost;
    keepAspectRatio: boolean;
    minSize: SizeParams;
    borderSize: BorderParams;
    onResizeStart: () => void;
    onResizeEnd: (result: Rect) => void;
  }

  export interface Constructor {
    new(params: Params): ResizeHandle;
  }
}

export class LeftResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    const left = this.leftBound(dragPoint, e);
    return { left };
  }

  fitByHeight(bounds: Bounds): Bounds {
    return this.fitVerticalCenter(bounds);
  }

  fitByWidth(bounds: Bounds): Bounds {
    return this.fitVerticalCenter(bounds);
  }
}

export class RightResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    const right = this.rightBound(dragPoint, e);
    return { right };
  }

  fitByHeight(bounds: Bounds): Bounds {
    return this.fitVerticalCenter(bounds);
  }

  fitByWidth(bounds: Bounds): Bounds {
    return this.fitVerticalCenter(bounds);
  }
}

export class TopResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    const top = this.topBound(dragPoint, e);
    return { top };
  }

  fitByHeight(bounds: Bounds): Bounds {
    return this.fitHorizontalCenter(bounds);
  }

  fitByWidth(bounds: Bounds): Bounds {
    return this.fitHorizontalCenter(bounds);
  }
}

export class BottomResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    const bottom = this.bottomBound(dragPoint, e);
    return { bottom };
  }

  fitByHeight(bounds: Bounds): Bounds {
    return this.fitHorizontalCenter(bounds);
  }

  fitByWidth(bounds: Bounds): Bounds {
    return this.fitHorizontalCenter(bounds);
  }
}

export class TopLeftResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    return {
      left: this.leftBound(dragPoint, e),
      top: this.topBound(dragPoint, e),
    };
  }

  fitByWidth(bounds: Bounds): Bounds {
    return this.fitTop(bounds);
  }

  fitByHeight(bounds: Bounds): Bounds {
    return this.fitLeft(bounds);
  }
}

export class TopRightResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    return {
      top: this.topBound(dragPoint, e),
      right: this.rightBound(dragPoint, e),
    };
  }

  fitByWidth(bounds: Bounds): Bounds {
    return this.fitTop(bounds);
  }

  fitByHeight(bounds: Bounds): Bounds {
    return this.fitRight(bounds);
  }
}

export class BottomRightResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    return {
      bottom: this.bottomBound(dragPoint, e),
      right: this.rightBound(dragPoint, e),
    };
  }

  fitByWidth(bounds: Bounds): Bounds {
    return this.fitBottom(bounds);
  }

  fitByHeight(bounds: Bounds): Bounds {
    return this.fitRight(bounds);
  }
}

export class BottomLeftResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    return {
      bottom: this.bottomBound(dragPoint, e),
      left: this.leftBound(dragPoint, e),
    };
  }

  fitByWidth(bounds: Bounds): Bounds {
    return this.fitBottom(bounds);
  }

  fitByHeight(bounds: Bounds): Bounds {
    return this.fitLeft(bounds);
  }
}

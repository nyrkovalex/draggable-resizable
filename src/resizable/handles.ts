import { Point, Rect, Bounds, SizeParams } from '../size';
import { Ghost } from '../ghost';
import { IDestructable } from '../util';
import { Haunted } from '../hanuted';

export interface DragPoint extends Point {
  protoRect: Rect;
}

export abstract class ResizeHandle extends
  Haunted<ResizeHandle.Params> implements IDestructable {
  protected dragPoint: DragPoint | null = null;
  protected aspectRatio: number = 0;
  protected ghost?: Ghost;
  private isResizing = false;

  constructor(params: ResizeHandle.Params) {
    super(params);
    this.params.el.addEventListener('mousedown', this.onResizeStart);
  }

  private calculateAspectRatio() {
    if (!this.params.keepAspectRatio) {
      return 0;
    }
    const protoRect = this.params.proto.getBoundingClientRect();
    return protoRect.width / protoRect.height;
  }

  private onResizeStart = (e: MouseEvent) => {
    const parent = this.params.proto.parentNode;
    if (!parent) {
      return;
    }
    e.stopPropagation();
    this.aspectRatio = this.calculateAspectRatio();
    this.ghost = this.createGhost(this.params.proto, this.params.container);
    parent.insertBefore(this.ghost.el, this.params.proto);
    const targetRect = this.params.proto.getBoundingClientRect();
    const { width, height } = targetRect;
    this.ghost.setSize({ width, height });
    this.ghost.place({
      left: targetRect.left,
      top: targetRect.top,
    });
    this.dragPoint = this.captureDragPoint(e, new Rect(targetRect));
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    this.params.onMouseDown();
  }

  private captureDragPoint(e: MouseEvent, protoRect: Rect) {
    return {
      protoRect,
      x: e.clientX,
      y: e.clientY,
    };
  }

  private onMouseUp = () => {
    if (!this.ghost) {
      return;
    }
    if (!this.isResizing) {
      this.params.onMouseUp();
    }
    this.isResizing = false;
    this.dragPoint = null;
    const rect = this.ghost.relativeRect;
    this.params.onResizeEnd({ rect, ghost: this.ghost.el });
    this.params.container.removeChild(this.ghost!.el);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  private onMouseMove = (e: MouseEvent) => requestAnimationFrame(() => {
    if (!this.dragPoint || !this.ghost) {
      return;
    }
    const bounds = this.boundsUpdate(this.dragPoint, e);
    const fixedBounds = this.fixBounds(this.dragPoint.protoRect.withUpdate(bounds));
    if (!this.params.keepAspectRatio) {
      this.resizeGhost(fixedBounds);
      return;
    }
    const boundsAspectRatio = fixedBounds.width / fixedBounds.height;
    const fitByWidth = Number(boundsAspectRatio.toFixed(8)) < Number(this.aspectRatio.toFixed(8));
    const fittedBounds = fitByWidth
      ? this.fitByWidth(fixedBounds, this.dragPoint)
      : this.fitByHeight(fixedBounds, this.dragPoint);
    this.resizeGhost(fittedBounds);
  })

  private resizeGhost (rect: Rect) {
    if (!this.ghost) {
      return;
    }
    this.ghost.setRect(rect);
    if (!this.isResizing) {
      this.isResizing = true;
      this.params.onResizeStart({ rect: this.ghost.relativeRect, ghost: this.ghost.el });
    }
    this.params.onResize({ rect: this.ghost.relativeRect, ghost: this.ghost.el });
  }

  protected leftBound(dragPoint: DragPoint, e: MouseEvent) {
    const xDiff = dragPoint.x - e.clientX;
    const left = dragPoint.protoRect.left - xDiff;
    return Math.min(
      dragPoint.protoRect.right -
      this.params.minSize.width,
      left,
    );
  }

  protected topBound(dragPoint: DragPoint, e: MouseEvent) {
    const yDiff = dragPoint.y - e.clientY;
    const top = dragPoint.protoRect.top - yDiff;
    return Math.min(
      dragPoint.protoRect.bottom -
      this.params.minSize.height,
      top,
    );
  }

  protected rightBound(dragPoint: DragPoint, e: MouseEvent) {
    const xDiff = e.clientX - dragPoint.x;
    const right = dragPoint.protoRect.right + xDiff;
    return Math.max(
      dragPoint.protoRect.left +
      this.params.minSize.width,
      right,
    );
  }

  protected bottomBound(dragPoint: DragPoint, e: MouseEvent) {
    const yDiff = e.clientY - dragPoint.y;
    const bottom = dragPoint.protoRect.bottom + yDiff;
    return Math.max(
      dragPoint.protoRect.top +
      this.params.minSize.height,
      bottom,
    );
  }

  protected fixBounds(requestedBounds: Rect): Rect {
    const container = this.ghost!.containerRect;
    return requestedBounds.withUpdate({
      left: Math.max(requestedBounds.left, container.left),
      bottom: Math.min(requestedBounds.bottom, container.bottom),
      top: Math.max(requestedBounds.top, container.top),
      right: Math.min(requestedBounds.right, container.right),
    });
  }

  protected calculateHorizontalBounds(bounds: Rect, dragPoint: DragPoint) {
    const height = Math.max(bounds.bottom - bounds.top, this.params.minSize.height);
    const width = Math.max(height * this.aspectRatio, this.params.minSize.width);
    const maxLeftIncrement = dragPoint.protoRect.left - bounds.left;
    const maxRightIncrement = bounds.right - dragPoint.protoRect.right;
    const targetIncrement = (width - dragPoint.protoRect.width) / 2;
    const increment = Math.min(maxLeftIncrement, maxRightIncrement, targetIncrement);
    const left = Math.max(dragPoint.protoRect.left - increment, bounds.left);
    const right = Math.min(dragPoint.protoRect.right + increment, bounds.right);
    return { right, left };
  }

  protected calculateVerticalBounds(bounds: Rect, dragPoint: DragPoint) {
    const width = Math.max(bounds.right - bounds.left, this.params.minSize.width);
    const height = Math.max(width / this.aspectRatio, this.params.minSize.height);
    const maxTopIncrement = dragPoint.protoRect.top - bounds.top;
    const maxBottomIncrement = bounds.bottom - dragPoint.protoRect.bottom;
    const targetIncrement = (height - dragPoint.protoRect.height) / 2;
    const increment = Math.min(maxTopIncrement, maxBottomIncrement, targetIncrement);
    const top = Math.max(dragPoint.protoRect.top - increment, bounds.top);
    const bottom = Math.min(dragPoint.protoRect.bottom + increment, bounds.bottom);
    return { bottom, top };
  }

  destroy(): void {
    this.params.el.removeEventListener('mousedown', this.onResizeStart);
  }

  protected abstract boundsUpdate(dragPoint: Point, e: MouseEvent): Partial<Bounds>;
  protected abstract fitByWidth(bounds: Rect, dragPoint?: DragPoint): Rect;
  protected abstract fitByHeight(bounds: Rect, dragPoint?: DragPoint): Rect;
}

export namespace ResizeHandle {
  export interface Params {
    el: HTMLElement;
    container: HTMLElement;
    proto: HTMLElement;
    keepAspectRatio: boolean;
    minSize: SizeParams;
    onResizeStart: (params: ResizeParams) => void;
    onResizeEnd: (params: ResizeParams) => void;
    onMouseDown: () => void;
    onMouseUp: () => void;
    onResize: (params: ResizeParams) => void;
  }

  export interface ResizeParams {
    rect: Rect;
    ghost: HTMLElement;
  }

  export interface Constructor {
    new(params: Params): ResizeHandle;
  }
}

//#region sides
export class LeftResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    const left = this.leftBound(dragPoint, e);
    return this.params.keepAspectRatio
      ? { left, top: -Infinity, bottom: Infinity }
      : { left };
  }

  fitByHeight(bounds: Rect, dragPoint: DragPoint): Rect {
    const { bottom, top } = this.calculateVerticalBounds(bounds, dragPoint);
    const left = bounds.right - (bottom - top) * this.aspectRatio;
    return bounds.withUpdate({ top, bottom, left });
  }

  fitByWidth(bounds: Rect, dragPoint: DragPoint): Rect {
    return this.fitByHeight(bounds, dragPoint);
  }
}

export class RightResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    const right = this.rightBound(dragPoint, e);
    return this.params.keepAspectRatio
      ? { right, top: -Infinity, bottom: Infinity }
      : { right };
  }

  fitByHeight(bounds: Rect, dragPoint: DragPoint): Rect {
    const { bottom, top } = this.calculateVerticalBounds(bounds, dragPoint);
    const right = bounds.left + (bottom - top) * this.aspectRatio;
    return bounds.withUpdate({ top, bottom, right });
  }

  fitByWidth(bounds: Rect, dragPoint: DragPoint): Rect {
    return this.fitByHeight(bounds, dragPoint);
  }
}

export class TopResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    const top = this.topBound(dragPoint, e);
    return this.params.keepAspectRatio
      ? { top, left: -Infinity, right: Infinity }
      : { top };
  }

  fitByHeight(bounds: Rect, dragPoint: DragPoint): Rect {
    const { right, left } = this.calculateHorizontalBounds(bounds, dragPoint);
    const top = bounds.bottom - (right - left) / this.aspectRatio;
    return bounds.withUpdate({ top, left, right });
  }

  fitByWidth(bounds: Rect, dragPoint: DragPoint): Rect {
    return this.fitByHeight(bounds, dragPoint);
  }
}

export class BottomResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    const bottom = this.bottomBound(dragPoint, e);
    return this.params.keepAspectRatio
      ? { bottom, left: -Infinity, right: Infinity }
      : { bottom };
  }

  fitByHeight(bounds: Rect, dragPoint: DragPoint): Rect {
    const { right, left } = this.calculateHorizontalBounds(bounds, dragPoint);
    const bottom = bounds.top + (right - left) / this.aspectRatio;
    return bounds.withUpdate({ bottom, left, right });
  }

  fitByWidth(bounds: Rect, dragPoint: DragPoint): Rect {
    return this.fitByHeight(bounds, dragPoint);
  }
}
//#endregion sides

//#region corners
export class TopLeftResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    return {
      left: this.leftBound(dragPoint, e),
      top: this.topBound(dragPoint, e),
    };
  }

  fitByWidth(bounds: Rect): Rect {
    const width = Math.max(bounds.right - bounds.left, this.params.minSize.width);
    const height = Math.max(width / this.aspectRatio, this.params.minSize.height);
    const left = bounds.right - height * this.aspectRatio;
    const top = bounds.bottom - height;
    return bounds.withUpdate({ left, top });
  }

  fitByHeight(bounds: Rect): Rect {
    const height = Math.max(bounds.bottom - bounds.top, this.params.minSize.height);
    const width = Math.max(height * this.aspectRatio, this.params.minSize.width);
    const left = bounds.right - width;
    const top = bounds.bottom - width / this.aspectRatio;
    return bounds.withUpdate({ left, top });
  }
}

export class TopRightResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    return {
      top: this.topBound(dragPoint, e),
      right: this.rightBound(dragPoint, e),
    };
  }

  fitByWidth(bounds: Rect): Rect {
    const width = Math.max(bounds.right - bounds.left, this.params.minSize.width);
    const height = Math.max(width / this.aspectRatio, this.params.minSize.height);
    const right = bounds.left + height * this.aspectRatio;
    const top = bounds.bottom - height;
    return bounds.withUpdate({ right, top });
  }

  fitByHeight(bounds: Rect): Rect {
    const height = Math.max(bounds.bottom - bounds.top, this.params.minSize.height);
    const width = Math.max(height * this.aspectRatio, this.params.minSize.width);
    const right = bounds.left + width;
    const top = bounds.bottom - width / this.aspectRatio;
    return bounds.withUpdate({ right, top });
  }
}

export class BottomRightResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    return {
      bottom: this.bottomBound(dragPoint, e),
      right: this.rightBound(dragPoint, e),
    };
  }

  fitByWidth(bounds: Rect): Rect {
    const width = Math.max(bounds.right - bounds.left, this.params.minSize.width);
    const height = Math.max(width / this.aspectRatio, this.params.minSize.height);
    const right = bounds.left + height * this.aspectRatio;
    const bottom = bounds.top + height;
    return bounds.withUpdate({ right, bottom });
  }

  fitByHeight(bounds: Rect): Rect {
    const height = Math.max(bounds.bottom - bounds.top, this.params.minSize.height);
    const width = Math.max(height * this.aspectRatio, this.params.minSize.width);
    const right = bounds.left + width;
    const bottom = bounds.top + width / this.aspectRatio;
    return bounds.withUpdate({ right, bottom });
  }
}

export class BottomLeftResizeHandle extends ResizeHandle {
  boundsUpdate(dragPoint: DragPoint, e: MouseEvent) {
    return {
      bottom: this.bottomBound(dragPoint, e),
      left: this.leftBound(dragPoint, e),
    };
  }

  fitByWidth(bounds: Rect): Rect {
    const width = Math.max(bounds.right - bounds.left, this.params.minSize.width);
    const height = Math.max(width / this.aspectRatio, this.params.minSize.height);
    const left = bounds.right - height * this.aspectRatio;
    const bottom = bounds.top + height;
    return bounds.withUpdate({ left, bottom });
  }

  fitByHeight(bounds: Rect): Rect {
    const height = Math.max(bounds.bottom - bounds.top, this.params.minSize.height);
    const width = Math.max(height * this.aspectRatio, this.params.minSize.width);
    const left = bounds.right - width;
    const bottom = bounds.top + width / this.aspectRatio;
    return bounds.withUpdate({ left, bottom });
  }
}
//#endregion corners

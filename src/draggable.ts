import {
  Point,
  Rect,
} from './size';
import { Ghost } from './ghost';
import { IDestructable, noop } from './util';
import { Haunted } from './hanuted';

export class Draggable extends Haunted<Draggable.Params> implements IDestructable {
  private ghost?: Ghost;
  private readonly proto: HTMLElement;
  private dragPoint: Point | null = null;
  private isDragging = false;

  /**
   * Draggable element can be dragged inside bounds of its `params.container`.
   * Actual `proto` element is never mutated except for `mousedown` listener being attached
   * to start drag.
   *
   * Instead ghost (or deep clone) element is created and mounted
   * before `proto` in DOM tree and moved.
   *
   * It's a client responsibility to perform additional actions like hiding actual element
   * `params.onMouseDown` and setting new coordinates `params.onDragEnd`
   *
   * @param proto draggable element, prototype for draggable ghost
   * @param params draggable options
   */
  constructor(proto: HTMLElement, params: Partial<Draggable.Params> = {}) {
    super({
      container: document.body,
      onDragEnd: noop,
      onDrag: noop,
      onDragStart: noop,
      onMouseDown: noop,
      onMouseUp: noop,
      ...params,
    });
    this.proto = proto;
    this.proto.addEventListener('mousedown', this.startDrag);
  }

  /**
   * Cleans up everything Draggable has placed in DOM.
   * Draggable cannot be reused after destroy.
   *
   * Please be responsible. Recycle ♻️.
   */
  destroy(): void {
    this.dragPoint = null;
    this.proto.removeEventListener('mousedown', this.startDrag);
  }

  private onMouseMove = (e: MouseEvent) => requestAnimationFrame(() => {
    if (!this.dragPoint || !this.ghost) {
      return;
    }

    const left = e.clientX - this.dragPoint.x;
    const top = e.clientY - this.dragPoint.y;
    this.ghost.place({ left, top });

    if (!this.isDragging) {
      this.isDragging = true;
      this.params.onDragStart({ rect: this.ghost.relativeRect, ghost: this.ghost.el });
    }
    this.params.onDrag({ rect: this.ghost.relativeRect, ghost: this.ghost.el });
  })

  private onMouseUp = () => {
    if (!this.dragPoint || !this.ghost) {
      return;
    }

    if (!this.isDragging) {
      this.params.onMouseUp();
    }
    this.isDragging = false;
    this.dragPoint = null;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    const rect = this.ghost.relativeRect;
    this.params.onDragEnd({ rect, ghost: this.ghost.el });
    this.params.container.removeChild(this.ghost.el);
  }

  private startDrag = (e: MouseEvent) => {
    const parent = this.proto.parentNode;
    if (!parent) {
      return;
    }
    this.ghost = this.createGhost(this.proto, this.params.container);
    parent.insertBefore(this.ghost.el, this.proto);
    const targetRect = this.proto.getBoundingClientRect();
    this.dragPoint = {
      x: e.clientX - targetRect.left,
      y: e.clientY - targetRect.top,
    };

    const { width, height } = targetRect;
    this.ghost.setSize({ width, height });
    this.ghost.place({
      left: targetRect.left,
      top: targetRect.top,
    });
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    this.params.onMouseDown();
  }
}

export namespace Draggable {
  export interface Params {
    /**
     * Element which limits draggable movement. `<body>` by default.
     */
    container: HTMLElement;

    /**
     * onDragEnd is called when drag is completed, _even when Draggable was not moved_.
     */
    onDragEnd: (params: OnDragParams) => void;

    /**
     * onDrag is called when drag is in progress on every mouse move.
     */
    onDrag: (params: OnDragParams) => void;

    /**
     * onDragStart is called on first draggable movement.
     */
    onDragStart: (params: OnDragParams) => void;

    /**
     * onMouseDown is called every time mouse button is down on Draggable.
     */
    onMouseDown: () => void;

    /**
     * onMouseUp is called when mouse button is up _only if Draggable was **not** moved_.
     */
    onMouseUp: () => void;
  }

  export interface OnDragParams {
    ghost: HTMLElement;
    rect: Rect;
  }
}


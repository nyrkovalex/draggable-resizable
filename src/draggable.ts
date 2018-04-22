import { fitLeft, fitTop } from './fit';

function noop() {
}

export interface Point {
  x: number;
  y: number;
}

const px = (value: number) => value + 'px';

export class Draggable {
  private readonly params: Draggable.Params;
  private readonly ghost: HTMLElement;
  private readonly proto: HTMLElement;
  private readonly ghostWrapper: HTMLElement;
  private dragPoint: Point | null = null;

  constructor (proto: HTMLElement, params: Partial<Draggable.Params> = {}) {
    this.proto = proto;
    this.params = {
      container: document.body,
      onDrop: noop,
      onDrag: noop,
      ...params,
    };
    this.ghostWrapper = this.createWrapper(this.params.container);
    this.ghost = this.createGhost(proto);
    this.ghostWrapper.appendChild(this.ghost);
    this.proto.addEventListener('mousedown', this.startDrag);
  }

  public get el (): HTMLElement {
    return this.ghost;
  }

  public destroy (): void {
    this.dragPoint = null;
    this.proto.removeEventListener('mousedown', this.startDrag);
  }

  private createWrapper (container: HTMLElement): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.width = px(container.clientWidth);
    wrapper.style.height = px(container.clientHeight);
    wrapper.style.position = 'relative';
    return wrapper;
  }

  private createGhost (proto: HTMLElement): HTMLElement {
    const ghost = proto.cloneNode(true) as HTMLElement;
    ghost.removeAttribute('id');
    ghost.style.position = 'absolute';
    ghost.style.boxSizing = 'border-box';
    return ghost;
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.dragPoint) {
      return;
    }
    const ghostRect = this.ghost.getBoundingClientRect();
    const containerRect = this.ghostWrapper.getBoundingClientRect();

    const left = e.clientX - this.dragPoint.x;
    const top = e.clientY - this.dragPoint.y;

    const targetRect = {
      top,
      left,
      right: left + ghostRect.width,
      bottom: top + ghostRect.height,
      width: ghostRect.width,
      height: ghostRect.height,
    };

    this.ghost.style.left = px(fitLeft(targetRect, containerRect) - containerRect.left);
    this.ghost.style.top = px(fitTop(targetRect, containerRect) - containerRect.top);
  }

  private onMouseUp = (e: Event) => {
    if (!this.dragPoint) {
      return;
    }
    this.dragPoint = null;
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    const rect = this.ghost.getBoundingClientRect();
    const containerRect = this.ghostWrapper.getBoundingClientRect();
    this.params.container.removeChild(this.ghostWrapper);
    this.params.onDrop({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
    });
  }

  private startDrag = (e: MouseEvent) => {
    this.params.container.appendChild(this.ghostWrapper);
    const targetRect = this.proto.getBoundingClientRect();
    this.dragPoint = {
      x: e.clientX - targetRect.left,
      y: e.clientY - targetRect.top,
    };

    const containerRect = this.ghostWrapper.getBoundingClientRect();
    this.ghost.style.width = px(targetRect.width);
    this.ghost.style.height = px(targetRect.height);
    this.ghost.style.left = px(targetRect.left - containerRect.left);
    this.ghost.style.top = px(targetRect.top - containerRect.top);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    this.params.onDrag(this.ghost);
  }
}

export namespace Draggable {
  export interface Params {
    container: HTMLElement;
    onDrop: (point: Point) => void;
    onDrag: (ghost: HTMLElement) => void;
  }
}


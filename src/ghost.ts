import {
  GrowFn,
  Rect,
  fitRect,
  growBottom,
  growLeft,
  growRight,
  growTop,
  px,
} from './size';
import { Parametrized } from './util';

export class Ghost extends Parametrized<Ghost.Params> {
  private hBorder: number = 0;
  private vBorder: number = 0;
  private readonly ghost: HTMLElement;
  private readonly ghostWrapper: HTMLElement;

  constructor(params: Ghost.Params) {
    super(params);
    this.ghost = this.createGhost(params.proto);
    this.ghostWrapper = this.createWrapper(params.container);
    this.ghostWrapper.appendChild(this.ghost);
    const boxSizing = getComputedStyle(this.params.proto).boxSizing;
    if (boxSizing !== 'border-box') {
      this.hBorder = this.params.proto.offsetWidth - this.params.proto.clientWidth;
      this.vBorder = this.params.proto.offsetHeight - this.params.proto.clientHeight;
    }
  }

  private createWrapper(container: HTMLElement): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.width = px(container.clientWidth);
    wrapper.style.height = px(container.clientHeight);
    wrapper.style.position = 'relative';
    return wrapper;
  }

  private createGhost(proto: HTMLElement): HTMLElement {
    const ghost = proto.cloneNode(true) as HTMLElement;
    ghost.removeAttribute('id');
    ghost.style.position = 'absolute';
    return ghost;
  }

  place(params: Ghost.PlaceParams): this {
    const ghostRect = this.ghost.getBoundingClientRect();
    const containerRect = this.ghostWrapper.getBoundingClientRect();

    const targetRect = {
      top: params.top,
      left: params.left,
      width: ghostRect.width,
      height: ghostRect.height,
    };

    const fittedRect = fitRect(targetRect, containerRect);
    this.setRect(fittedRect);

    return this;
  }

  growLeft(value: number): this {
    return this.grow(growLeft(this.params.minSize.width, this.hBorder), value);
  }

  growRight(value: number): this {
    return this.grow(growRight(this.params.minSize.width, this.hBorder), value);
  }

  growTop(value: number): this {
    return this.grow(growTop(this.params.minSize.height, this.vBorder), value);
  }

  growBottom(value: number): this {
    return this.grow(growBottom(this.params.minSize.height, this.vBorder), value);
  }

  setSize({ width, height }: Ghost.SizeParams): this {
    this.ghost.style.width = px(Math.max(width - this.hBorder, 1));
    this.ghost.style.height = px(Math.max(height - this.vBorder, 1));
    return this;
  }

  private grow(growFn: GrowFn, value: number): this {
    const containerRect = this.ghostWrapper.getBoundingClientRect();
    const ghostRect = this.ghost.getBoundingClientRect();
    const sizedRect = growFn(value, ghostRect, containerRect);
    this.setRect(sizedRect);
    return this;
  }

  private setRect(rect: Ghost.PlaceParams & Ghost.SizeParams) {
    const containerRect = this.ghostWrapper.getBoundingClientRect();
    this.ghost.style.left = px(rect.left - containerRect.left);
    this.ghost.style.top = px(rect.top - containerRect.top);
    this.setSize(rect);
  }

  get el(): HTMLElement {
    return this.ghostWrapper;
  }

  get relativeRect(): Rect {
    const rect = this.ghost.getBoundingClientRect();
    const containerRect = this.ghostWrapper.getBoundingClientRect();
    const left = rect.left - containerRect.left;
    const top = rect.top - containerRect.top;
    return {
      top,
      left,
      right: left + rect.width,
      bottom: top + rect.height,
      width: rect.width - this.vBorder,
      height: rect.height - this.hBorder,
    };
  }
}

export namespace Ghost {
  export interface Params {
    proto: HTMLElement;
    container: HTMLElement;
    minSize: SizeParams;
  }

  export interface PlaceParams {
    left: number;
    top: number;
  }

  export interface SizeParams {
    width: number;
    height: number;
  }
}

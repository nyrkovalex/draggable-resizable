import { px, Rect, fitRect, growLeft, growRight, growTop, growBottom, GrowFn } from './size';
import { Parametrized } from './util';

export class Ghost extends Parametrized<Ghost.Params> {
  private readonly ghost: HTMLElement;
  private readonly ghostWrapper: HTMLElement;

  constructor(params: Ghost.Params) {
    super(params);
    this.ghost = this.createGhost(params.proto);
    this.ghostWrapper = this.createWrapper(params.container);
    this.ghostWrapper.appendChild(this.ghost);
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
    ghost.style.boxSizing = 'border-box';
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

  growLeft(left: number): this {
    return this.grow(growLeft, left);
  }

  growRight(right: number): this {
    return this.grow(growRight, right);
  }

  growTop(value: number): this {
    return this.grow(growTop, value);
  }

  growBottom(value: number): this {
    return this.grow(growBottom, value);
  }

  setSize({ width, height }: Ghost.SizeParams): this {
    this.ghost.style.width = px(width);
    this.ghost.style.height = px(height);

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
    this.ghost.style.width = px(rect.width);
    this.ghost.style.height = px(rect.height);
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
      width: rect.width,
      height: rect.height,
    };
  }
}

export namespace Ghost {
  export interface Params {
    proto: HTMLElement;
    container: HTMLElement;
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

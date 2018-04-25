import {
  Rect,
  px,
  IResizeStrategy,
  GrowFunction,
  IPlaceStrategy,
} from './size';
import { Parametrized, SizeParams, PlaceParams, BorderParams } from './util';

export class Ghost extends Parametrized<Ghost.Params> {
  private readonly ghost: HTMLElement;
  private readonly ghostWrapper: HTMLElement;

  constructor(params: Ghost.Params) {
    super(params);
    this.ghost = this.createGhost(params.proto);
    this.ghostWrapper = this.createWrapper(params.container);
    this.ghostWrapper.appendChild(this.ghost);
  }

  place(params: PlaceParams): this {
    const ghostRect = this.ghost.getBoundingClientRect();
    const containerRect = this.ghostWrapper.getBoundingClientRect();

    const targetRect = {
      top: params.top,
      left: params.left,
      width: ghostRect.width,
      height: ghostRect.height,
    };

    const fittedRect = this.params.placeStrategy.place(targetRect, containerRect);
    this.setRect(fittedRect);

    return this;
  }

  growLeft(value: number): this {
    return this.grow(
      this.params.resizeStrategy.growLeft.bind(this.params.resizeStrategy),
      value);
  }

  growRight(value: number): this {
    return this.grow(
      this.params.resizeStrategy.growRight.bind(this.params.resizeStrategy),
      value);
  }

  growTop(value: number): this {
    return this.grow(
      this.params.resizeStrategy.growTop.bind(this.params.resizeStrategy),
      value);
  }

  growBottom(value: number): this {
    return this.grow(
      this.params.resizeStrategy.growBottom.bind(this.params.resizeStrategy),
      value);
  }

  setSize({ width, height }: SizeParams): this {
    this.ghost.style.width = px(width - this.params.borderSizes.horizontal);
    this.ghost.style.height = px(height - this.params.borderSizes.vertical);
    return this;
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
      width: rect.width - this.params.borderSizes.horizontal,
      height: rect.height - this.params.borderSizes.vertical,
    };
  }

  private grow(growFn: GrowFunction, value: number): this {
    const containerRect = this.ghostWrapper.getBoundingClientRect();
    const ghostRect = this.ghost.getBoundingClientRect();
    const sizedRect = growFn(value, ghostRect, containerRect);
    this.setRect(sizedRect);
    return this;
  }

  private setRect(rect: PlaceParams & SizeParams) {
    const containerRect = this.ghostWrapper.getBoundingClientRect();
    this.ghost.style.left = px(rect.left - containerRect.left);
    this.ghost.style.top = px(rect.top - containerRect.top);
    this.setSize(rect);
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
}

export namespace Ghost {
  export interface Params {
    proto: HTMLElement;
    container: HTMLElement;
    resizeStrategy: IResizeStrategy;
    placeStrategy: IPlaceStrategy;
    borderSizes: BorderParams;
  }
}

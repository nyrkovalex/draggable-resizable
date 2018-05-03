import {
  Rect,
  px,
  IPlaceStrategy,
  SizeParams,
  PlaceParams,
} from './size';
import { Parametrized, BorderParams } from './util';

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
    const containerRect = new Rect(this.ghostWrapper.getBoundingClientRect());

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
    return new Rect({
      top,
      left,
      right: left + rect.width - this.params.borderSizes.horizontal,
      bottom: top + rect.height - this.params.borderSizes.vertical,
    });
  }

  get containerRect(): Rect {
    return new Rect(this.ghostWrapper.getBoundingClientRect());
  }

  setRect(rect: PlaceParams & SizeParams): this {
    const containerRect = this.ghostWrapper.getBoundingClientRect();
    this.ghost.style.left = px(rect.left - containerRect.left);
    this.ghost.style.top = px(rect.top - containerRect.top);
    this.setSize(rect);
    return this;
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
    placeStrategy: IPlaceStrategy;
    borderSizes: BorderParams;
  }
}

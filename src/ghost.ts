import {
  Rect,
  px,
  SizeParams,
  PlaceParams,
  IBorders,
} from './size';
import { Parametrized } from './util';

export class Ghost extends Parametrized<Ghost.Params> {
  private readonly ghost: HTMLElement;

  constructor(params: Ghost.Params) {
    super(params);
    this.ghost = this.createGhost(params.proto);
  }

  place(params: PlaceParams): this {
    const ghostRect = this.ghost.getBoundingClientRect();
    const containerRect = new Rect(this.params.container.getBoundingClientRect());

    const targetRect = {
      top: params.top,
      left: params.left,
      width: ghostRect.width,
      height: ghostRect.height,
    };

    const fittedRect = this.calculatePlaceRect(targetRect, containerRect);
    this.setRect(fittedRect);

    return this;
  }

  private calculatePlaceRect (child: PlaceParams & SizeParams, container: Rect) {
    const rect = child;

    const hitLeft = rect.left <= container.left;
    if (hitLeft) {
      rect.left = container.left;
    }

    const hitRight = rect.left + rect.width >= container.right;
    if (hitRight) {
      rect.left = container.right - rect.width;
    }

    const hitTop = rect.top <= container.top;
    if (hitTop) {
      rect.top = container.top;
    }

    const hitBottom = rect.top + rect.height >= container.bottom;
    if (hitBottom) {
      rect.top = container.bottom - rect.height;
    }

    return new Rect({
      left: rect.left,
      top: rect.top,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
    });
  }

  setSize({ width, height }: SizeParams): this {
    this.ghost.style.width = px(width - this.params.borderSizes.horizontal);
    this.ghost.style.height = px(height - this.params.borderSizes.vertical);
    return this;
  }

  get el(): HTMLElement {
    return this.ghost;
  }

  get relativeRect(): Rect {
    const rect = this.ghost.getBoundingClientRect();
    const containerRect = this.params.container.getBoundingClientRect();
    const left = rect.left - containerRect.left - this.params.containerBorderSizes.left;
    const top = rect.top - containerRect.top - this.params.containerBorderSizes.top;
    return new Rect({
      top,
      left,
      right: left + rect.width - this.params.borderSizes.horizontal,
      bottom: top + rect.height - this.params.borderSizes.vertical,
    });
  }

  get containerRect(): Rect {
    return new Rect(this.params.container.getBoundingClientRect());
  }

  setRect(rect: PlaceParams & SizeParams): this {
    const containerRect = this.params.container.getBoundingClientRect();
    this.ghost.style.left = px(
      rect.left - containerRect.left - this.params.containerBorderSizes.left);
    this.ghost.style.top = px(
      rect.top - containerRect.top - this.params.containerBorderSizes.top);
    this.setSize(rect);
    return this;
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
    borderSizes: IBorders;
    containerBorderSizes: IBorders;
  }
}

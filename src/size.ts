export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface SizeParams {
  width: number;
  height: number;
}

export interface PlaceParams {
  left: number;
  top: number;
}

export class Rect implements Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;

  constructor(bounds: Bounds) {
    this.left = bounds.left;
    this.right = bounds.right;
    this.top = bounds.top;
    this.bottom = bounds.bottom;
  }

  get width() {
    return this.right - this.left;
  }

  get height() {
    return this.bottom - this.top;
  }

  withUpdate (update: Partial<Bounds>): Rect {
    return new Rect({
      left: this.left,
      right: this.right,
      bottom: this.bottom,
      top: this.top,
      ...update,
    });
  }
}

export function px(value: number) {
  return Math.round(value) + 'px';
}

export interface Point {
  x: number;
  y: number;
}

export interface IPlaceStrategy {
  place(child: IPlaceStrategy.FitParams, container: Rect): Rect;
}

export namespace IPlaceStrategy {
  export interface FitParams extends PlaceParams, SizeParams {
  }
}

export class SimplePlaceStrategy implements IPlaceStrategy {
  place(child: IPlaceStrategy.FitParams, container: Rect): Rect {
    const rect: IPlaceStrategy.FitParams = child;

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
}

import { Parametrized, SizeParams, BorderParams, PlaceParams } from './util';

export interface Rect {
  top: number;
  bottom: number;
  right: number;
  left: number;
  width: number;
  height: number;
}

export function px(value: number) {
  return Math.floor(value) + 'px';
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

    return {
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
    };
  }
}


export interface IResizeStrategy {
  growTop: GrowFunction;
  growBottom: GrowFunction;
  growLeft: GrowFunction;
  growRight: GrowFunction;
}

export interface GrowFunction {
  (value: number, rect: Rect, container: Rect): Rect;
}

export abstract class BaseResizeStrategy
  extends Parametrized<BaseResizeStrategy.Params>
  implements IResizeStrategy {
  abstract growTop(value: number, rect: Rect, container: Rect): Rect;
  abstract growBottom(value: number, rect: Rect, container: Rect): Rect;
  abstract growLeft(value: number, rect: Rect, container: Rect): Rect;
  abstract growRight(value: number, rect: Rect, container: Rect): Rect;

  protected updateRect(rect: Rect, update: Partial<Rect>): Rect {
    return {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right,
      height: rect.height,
      width: rect.width,
      ...update,
    };
  }
}

export namespace BaseResizeStrategy {
  export interface Params {
    minSize: SizeParams;
    borderSize: BorderParams;
  }
}

export class SimpleResizeStrategy extends BaseResizeStrategy {
  growTop(value: number, rect: Rect, container: Rect): Rect {
    let fixed = value;

    const tooShort = rect.bottom - fixed <= this.params.minSize.height;
    if (tooShort) {
      fixed = rect.bottom - this.params.minSize.height - this.params.borderSize.vertical;
    }

    const tooHigh = fixed < container.top;
    if (tooHigh) {
      fixed = container.top;
    }

    return this.updateRect(rect, {
      top: fixed,
      height: rect.bottom - fixed,
    });
  }

  growBottom(value: number, rect: Rect, container: Rect): Rect {
    let fixed = value;

    const tooShort = fixed - rect.top <= this.params.minSize.height;
    if (tooShort) {
      fixed = rect.top + this.params.minSize.height + this.params.borderSize.vertical;
    }

    const tooHigh = fixed > container.bottom;
    if (tooHigh) {
      fixed = container.bottom;
    }

    return this.updateRect(rect, {
      height: fixed - rect.top,
    });
  }

  growLeft(value: number, rect: Rect, container: Rect): Rect {
    let fixed = value;
    const tooNarrow = rect.right - value <= this.params.minSize.width;
    if (tooNarrow) {
      fixed = rect.right - this.params.minSize.width - this.params.borderSize.horizontal;
    }

    const tooWide = value < container.left;
    if (tooWide) {
      fixed = container.left;
    }

    return this.updateRect(rect, {
      left: fixed,
      width: rect.right - fixed,
    });
  }

  growRight(value: number, rect: Rect, container: Rect): Rect {
    let fixed = value;
    const tooNarrow = fixed - rect.left <= this.params.minSize.width;
    if (tooNarrow) {
      fixed = rect.left + this.params.minSize.width + this.params.borderSize.horizontal;
    }

    const tooWide = fixed > container.right;
    if (tooWide) {
      fixed = container.right;
    }

    return this.updateRect(rect, {
      ...rect,
      width: fixed - rect.left,
    });
  }
}

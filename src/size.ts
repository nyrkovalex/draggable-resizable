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
  changeRect(
    rect: Rect,
    container: Rect,
    fitInto: IResizeStrategy.ChangeRectParams,
    aspectRatio?: number,
  ): Rect;
}

export namespace IResizeStrategy {
  export interface ChangeRectParams extends PlaceParams {
    right: number;
    bottom: number;
  }
}

export interface GrowFunction {
  (value: number, rect: Rect, container: Rect, aspectRatio?: number): Rect;
}

export abstract class BaseResizeStrategy
  extends Parametrized<BaseResizeStrategy.Params>
  implements IResizeStrategy {
  abstract growTop(value: number, rect: Rect, container: Rect, aspectRatio?: number): Rect;
  abstract growBottom(value: number, rect: Rect, container: Rect, aspectRatio?: number): Rect;
  abstract growLeft(value: number, rect: Rect, container: Rect, aspectRatio?: number): Rect;
  abstract growRight(value: number, rect: Rect, container: Rect, aspectRatio?: number): Rect;
  abstract changeRect(
    rect: Rect,
    container: Rect,
    fitInto: IResizeStrategy.ChangeRectParams,
    aspectRatio?: number,
  ): Rect;

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
  growTop(value: number, rect: Rect, container: Rect, aspectRatio: number = 0): Rect {
    let fixed = value;

    const tooShort = rect.bottom - fixed <= this.params.minSize.height;
    if (tooShort) {
      fixed = rect.bottom - this.params.minSize.height - this.params.borderSize.vertical;
    }

    const tooHigh = fixed < container.top;
    if (tooHigh) {
      fixed = container.top;
    }

    let top = fixed;
    let height = rect.bottom - fixed;

    if (!aspectRatio) {
      return this.updateRect(rect, {
        height,
        top,
      });
    }

    let width = aspectRatio * height;
    const hitRight = rect.left + width >= container.right;
    if (hitRight) {
      width = container.right - rect.left;
      height = width / aspectRatio;
      top = rect.bottom - height;
    }

    return this.updateRect(rect, {
      height,
      width,
      top,
    });
  }

  growBottom(value: number, rect: Rect, container: Rect, aspectRatio: number = 0): Rect {
    let fixed = value;

    const tooShort = fixed - rect.top <= this.params.minSize.height;
    if (tooShort) {
      fixed = rect.top + this.params.minSize.height + this.params.borderSize.vertical;
    }

    const tooHigh = fixed > container.bottom;
    if (tooHigh) {
      fixed = container.bottom;
    }

    let height = fixed - rect.top;

    if (!aspectRatio) {
      return this.updateRect(rect, {
        height: fixed - rect.top,
      });
    }

    let width = aspectRatio * height;
    const hitRight = rect.left + width >= container.right;
    if (hitRight) {
      width = container.right - rect.left;
      height = width / aspectRatio;
    }

    return this.updateRect(rect, {
      height,
      width,
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

  growRight(value: number, rect: Rect, container: Rect, aspectRatio?: number): Rect {
    let fixed = value;
    const tooNarrow = fixed - rect.left <= this.params.minSize.width;
    if (tooNarrow) {
      fixed = rect.left + this.params.minSize.width + this.params.borderSize.horizontal;
    }

    const tooWide = fixed > container.right;
    if (tooWide) {
      fixed = container.right;
    }

    let width = fixed - rect.left;

    if (!aspectRatio) {
      return this.updateRect(rect, {
        ...rect,
        width,
      });
    }

    let height = width / aspectRatio;
    const hitBottom = rect.top + height >= container.bottom;
    if (hitBottom) {
      height = container.bottom - rect.top;
      width = aspectRatio / height;
    }

    return this.updateRect(rect, {
      ...rect,
      width,
      height,
    });
  }

  changeRect(
    rect: Rect,
    container: Rect,
    fitInto: IResizeStrategy.ChangeRectParams,
    aspectRatio: number = 0,
  ) {
    return this.fixBounds(rect, fitInto, container);
  }

  private fixBounds(
    rect: Rect,
    requestedBounds: IResizeStrategy.ChangeRectParams,
    container: Rect,
  ): Rect {
    return {
      left: Math.max(requestedBounds.left, container.left),
      bottom: Math.min(requestedBounds.bottom, container.bottom),
      top: Math.max(requestedBounds.top, container.top),
      right: Math.min(requestedBounds.right, container.right),
      get width() {
        return this.right - this.left;
      },
      get height() {
        return this.bottom - this.top;
      },
    };
  }

  // private fitByWidth(
  //   rect: Rect,
  //   bounds: Rect,
  //   aspectRatio: number = 0,
  // ) {
  //   if (aspectRatio <= 0) {
  //     return bounds;
  //   }

  //   const height = bounds.width / aspectRatio;
  //   return new DOMRect(
  //     bounds.left,
  //     bounds.top,
  //     bounds.width,
  //     height,
  //   );
  // }

  // private fitByHeight(
  //   rect: Rect,
  //   bounds: Rect,
  //   container: Rect,
  //   aspectRatio: number = 0,
  // ) {
  //   if (aspectRatio <= 0) {
  //     return bounds;
  //   }
  //   const width = bounds.height * aspectRatio;
  //   return new DOMRect(
  //     bounds.left,
  //     bounds.top,
  //     width,
  //     bounds.height,
  //   );
  // }
}

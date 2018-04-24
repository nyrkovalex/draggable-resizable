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

function updateRect(rect: Rect, update: Partial<Rect>): Rect {
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

export function fitRect(child: FitParams, container: Rect): Rect {
  const rect: FitParams = child;

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

export interface FitParams {
  left: number;
  top: number;
  width: number;
  height: number;
}


export const growLeft: GrowFnFactory =
  (minSize: number, borderSize: number) =>
    (value: number, rect: Rect, container: Rect): Rect => {
      let fixed = value;
      const tooNarrow = rect.right - value <= minSize;
      if (tooNarrow) {
        fixed = rect.right - minSize - borderSize;
      }

      const tooWide = value < container.left;
      if (tooWide) {
        fixed = container.left;
      }

      return updateRect(rect, {
        left: fixed,
        width: rect.right - fixed,
      });
    };

export const growRight: GrowFnFactory =
  (minSize: number, borderSize: number) =>
    (value: number, rect: Rect, container: Rect): Rect => {
      let fixed = value;
      const tooNarrow = fixed - rect.left <= minSize;
      if (tooNarrow) {
        fixed = rect.left + minSize + borderSize;
      }

      const tooWide = fixed > container.right;
      if (tooWide) {
        fixed = container.right;
      }

      return updateRect(rect, {
        ...rect,
        width: fixed - rect.left,
      });
    };

export const growTop: GrowFnFactory =
  (minSize: number, borderSize: number) =>
    (value: number, rect: Rect, container: Rect): Rect => {
      let fixed = value;

      const tooShort = rect.bottom - fixed <= minSize;
      if (tooShort) {
        fixed = rect.bottom - minSize - borderSize;
      }

      const tooHigh = fixed < container.top;
      if (tooHigh) {
        fixed = container.top;
      }

      return updateRect(rect, {
        top: fixed,
        height: rect.bottom - fixed,
      });
    };

export const growBottom: GrowFnFactory =
  (minSize: number, borderSize: number) =>
    (value: number, rect: Rect, container: Rect): Rect => {
      let fixed = value;

      const tooShort = fixed - rect.top <= minSize;
      if (tooShort) {
        fixed = rect.top + minSize + borderSize;
      }

      const tooHigh = fixed > container.bottom;
      if (tooHigh) {
        fixed = container.bottom;
      }

      return updateRect(rect, {
        height: fixed - rect.top,
      });
    };

export interface GrowFn {
  (value: number, rect: Rect, container: Rect): Rect;
}

export interface GrowFnFactory {
  (minSize: number, borderSize: number): GrowFn;
}

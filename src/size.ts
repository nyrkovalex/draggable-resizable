export interface Rect {
  top: number;
  bottom: number;
  right: number;
  left: number;
  width: number;
  height: number;
}

export function px(value: number) {
  return value + 'px';
}

export interface Point {
  x: number;
  y: number;
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

  const hitBottom = rect.top + rect.width >= container.bottom;
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

export interface PlaceParams {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function sizeRect(params: PlaceParams, container: Rect): Rect {
  const fixed: PlaceParams = params;

  const hitLeft = fixed.left <= container.left;
  if (hitLeft) {
    fixed.left = container.left;
  }

  const hitRight = fixed.right >= container.right;
  if (hitRight) {
    fixed.right = container.right;
  }

  const hitTop = fixed.top <= container.top;
  if (hitTop) {
    fixed.top = container.top;
  }

  const hitBottom = fixed.bottom >= container.bottom;
  if (hitBottom) {
    fixed.bottom = container.bottom;
  }

  return {
    ...fixed,
    width: fixed.right - fixed.left,
    height: fixed.bottom - fixed.top,
  };
}

export function growLeft(value: number, rect: Rect, container: Rect): Rect {
  let fixed = value;
  const tooNarrow = rect.right - value <= 1;
  if (tooNarrow) {
    fixed = rect.right - 2;
  }

  const tooWide = value < container.left;
  if (tooWide) {
    fixed = container.left;
  }

  return {
    ...rect,
    left: fixed,
    width: rect.right - fixed,
  };
}

export function growRight(value: number, rect: Rect, container: Rect): Rect {
  let fixed = value;
  const tooNarrow = value - rect.left <= 1;
  if (tooNarrow) {
    fixed = rect.left + 2;
  }

  const tooWide = value > container.right;
  if (tooWide) {
    fixed = container.right;
  }

  return {
    ...rect,
    width: fixed - rect.left,
  };
}

export function growTop(value: number, rect: Rect, container: Rect): Rect {
  let fixed = value;

  const tooLow = rect.bottom - fixed <= 1;
  if (tooLow) {
    fixed = rect.bottom - 2;
  }

  const tooHigh = value < container.top;
  if (tooHigh) {
    fixed = container.top;
  }

  return {
    ...rect,
    top: fixed,
    height: rect.bottom - fixed,
  };
}

export function growBottom(value: number, rect: Rect, container: Rect): Rect {
  let fixed = value;

  const tooLow = fixed - rect.top <= 1;
  if (tooLow) {
    fixed = rect.top + 2;
  }

  const tooHigh = fixed > container.bottom;
  if (tooHigh) {
    fixed = container.bottom;
  }

  return {
    ...rect,
    height: fixed - rect.top,
  };
}

export interface GrowFn {
  (value: number, rect: Rect, container: Rect): Rect;
}

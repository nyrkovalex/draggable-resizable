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

export function unpx(value: string | null) {
  return value == null ? 0 : Number(value.replace(/px$/, ''));
}

export interface Point {
  x: number;
  y: number;
}

export interface IBorders {
  vertical: number;
  horizontal: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class Borders implements IBorders {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;

  constructor(el: HTMLElement) {
    const computedStyle = window.getComputedStyle(el);
    if (computedStyle.boxSizing === 'border-box') {
      this.left = 0;
      this.right = 0;
      this.top = 0;
      this.bottom = 0;
      return;
    }

    this.left = unpx(computedStyle.borderLeftWidth);
    this.right = unpx(computedStyle.borderRightWidth);
    this.top = unpx(computedStyle.borderTopWidth);
    this.bottom = unpx(computedStyle.borderBottomWidth);
  }

  get vertical () {
    return this.left + this.right;
  }

  get horizontal () {
    return this.top + this.bottom;
  }
}

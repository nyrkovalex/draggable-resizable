export interface IDestructable {
  destroy(): void;
}

export abstract class Parametrized<P> {
  protected readonly params: P;

  constructor(params: P) {
    this.params = params;
  }
}

export function noop() {
}


export interface SizeParams {
  width: number;
  height: number;
}

export interface PlaceParams {
  left: number;
  top: number;
}

export interface BorderParams {
  vertical: number;
  horizontal: number;
}

export interface Bounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

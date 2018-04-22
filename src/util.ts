export interface IDestructable {
  destroy (): void;
}

export abstract class Parametrized<P> {
  protected readonly params: P;

  constructor(params: P) {
    this.params = params;
  }
}

export function noop() {
}

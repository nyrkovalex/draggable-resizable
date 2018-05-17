import { Parametrized } from './util';
import { Ghost } from './ghost';
import { Borders } from './size';

export abstract class Haunted<T> extends Parametrized<T> {
  protected createGhost(proto: HTMLElement, container: HTMLElement): Ghost {
    const borderSizes = new Borders(proto);
    const containerBorderSizes = new Borders(container);
    return new Ghost({
      proto,
      container,
      borderSizes,
      containerBorderSizes,
    });
  }
}

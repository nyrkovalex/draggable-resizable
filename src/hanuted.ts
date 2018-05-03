import { Parametrized } from './util';
import { IPlaceStrategy, SimplePlaceStrategy } from './size';
import { Ghost } from './ghost';

export abstract class Haunted<T> extends Parametrized<T> {
  protected countBorderSize(proto: HTMLElement) {
    const boxSizing = getComputedStyle(proto).boxSizing;
    return boxSizing === 'border-box'
      ? {
        horizontal: 0,
        vertical: 0,
      }
      : {
        horizontal: proto.offsetWidth - proto.clientWidth,
        vertical: proto.offsetHeight - proto.clientHeight,
      };
  }

  protected createPlaceStrategy(): IPlaceStrategy {
    return new SimplePlaceStrategy();
  }

  protected createGhost(proto: HTMLElement, container: HTMLElement): Ghost {
    const borderSizes = this.countBorderSize(proto);
    return new Ghost({
      proto,
      container,
      borderSizes,
      placeStrategy: this.createPlaceStrategy(),
    });
  }
}

import { Ghost } from '../ghost';
import * as handles from './handles';
import { IDestructable, Parametrized, noop } from '../util';
import { Rect } from '../size';

type HandleFactory = { [key: string]: handles.ResizeHandle.Constructor } & {
  [K in keyof Resizable.Handles]: handles.ResizeHandle.Constructor
};

export class Resizable extends Parametrized<Resizable.Params> implements IDestructable {
  private readonly proto: HTMLElement;
  private readonly ghost: Ghost;
  private readonly handles: handles.ResizeHandle[];

  private resizeHandlers: HandleFactory = {
    left: handles.LeftResizeHandle,
    right: handles.RightResizeHandle,
    top: handles.TopResizeHandle,
    bottom: handles.BottomResizeHandle,
    topLeft: handles.TopLeftResizeHandle,
    topRight: handles.TopRightResizeHandle,
    bottomRight: handles.BottomRightResizeHandle,
    bottomLeft: handles.BottomLeftResizeHandle,
  };

  constructor(proto: HTMLElement, params: Partial<Resizable.Params> = {}) {
    super({
      container: document.body,
      keepAspectRatio: false,
      handles: {},
      onResizeStart: noop,
      onResizeEnd: noop,
      ...params,
    });
    this.proto = proto;
    this.ghost = new Ghost({
      proto,
      container: this.params.container,
    });
    this.handles = this.bindHandlers(this.params.handles);
  }

  destroy(): void {
    this.handles.forEach(h => h.destroy());
  }

  private bindHandlers(handles: Partial<Resizable.Handles>): handles.ResizeHandle[] {
    return (Object.keys(handles) as Resizable.ResizeDirection[])
      .map((key) => {
        const MaybeHandleConstructor = this.resizeHandlers[key];
        if (!MaybeHandleConstructor) {
          return;
        }
        const handleEl = handles[key];
        if (!handleEl) {
          return;
        }
        return new MaybeHandleConstructor({
          el: handleEl,
          container: this.params.container,
          ghost: this.ghost,
          proto: this.proto,
          onResizeEnd: this.params.onResizeEnd,
          onResizeStart: () => this.params.onResizeStart(key),
        });
      })
      .filter(Boolean) as handles.ResizeHandle[];
  }
}

export namespace Resizable {
  export type ResizeDirection =
    'left' |
    'topLeft' |
    'top' |
    'topRight' |
    'right' |
    'bottomRight' |
    'bottom' |
    'bottomLeft';

  export interface Params {
    container: HTMLElement;
    keepAspectRatio: boolean;
    handles: Partial<Handles>;
    onResizeStart: (direction: ResizeDirection) => void;
    onResizeEnd: (result: Rect) => void;
  }

  export type Handles = {
    [K in ResizeDirection]: HTMLElement;
  };
}

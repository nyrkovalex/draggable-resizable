import * as handles from './handles';
import { IDestructable, noop, Parametrized } from '../util';
import { Rect, SizeParams, IBorders, Borders } from '../size';

type HandleFactory = { [key: string]: handles.ResizeHandle.Constructor } & {
  [K in keyof Resizable.Handles]: handles.ResizeHandle.Constructor
};

export class Resizable extends Parametrized<Resizable.Params> implements IDestructable {
  private borderSize: IBorders;
  private readonly proto: HTMLElement;
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
      minSize: {
        height: 1,
        width: 1,
      },
      ...params,
    });
    this.proto = proto;
    this.borderSize = new Borders(proto);
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
          proto: this.proto,
          onResizeEnd: this.params.onResizeEnd,
          keepAspectRatio: this.params.keepAspectRatio,
          minSize: {
            height: this.params.minSize.height + this.borderSize.vertical,
            width: this.params.minSize.width + this.borderSize.horizontal,
          },
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
    minSize: SizeParams;
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

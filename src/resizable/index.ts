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

  /**
   * Resizable element can be resized inside bounds of its `params.container`.
   * Actual `proto` element is never mutated except for `mousedown` listener being attached
   * to start the resize action.
   *
   * Instead ghost (a deep clone) element is created
   * and mounted right before `proto` in DOM tree and properly resized.
   *
   * It's a client responsibility to perform additional actions like hiding actual element
   * `params.onMouseDown` and setting new coordinates `params.onResizeEnd`
   *
   * @param proto resizable element, prototype for resizable ghost
   * @param params resizable options
   */
  constructor(proto: HTMLElement, params: Partial<Resizable.Params> = {}) {
    super({
      container: document.body,
      keepAspectRatio: false,
      handles: {},
      onResizeStart: noop,
      onResizeEnd: noop,
      onMouseDown: noop,
      onMouseUp: noop,
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

  /**
   * Cleans up everything Resizable has placed in DOM.
   * Resizable cannot be reused after destroy.
   *
   * Please be responsible. Recycle ♻️.
   */
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
          keepAspectRatio: this.params.keepAspectRatio,
          minSize: {
            height: this.params.minSize.height + this.borderSize.vertical,
            width: this.params.minSize.width + this.borderSize.horizontal,
          },
          onMouseDown: this.params.onMouseDown,
          onResizeStart: () => this.params.onResizeStart(key),
          onResizeEnd: this.params.onResizeEnd,
          onMouseUp: this.params.onMouseUp,
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
    /**
     * Minimal size target element can be resized to
     */
    minSize: SizeParams;

    /**
     * Element which limits resizable growth. `<body>` by default.
     */
    container: HTMLElement;

    /**
     * Whether to keep original aspect ratio or not.
     */
    keepAspectRatio: boolean;

    /**
     * Drag handles — a hash of elements which serve as resize handle
     * for each supported direction.
     */
    handles: Partial<Handles>;

    /**
     * onResizeStart is called on first mouse movement while holding button down
     *
     * @param direction resize direction.
     * Can take values 'left', 'topLeft', 'top', 'topRight', 'right',
     * 'bottomRight', 'bottom', 'bottomLeft';
     */
    onResizeStart: (direction: ResizeDirection) => void;

    /**
     * onResizeEnd is called when resize is completed, _even if element was not resized at all_.
     */
    onResizeEnd: (result: Rect) => void;

    /**
     * onMouseDown is called every time mouse button is down on Resizable element.
     */
    onMouseDown: () => void;

    /**
     * onMouseUp is called when mouse button is up, _only if Resizable was **not** resized_.
     */
    onMouseUp: () => void;
  }

  export type Handles = {
    [K in ResizeDirection]: HTMLElement;
  };
}

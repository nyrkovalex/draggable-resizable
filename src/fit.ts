export type Rect = ClientRect | DOMRect;

export function fitLeft(child: Rect, container: Rect): number {
  const hitLeft = child.left <= container.left;
  if (hitLeft) {
    return container.left;
  }

  const hitRight = child.right >= container.right;
  if (hitRight) {
    return container.right - child.width;
  }
  return child.left;
}

export function fitTop(child: Rect, container: Rect): number {
  const hitTop = child.top <= container.top;
  if (hitTop) {
    return container.top;
  }

  const hitBottom = child.bottom >= container.bottom;
  if (hitBottom) {
    return container.bottom - child.height;
  }

  return child.top;
}


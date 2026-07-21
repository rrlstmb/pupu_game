export type LayoutMode = 'desktop' | 'tablet_landscape' | 'tablet_portrait' | 'mobile_landscape' | 'mobile_portrait';
export type Insets = { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number };
export type Rect = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
export type ResponsiveViewport = {
  readonly cssWidth: number; readonly cssHeight: number; readonly devicePixelRatio: number;
  readonly safeArea: Insets;
};
export type ResponsiveLayoutSnapshot = {
  readonly layoutMode: LayoutMode;
  readonly orientation: 'portrait' | 'landscape';
  readonly gameViewport: Rect;
  readonly touchRegions: { readonly movement: Rect; readonly throw: Rect };
  readonly safeArea: Insets;
  readonly uiScale: number;
  readonly fontScale: number;
};

export function createResponsiveLayout(viewport: ResponsiveViewport, textScale = 1, handedness: 'right_handed' | 'left_handed' = 'right_handed'): ResponsiveLayoutSnapshot {
  const width = Math.max(320, viewport.cssWidth);
  const height = Math.max(320, viewport.cssHeight);
  const portrait = height > width;
  const mobile = Math.min(width, height) < 600;
  const tablet = !mobile && width < 1200;
  const layoutMode: LayoutMode = mobile
    ? portrait ? 'mobile_portrait' : 'mobile_landscape'
    : tablet ? portrait ? 'tablet_portrait' : 'tablet_landscape' : 'desktop';
  const safe = viewport.safeArea;
  const gameViewport = { x: safe.left, y: safe.top, width: width - safe.left - safe.right, height: height - safe.top - safe.bottom };
  const controlHeight = Math.max(112, Math.min(190, gameViewport.height * (portrait ? 0.24 : 0.3)));
  const sideWidth = gameViewport.width / 2;
  const left = { x: gameViewport.x, y: gameViewport.y + gameViewport.height - controlHeight, width: sideWidth, height: controlHeight };
  const right = { ...left, x: gameViewport.x + sideWidth };
  return {
    layoutMode, orientation: portrait ? 'portrait' : 'landscape', gameViewport,
    touchRegions: handedness === 'right_handed' ? { movement: left, throw: right } : { movement: right, throw: left },
    safeArea: safe,
    uiScale: mobile ? 0.86 : tablet ? 0.94 : 1,
    fontScale: clamp(textScale, 1, 1.3)
  };
}

function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }

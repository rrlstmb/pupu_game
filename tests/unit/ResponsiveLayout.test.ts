import { describe, expect, it } from 'vitest';
import { createResponsiveLayout } from '../../src/domain/layout/ResponsiveLayout';

const layout = (width: number, height: number, scale = 1, handedness: 'right_handed' | 'left_handed' = 'right_handed') =>
  createResponsiveLayout({ cssWidth: width, cssHeight: height, devicePixelRatio: 2, safeArea: { top: 10, right: 8, bottom: 12, left: 6 } }, scale, handedness);

describe('responsive layout', () => {
  it.each([
    [1366, 768, 'desktop'], [1024, 768, 'tablet_landscape'], [768, 1024, 'tablet_portrait'],
    [844, 390, 'mobile_landscape'], [390, 844, 'mobile_portrait']
  ] as const)('classifies %sx%s as %s', (width, height, expected) => expect(layout(width, height).layoutMode).toBe(expected));

  it('applies safe area and preserves non-overlapping mirrored controls', () => {
    const right = layout(390, 844, 1.3);
    const left = layout(390, 844, 1.3, 'left_handed');
    expect(right.gameViewport).toEqual({ x: 6, y: 10, width: 376, height: 822 });
    expect(right.touchRegions.movement.x).toBeLessThan(right.touchRegions.throw.x);
    expect(left.touchRegions.movement.x).toBeGreaterThan(left.touchRegions.throw.x);
    expect(right.fontScale).toBe(1.3);
  });
});

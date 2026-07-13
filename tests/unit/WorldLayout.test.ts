import { describe, expect, it } from 'vitest';
import { createWorldLayout, getLane, getZone } from '../../src/domain/layout/WorldLayout';

describe('WorldLayout', () => {
  it.each([
    [1280, 720],
    [1920, 1080],
    [390, 844]
  ])('keeps vertical zones proportional at %ix%i', (width, height) => {
    const layout = createWorldLayout(width, height);
    const skyline = getZone(layout, 'skyline');
    const alley = getZone(layout, 'alley');
    const rooftop = getZone(layout, 'rooftop');

    expect(skyline.height / height).toBeCloseTo(0.25, 5);
    expect(alley.height / height).toBeCloseTo(0.45, 5);
    expect(rooftop.height / height).toBeCloseTo(0.3, 5);
    expect(skyline.y).toBe(0);
    expect(alley.y).toBeCloseTo(skyline.height, 5);
    expect(rooftop.y).toBeCloseTo(skyline.height + alley.height, 5);
    expect(rooftop.y + rooftop.height).toBeCloseTo(height, 5);
  });

  it('orders lanes from back to front with increasing y, depth, scale, and speed', () => {
    const layout = createWorldLayout();
    const back = getLane(layout, 'back_shop');
    const mid = getLane(layout, 'mid_sidewalk');
    const front = getLane(layout, 'front_road');

    expect(back.y).toBeLessThan(mid.y);
    expect(mid.y).toBeLessThan(front.y);
    expect(back.depth).toBeLessThan(mid.depth);
    expect(mid.depth).toBeLessThan(front.depth);
    expect(back.scale).toBeLessThan(mid.scale);
    expect(mid.scale).toBeLessThan(front.scale);
    expect(back.speedMultiplier).toBeLessThan(mid.speedMultiplier);
    expect(mid.speedMultiplier).toBeLessThan(front.speedMultiplier);
  });

  it('keeps rooftop movement and cover slots inside the rooftop zone', () => {
    const layout = createWorldLayout();
    const rooftopZone = getZone(layout, 'rooftop');

    expect(layout.rooftop.minX).toBeGreaterThan(0);
    expect(layout.rooftop.maxX).toBeLessThan(layout.width);
    expect(layout.rooftop.y).toBeGreaterThanOrEqual(rooftopZone.y);
    expect(layout.rooftop.y + layout.rooftop.height).toBeLessThanOrEqual(layout.height);
    expect(layout.rooftop.playerBaselineY).toBeGreaterThanOrEqual(layout.rooftop.y);
    expect(layout.rooftop.playerBaselineY).toBeLessThanOrEqual(layout.rooftop.y + layout.rooftop.height);
    expect(layout.parallaxBaseSpeed).toBeGreaterThan(0);
    expect(layout.rooftop.coverSlots).toHaveLength(2);

    for (const cover of layout.rooftop.coverSlots) {
      expect(cover.x).toBeGreaterThanOrEqual(layout.rooftop.minX);
      expect(cover.x + cover.width).toBeLessThanOrEqual(layout.rooftop.maxX);
      expect(cover.y).toBeGreaterThanOrEqual(rooftopZone.y);
      expect(cover.y + cover.height).toBeLessThanOrEqual(layout.height);
    }
  });

  it('defines at least three parallax layers with distinct scroll factors', () => {
    const layout = createWorldLayout();
    const factors = layout.parallaxLayers.map((layer) => layer.scrollFactor);

    expect(layout.parallaxLayers.length).toBeGreaterThanOrEqual(3);
    expect(new Set(factors).size).toBe(factors.length);
    expect(factors[0]).toBeLessThan(factors[1]);
    expect(factors[1]).toBeLessThan(factors[2]);
  });
});

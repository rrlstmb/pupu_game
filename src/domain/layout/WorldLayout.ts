import { GAME_CONFIG } from '../../runtime/GameConfig';
import { Depths } from './Depth';

export type Rect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type VerticalZoneId = 'skyline' | 'alley' | 'rooftop';

export type VerticalZone = Rect & {
  readonly id: VerticalZoneId;
  readonly label: string;
  readonly ratio: number;
  readonly depth: number;
};

export type ParallaxLayer = Rect & {
  readonly id: 'far' | 'mid' | 'near';
  readonly label: string;
  readonly scrollFactor: number;
  readonly depth: number;
  readonly color: number;
};

export type LaneId = 'back_shop' | 'mid_sidewalk' | 'front_road';

export type Lane = {
  readonly id: LaneId;
  readonly label: string;
  readonly y: number;
  readonly scale: number;
  readonly depth: number;
  readonly speedMultiplier: number;
  readonly bounds: Rect;
};

export type CoverSlot = Rect & {
  readonly id: 'left_cover' | 'right_cover';
  readonly label: string;
  readonly depth: number;
};

export type RooftopMovementArea = Rect & {
  readonly minX: number;
  readonly maxX: number;
  readonly playerBaselineY: number;
  readonly coverSlots: readonly CoverSlot[];
};

export type WorldLayout = {
  readonly width: number;
  readonly height: number;
  readonly zones: readonly VerticalZone[];
  readonly parallaxLayers: readonly ParallaxLayer[];
  readonly lanes: readonly Lane[];
  readonly rooftop: RooftopMovementArea;
  readonly parallaxBaseSpeed: number;
  readonly debugStep: number;
};

export function createWorldLayout(width = GAME_CONFIG.width, height = GAME_CONFIG.height): WorldLayout {
  const skylineHeight = height * 0.25;
  const alleyHeight = height * 0.45;
  const rooftopHeight = height - skylineHeight - alleyHeight;

  const skyline: VerticalZone = {
    id: 'skyline',
    label: '城市遠景',
    ratio: 0.25,
    x: 0,
    y: 0,
    width,
    height: skylineHeight,
    depth: Depths.backgroundFar
  };
  const alley: VerticalZone = {
    id: 'alley',
    label: '主要巷弄',
    ratio: 0.45,
    x: 0,
    y: skylineHeight,
    width,
    height: alleyHeight,
    depth: Depths.alleyBack
  };
  const rooftop: VerticalZone = {
    id: 'rooftop',
    label: '玩家頂樓',
    ratio: 0.3,
    x: 0,
    y: skylineHeight + alleyHeight,
    width,
    height: rooftopHeight,
    depth: Depths.rooftop
  };

  const laneHeight = alley.height / 3;
  const lanes: readonly Lane[] = [
    {
      id: 'back_shop',
      label: '後排店面區',
      y: alley.y + laneHeight * 0.65,
      scale: 0.78,
      depth: Depths.alleyBack,
      speedMultiplier: 0.78,
      bounds: rect(0, alley.y, width, laneHeight)
    },
    {
      id: 'mid_sidewalk',
      label: '中排人行道',
      y: alley.y + laneHeight * 1.65,
      scale: 0.92,
      depth: Depths.alleyMid,
      speedMultiplier: 1,
      bounds: rect(0, alley.y + laneHeight, width, laneHeight)
    },
    {
      id: 'front_road',
      label: '前排道路',
      y: alley.y + laneHeight * 2.62,
      scale: 1.08,
      depth: Depths.alleyFront,
      speedMultiplier: 1.18,
      bounds: rect(0, alley.y + laneHeight * 2, width, laneHeight)
    }
  ];

  const movementMargin = width * 0.08;
  const coverWidth = width * 0.1;
  const coverHeight = rooftop.height * 0.52;
  const coverY = rooftop.y + rooftop.height - coverHeight;
  const coverSlots: readonly CoverSlot[] = [
    {
      id: 'left_cover',
      label: '左側預留掩體',
      x: movementMargin + width * 0.08,
      y: coverY,
      width: coverWidth,
      height: coverHeight,
      depth: Depths.cover
    },
    {
      id: 'right_cover',
      label: '右側預留掩體',
      x: width - movementMargin - width * 0.18,
      y: coverY,
      width: coverWidth,
      height: coverHeight,
      depth: Depths.cover
    }
  ];

  return {
    width,
    height,
    zones: [skyline, alley, rooftop],
    parallaxLayers: [
      {
        id: 'far',
        label: '遠景',
        scrollFactor: 0.18,
        depth: Depths.backgroundFar,
        color: 0x253047,
        ...rect(0, 0, width, skyline.height)
      },
      {
        id: 'mid',
        label: '中景',
        scrollFactor: 0.42,
        depth: Depths.backgroundMid,
        color: 0x31566b,
        ...rect(0, skyline.height * 0.32, width, skyline.height * 0.9)
      },
      {
        id: 'near',
        label: '近景',
        scrollFactor: 0.72,
        depth: Depths.backgroundNear,
        color: 0x4f8fba,
        ...rect(0, skyline.height * 0.68, width, skyline.height * 0.58)
      }
    ],
    lanes,
    rooftop: {
      ...rect(movementMargin, rooftop.y + rooftop.height * 0.22, width - movementMargin * 2, rooftop.height * 0.72),
      minX: movementMargin,
      maxX: width - movementMargin,
      playerBaselineY: rooftop.y + rooftop.height * 0.58,
      coverSlots
    },
    parallaxBaseSpeed: 18,
    debugStep: 80
  };
}

export function getZone(layout: WorldLayout, id: VerticalZoneId): VerticalZone {
  const zone = layout.zones.find((candidate) => candidate.id === id);
  if (!zone) {
    throw new Error(`Unknown zone: ${id}`);
  }
  return zone;
}

export function getLane(layout: WorldLayout, id: LaneId): Lane {
  const lane = layout.lanes.find((candidate) => candidate.id === id);
  if (!lane) {
    throw new Error(`Unknown lane: ${id}`);
  }
  return lane;
}

function rect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height };
}

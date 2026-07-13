export type GameConfig = {
  readonly title: string;
  readonly version: string;
  readonly width: number;
  readonly height: number;
  readonly backgroundColor: string;
  readonly parent: string;
  readonly debug: boolean;
};

export const GAME_CONFIG: GameConfig = {
  title: '屎命必達',
  version: '0.1.0',
  width: 1280,
  height: 720,
  backgroundColor: '#171923',
  parent: 'app',
  debug: import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true'
};

export function getAspectRatio(config: Pick<GameConfig, 'width' | 'height'>): number {
  return config.width / config.height;
}

export function isSupportedAspectRatio(config: Pick<GameConfig, 'width' | 'height'>): boolean {
  return Math.abs(getAspectRatio(config) - 16 / 9) < 0.001;
}


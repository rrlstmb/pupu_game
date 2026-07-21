export type EnvironmentSkinDefinition = {
  readonly id: string;
  readonly profiles: readonly string[];
  readonly sky: number;
  readonly skyline: number;
  readonly wall: number;
  readonly road: number;
  readonly rooftop: number;
  readonly accent: number;
  readonly atmosphere: 'clear' | 'rush' | 'rain' | 'market' | 'wind' | 'cleanup' | 'alley' | 'live' | 'security' | 'boss';
};

export const ENVIRONMENT_SKINS: readonly EnvironmentSkinDefinition[] = [
  { id: 'day', profiles: ['clear_day'], sky: 0x8bd3dd, skyline: 0x335c67, wall: 0xd8e2dc, road: 0x50545b, rooftop: 0x343a40, accent: 0xffd166, atmosphere: 'clear' },
  { id: 'rush', profiles: ['evening_rush'], sky: 0xf4a261, skyline: 0x6d597a, wall: 0xe9c46a, road: 0x4a4e69, rooftop: 0x343a40, accent: 0xe76f51, atmosphere: 'rush' },
  { id: 'rain', profiles: ['rainy_day'], sky: 0x718096, skyline: 0x334155, wall: 0x64748b, road: 0x26313f, rooftop: 0x1f2937, accent: 0x38bdf8, atmosphere: 'rain' },
  { id: 'market', profiles: ['market_dusk'], sky: 0xf59e0b, skyline: 0x7c2d12, wall: 0xfde68a, road: 0x57534e, rooftop: 0x3f3f46, accent: 0xef4444, atmosphere: 'market' },
  { id: 'wind', profiles: ['windy_afternoon'], sky: 0x7dd3fc, skyline: 0x475569, wall: 0xcbd5e1, road: 0x475569, rooftop: 0x334155, accent: 0xfacc15, atmosphere: 'wind' },
  { id: 'cleanup', profiles: ['cleanup_day'], sky: 0xa7f3d0, skyline: 0x166534, wall: 0xecfccb, road: 0x52525b, rooftop: 0x3f3f46, accent: 0x22c55e, atmosphere: 'cleanup' },
  { id: 'alley', profiles: ['residential_alley'], sky: 0xfda4af, skyline: 0x7f1d1d, wall: 0xfef3c7, road: 0x44403c, rooftop: 0x292524, accent: 0xfb7185, atmosphere: 'alley' },
  { id: 'live', profiles: ['live_event'], sky: 0xc4b5fd, skyline: 0x4c1d95, wall: 0xf5d0fe, road: 0x312e81, rooftop: 0x1e1b4b, accent: 0x22d3ee, atmosphere: 'live' },
  { id: 'security', profiles: ['security_night'], sky: 0x172554, skyline: 0x020617, wall: 0x1e293b, road: 0x111827, rooftop: 0x0f172a, accent: 0xfacc15, atmosphere: 'security' },
  { id: 'boss', profiles: ['clean_city_boss', 'clean_city'], sky: 0xf0abfc, skyline: 0x701a75, wall: 0xfdf4ff, road: 0x3f3f46, rooftop: 0x18181b, accent: 0xfacc15, atmosphere: 'boss' }
];

export function environmentSkinFor(profile: string): EnvironmentSkinDefinition {
  return ENVIRONMENT_SKINS.find((skin) => skin.profiles.includes(profile)) ?? ENVIRONMENT_SKINS[0];
}

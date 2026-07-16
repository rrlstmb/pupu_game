export type Interval = { readonly start: number; readonly end: number };
export type FinalEncounterSafetySnapshot = {
  readonly playerMovementBounds: Interval;
  readonly playerX: number;
  readonly blockedIntervals: readonly Interval[];
  readonly dangerIntervals: readonly Interval[];
  readonly coverIntervals: readonly Interval[];
  readonly bossReachableHitIntervals: readonly Interval[];
  readonly minimumReachableWidth: number;
  readonly minimumSafeWidth: number;
  readonly minimumThrowPositionWidth: number;
  readonly minimumBossHitPositionWidth: number;
};
export type FinalEncounterSafetyResult = {
  readonly allowed: boolean;
  readonly reachableIntervals: readonly Interval[];
  readonly safeIntervals: readonly Interval[];
  readonly throwIntervals: readonly Interval[];
  readonly bossHitIntervals: readonly Interval[];
  readonly violations: readonly string[];
  readonly suggestedAction: 'allow' | 'delay' | 'relocate_player' | 'cancel';
  readonly relocationX?: number;
};

export function evaluateFinalEncounterSafety(snapshot: FinalEncounterSafetySnapshot): FinalEncounterSafetyResult {
  const reachable = subtractIntervals([snapshot.playerMovementBounds], snapshot.blockedIntervals);
  const safe = mergeIntervals([
    ...subtractIntervals(reachable, snapshot.dangerIntervals),
    ...intersections(reachable, snapshot.coverIntervals)
  ]);
  const throwIntervals = reachable.filter((interval) => width(interval) >= snapshot.minimumThrowPositionWidth);
  const bossHitIntervals = intersections(throwIntervals, snapshot.bossReachableHitIntervals)
    .filter((interval) => width(interval) >= snapshot.minimumBossHitPositionWidth);
  const violations: string[] = [];
  if (!reachable.some((item) => width(item) >= snapshot.minimumReachableWidth)) violations.push('minimum_reachable_width');
  if (!safe.some((item) => width(item) >= snapshot.minimumSafeWidth)) violations.push('minimum_safe_width');
  if (throwIntervals.length === 0) violations.push('minimum_throw_position_width');
  if (bossHitIntervals.length === 0) violations.push('minimum_boss_hit_position_width');
  const playerLegal = reachable.some((item) => snapshot.playerX >= item.start && snapshot.playerX <= item.end);
  const relocationX = playerLegal ? undefined : nearestPoint(snapshot.playerX, reachable);
  if (!playerLegal && relocationX === undefined) violations.push('player_has_no_relocation');
  return {
    allowed: violations.length === 0,
    reachableIntervals: reachable,
    safeIntervals: safe,
    throwIntervals,
    bossHitIntervals,
    violations,
    suggestedAction: violations.length > 0 ? 'delay' : playerLegal ? 'allow' : 'relocate_player',
    relocationX
  };
}

export function subtractIntervals(base: readonly Interval[], blocked: readonly Interval[]): readonly Interval[] {
  let result = [...base];
  for (const block of [...blocked].sort((a, b) => a.start - b.start)) {
    result = result.flatMap((item) => {
      if (block.end <= item.start || block.start >= item.end) return [item];
      return [
        { start: item.start, end: Math.max(item.start, block.start - 1) },
        { start: Math.min(item.end, block.end + 1), end: item.end }
      ].filter((part) => part.end > part.start);
    });
  }
  return result;
}

function intersections(left: readonly Interval[], right: readonly Interval[]): readonly Interval[] {
  return left.flatMap((a) => right.map((b) => ({ start: Math.max(a.start, b.start), end: Math.min(a.end, b.end) })))
    .filter((item) => item.end > item.start);
}

function mergeIntervals(input: readonly Interval[]): readonly Interval[] {
  const sorted = [...input].sort((a, b) => a.start - b.start);
  const result: Interval[] = [];
  for (const item of sorted) {
    const last = result.at(-1);
    if (last && item.start <= last.end) result[result.length - 1] = { start: last.start, end: Math.max(last.end, item.end) };
    else result.push(item);
  }
  return result;
}

function nearestPoint(x: number, intervals: readonly Interval[]): number | undefined {
  return intervals.flatMap((item) => [item.start, item.end])
    .sort((a, b) => Math.abs(a - x) - Math.abs(b - x) || a - b)[0];
}

function width(interval: Interval): number { return interval.end - interval.start; }

export type PresentationLedgerState = {
  readonly processedTokens: readonly string[];
  readonly activeCount: number;
  readonly droppedCount: number;
};

export function createPresentationLedger(): PresentationLedgerState {
  return { processedTokens: [], activeCount: 0, droppedCount: 0 };
}

export function reservePresentationToken(
  state: PresentationLedgerState,
  token: string,
  maxActive: number
): { readonly state: PresentationLedgerState; readonly accepted: boolean } {
  if (state.processedTokens.includes(token)) return { state, accepted: false };
  if (state.activeCount >= maxActive) return { state: { ...state, droppedCount: state.droppedCount + 1 }, accepted: false };
  return {
    accepted: true,
    state: { ...state, processedTokens: [...state.processedTokens, token], activeCount: state.activeCount + 1 }
  };
}

export function releasePresentation(state: PresentationLedgerState): PresentationLedgerState {
  return { ...state, activeCount: Math.max(0, state.activeCount - 1) };
}

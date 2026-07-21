import { describe, expect, it } from 'vitest';
import { createPresentationLedger, releasePresentation, reservePresentationToken } from '../../src/domain/presentation/PresentationLedger';

describe('presentation token ledger', () => {
  it('deduplicates gameplay tokens and bounds active presentation', () => {
    let state = createPresentationLedger();
    const first = reservePresentationToken(state, 'hit:1', 1);
    expect(first.accepted).toBe(true);
    state = first.state;
    expect(reservePresentationToken(state, 'hit:1', 1).accepted).toBe(false);
    const overflow = reservePresentationToken(state, 'hit:2', 1);
    expect(overflow.accepted).toBe(false);
    expect(overflow.state.droppedCount).toBe(1);
    state = releasePresentation(state);
    expect(reservePresentationToken(state, 'hit:2', 1).accepted).toBe(true);
  });
});

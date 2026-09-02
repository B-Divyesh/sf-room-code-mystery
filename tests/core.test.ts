import { describe, expect, it } from 'vitest';
import { caseById, cases } from '../src/cases';
import { clueIndex, createState, makeRoomCode, nextRound, parseRoomCode, ROUND_SECONDS } from '../src/core';

describe('deterministic room core', () => {
  it('encodes case and player count in a five-character code', () => {
    const code = makeRoomCode(8, false, () => 0);
    expect(code).toBe('EAAAA');
    expect(parseRoomCode(code)).toEqual({ code, players: 8, caseId: cases[0].id });
  });

  it('rejects malformed and unsupported codes', () => {
    expect(parseRoomCode('NO')).toBeNull();
    expect(parseRoomCode('ZAAAA')).toBeNull();
    expect(parseRoomCode('A0AAA')).toBeNull();
  });

  it('advances through all three rounds into an accusation', () => {
    let state = createState('CAAAA', cases[0].id, 6, 'host');
    state = nextRound(state);
    expect(state).toMatchObject({ round: 1, phase: 'clue', secondsLeft: ROUND_SECONDS });
    state = nextRound(nextRound(state));
    expect(state.round).toBe(3);
    expect(nextRound(state).phase).toBe('accuse');
  });

  it('assigns a different clue to every active notebook', () => {
    const indexes = Array.from({ length: 8 }, (_, index) => clueIndex('EAAAA', index + 1, 1, 8));
    expect(new Set(indexes).size).toBe(8);
  });

  it('ships 24 authored clues in each case', () => {
    for (const mystery of cases) {
      expect(mystery.clues).toHaveLength(3);
      expect(mystery.clues.flat()).toHaveLength(24);
      expect(caseById(mystery.id).answer).toBeTruthy();
    }
  });
});

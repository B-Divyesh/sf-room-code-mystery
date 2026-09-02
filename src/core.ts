import { cases } from './cases';
import type { GameState } from './types';

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROUND_SECONDS = 180;

export function makeRoomCode(players: number, paid: boolean, random = Math.random): string {
  if (players < 4 || players > 8) throw new Error('Player count must be from 4 to 8.');
  const first = CODE_ALPHABET[(paid ? 5 : 0) + players - 4];
  let suffix = '';
  for (let i = 0; i < 4; i += 1) suffix += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return first + suffix;
}

export function parseRoomCode(raw: string): { code: string; players: number; caseId: string } | null {
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 5) return null;
  const first = CODE_ALPHABET.indexOf(code[0]);
  if (first < 0 || first > 9) return null;
  if ([...code].some((character) => !CODE_ALPHABET.includes(character))) return null;
  const paid = first >= 5;
  return { code, players: (first % 5) + 4, caseId: paid ? cases[1].id : cases[0].id };
}

export function createState(code: string, caseId: string, players: number, role: 'host' | 'player', seat = 1): GameState {
  return { code, caseId, players, role, seat, round: 0, phase: 'lobby', secondsLeft: ROUND_SECONDS, paused: true };
}

export function nextRound(state: GameState): GameState {
  if (state.round < 3) {
    return { ...state, round: (state.round + 1) as 1 | 2 | 3, phase: 'clue', secondsLeft: ROUND_SECONDS, paused: false };
  }
  return { ...state, phase: state.role === 'host' ? 'accuse' : 'reveal', paused: true };
}

export function clueIndex(code: string, seat: number, round: number, total: number): number {
  const seed = [...code].reduce((sum, character) => sum + CODE_ALPHABET.indexOf(character) + 1, 0);
  return (seed + seat - 1 + (round - 1) * 3) % total;
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

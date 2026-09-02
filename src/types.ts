export type Suspect = {
  id: string;
  name: string;
  role: string;
  note: string;
};

export type Clue = {
  title: string;
  text: string;
  detail: string;
  specimen: 'leaf' | 'key' | 'paper' | 'cup' | 'soil' | 'clock' | 'shoe' | 'glass';
};

export type MysteryCase = {
  id: string;
  name: string;
  premise: string;
  missing: string;
  paid: boolean;
  suspects: Suspect[];
  clues: Clue[][];
  answer: string;
  reveal: string;
  replayNote: string;
};

export type GameState = {
  code: string;
  caseId: string;
  players: number;
  seat: number;
  role: 'host' | 'player';
  round: 0 | 1 | 2 | 3;
  phase: 'lobby' | 'clue' | 'accuse' | 'reveal';
  secondsLeft: number;
  paused: boolean;
  accusation?: string;
};

/**
 * Puzzle registry. Each puzzle lives in its own module under src/puzzles/
 * and is loaded on demand. The daily puzzle rotates through this list and
 * is seeded by the date, so everyone gets the same board on the same day.
 */
import { hashString } from '../core/rng.js';
import { keyToDate } from '../core/dates.js';

export const PUZZLES = [
  {
    id: 'lights',
    title: 'Lights Out',
    icon: 'lightbulb',
    hue: 'yellow',
    blurb: 'Switch every light off. Each tap also flips its neighbours.',
    skills: 'Parity · planning',
    load: () => import('./lights.js'),
  },
  {
    id: 'target',
    title: 'Target Number',
    icon: 'calculator',
    hue: 'blue',
    blurb: 'Combine the numbers with + − × ÷ to hit the target exactly.',
    skills: 'Arithmetic · search',
    load: () => import('./target.js'),
  },
  {
    id: 'codebreaker',
    title: 'Code Breaker',
    icon: 'key',
    hue: 'violet',
    blurb: 'Deduce the hidden colour code from the clues after each guess.',
    skills: 'Deduction · elimination',
    load: () => import('./codebreaker.js'),
  },
  {
    id: 'nonogram',
    title: 'Picture Logic',
    icon: 'grid',
    hue: 'teal',
    blurb: 'Fill the grid so every row and column matches its number clues.',
    skills: 'Constraint logic',
    load: () => import('./nonogram.js'),
  },
];

export const getPuzzle = (id) => PUZZLES.find((p) => p.id === id) || null;

/** Which puzzle is "today's", plus the seed for its board. */
export function dailyPuzzleInfo(dayKey) {
  const dayNumber = Math.floor(keyToDate(dayKey).getTime() / 86400000);
  const puzzle = PUZZLES[((dayNumber % PUZZLES.length) + PUZZLES.length) % PUZZLES.length];
  return { ...puzzle, seed: hashString(`daily:${dayKey}:${puzzle.id}`), dayKey };
}

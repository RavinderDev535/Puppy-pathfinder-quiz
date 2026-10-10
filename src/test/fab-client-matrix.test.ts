import { describe, expect, it } from 'vitest';
import workbooks from './fixtures/quiz-workbooks.json';
import { Answers, Owner, requiredBox, singleShelf, Stage } from '@/lib/quiz-lanes/engine';

const cases = workbooks['Fab - Single Box Quiz']['01 Result matrix'].filter(row => typeof row.A === 'string' && row.A.startsWith('FAB-'));
const stages: Record<string, Stage> = { Preparing: 'preparing', 'Due in 7 days': 'due_7', 'Born 0-3 days': 'born_0_3', '1-2 weeks': 'week_1_2', '3+ weeks': 'week_3_plus' };
const experiences: Record<string, string> = { 'First litter': 'first', '1-2 litters': '1_2', '3-5 litters': '3_5', '6+ litters': '6_plus' };

function categoryFor(label: string): string {
  if (label.startsWith('Heat Combo')) return 'heat';
  if (label.startsWith('Gray Pad')) return 'pad';
  if (label.startsWith('Whelping Kit')) return 'kit';
  if (label.startsWith('Corner Seat')) return 'seat';
  if (label.startsWith('Corner Rod')) return 'rod';
  if (label.startsWith('Add-on Room')) return 'room';
  if (label.startsWith('Grommet Pads')) return 'pad';
  if (label.startsWith('Mesh Cover')) return 'cover';
  if (label.startsWith('Stack Kit')) return 'stack';
  throw new Error(`Unmapped client Fab expectation: ${label}`);
}

function expectedCategories(value: string | null | undefined): string[] {
  if (!value || value.startsWith('NONE')) return [];
  return value.split(', ').map(categoryFor).sort();
}

describe('Fab client result matrix', () => {
  it('contains and exercises all 80 configured size/stage/experience cases', () => {
    expect(cases).toHaveLength(80);
    for (const row of cases) {
      const owner: Owner = { system: 'fab', size: row.B as Owner['size'], height: 'standard', windowed: false };
      const answers: Answers = {
        breed: 'not_listed', weight: '', experience: experiences[row.D] || '', stage: stages[row.C],
        jumps: false, windowed: false, date: '2026-10-10', litter: '4_6', email: 'test@example.com',
      };
      const locked = requiredBox(owner);
      expect(locked.map(item => item.category)).toEqual(['box', 'rails']);
      expect(locked.every(item => item.locked && item.selected)).toBe(true);
      const shelf = singleShelf(owner, answers);
      expect(shelf.filter(item => item.selected).map(item => item.category).sort(), row.A).toEqual(expectedCategories(row.F));
      expect(shelf.filter(item => !item.selected).map(item => item.category).sort(), row.A).toEqual(expectedCategories(row.G));
    }
  });
});

import { describe, expect, it } from 'vitest';
import { validDueDate } from '@/lib/quiz-dates';
describe('due date calendar bounds',()=>{
  it('rejects past dates, including typed values',()=>expect(validDueDate('2026-11-01','2026-11-02')).toBe(false));
  it('accepts today and arbitrarily distant future dates',()=>{expect(validDueDate('2026-11-02','2026-11-02')).toBe(true);expect(validDueDate('2099-12-31','2026-11-02')).toBe(true);});
  it('preserves skipping and rejects invalid dates',()=>{expect(validDueDate('')).toBe(true);expect(validDueDate('2027-02-30')).toBe(false);expect(validDueDate('not a date')).toBe(false);});
});

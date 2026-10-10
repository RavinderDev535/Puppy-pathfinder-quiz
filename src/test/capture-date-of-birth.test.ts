import { describe, expect, it } from 'vitest';
import { existingCustomerBoxSteps } from '@/lib/quiz-config';
import { goHomeDateFromDob } from '@/lib/lifecycle-engine';

describe('Capture Date of Birth change request', () => {
  const dueDate = existingCustomerBoxSteps.find(step => step.id === 'dueDate')!;
  const dob = existingCustomerBoxSteps.find(step => step.id === 'dob')!;

  it.each(['preparing', 'due_7'])('asks for due_date only during %s', stage => {
    expect(dueDate.showIf?.({ stage })).toBe(true);
    expect(dob.showIf?.({ stage })).toBe(false);
  });

  it.each(['born_0_3', '1_2_weeks', '3_plus_weeks'])('asks for dob only during %s', stage => {
    expect(dueDate.showIf?.({ stage })).toBe(false);
    expect(dob.showIf?.({ stage })).toBe(true);
  });

  it('calculates go-home day as 56 calendar days after the DOB', () => {
    expect(goHomeDateFromDob('2026-01-01')).toBe('2026-02-26');
  });

  it('rejects malformed DOB values before calculating go-home day', () => {
    expect(() => goHomeDateFromDob('2026-02-30')).toThrow('Choose a valid date of birth.');
  });
});

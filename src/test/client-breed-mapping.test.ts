import { describe, expect, it } from 'vitest';
import mapping from './fixtures/client-breed-mappings.json';
import { breeds, resolveBreed, resolveFab, Size } from '@/lib/quiz-lanes/engine';

describe('client workbook breed mappings', () => {
  it('matches all 177 EZclassic primary and secondary size rows', () => {
    expect(mapping.ezclassic.breeds).toHaveLength(177);
    expect(breeds).toHaveLength(177);
    for (const row of mapping.ezclassic.breeds) {
      expect(resolveBreed(row.name, '')).toEqual(row.sizes as Size[]);
    }
  });

  it('retains all 26 separately flagged breed rows without inventing mappings', () => {
    expect(mapping.ezclassic.additionalBreeds).toHaveLength(26);
    for (const row of mapping.ezclassic.additionalBreeds) {
      expect(breeds.some(breed => breed.name === row.name)).toBe(true);
      expect(resolveBreed(row.name, '')[0]).toBe(row.primary);
    }
  });

  it('matches all 177 Fab breed recommendations', () => {
    expect(mapping.fab.breeds).toHaveLength(177);
    for (const row of mapping.fab.breeds) {
      expect(resolveFab(row.name, '').size).toBe(row.size);
    }
  });

  it('matches both client weight-fallback tables', () => {
    const ezBands: Record<string, string> = { 'Under 16 lbs': 'under_16', '16-40 lbs': '16_40', '40-90 lbs': '40_90', '90+ lbs': '90_plus' };
    for (const row of mapping.ezclassic.weightFallback) {
      expect(resolveBreed('not_listed', ezBands[row.weight])).toEqual([row.size]);
    }
    const fabBands: Record<string, string> = { 'Under 16 lbs': 'under_16', '16-40 lbs': '16_40', '40-90 lbs': '40_90', '90+ lbs': '90_plus' };
    for (const row of mapping.fab.weightFallback) {
      expect(resolveFab('not_listed', fabBands[row.weight]).size).toBe(row.size);
    }
  });
});

import { describe, expect, it } from 'vitest';
import bn from '../../messages/bn.json';
import en from '../../messages/en.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string'
      ? { ...acc, [path]: value }
      : { ...acc, ...flatten(value, path) };
  }, {});
}

const bnFlat = flatten(bn as Tree);
const enFlat = flatten(en as Tree);

describe('messages', () => {
  it('bn and en have the same keys', () => {
    expect(Object.keys(bnFlat).sort()).toEqual(Object.keys(enFlat).sort());
  });

  it('has no empty strings', () => {
    const empty = Object.entries({ ...bnFlat, ...enFlat }).filter(([, v]) => v.trim() === '');
    expect(empty).toEqual([]);
  });

  it('uses the same ICU placeholders in both languages', () => {
    const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    const mismatched = Object.keys(enFlat).filter(
      (k) =>
        JSON.stringify(placeholders(enFlat[k]!)) !== JSON.stringify(placeholders(bnFlat[k] ?? ''))
    );
    expect(mismatched).toEqual([]);
  });
});

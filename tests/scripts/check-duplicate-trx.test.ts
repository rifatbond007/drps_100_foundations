import { describe, expect, it, vi } from 'vitest';

import { groupDuplicateTrx } from '../../scripts/check-duplicate-trx';

const row = (id: string, trxId: string, status = 'PENDING') => ({
  id,
  trxId,
  status,
  userId: 'u',
  createdAt: new Date('2026-01-01'),
});

describe('groupDuplicateTrx', () => {
  it('returns only TrxIDs shared by more than one active row', () => {
    const groups = groupDuplicateTrx([row('a', 'T1'), row('b', 'T1'), row('c', 'T2')]);
    expect(Object.keys(groups)).toEqual(['T1']);
    expect(groups.T1?.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('ignores FAILED and CANCELLED rows', () => {
    const groups = groupDuplicateTrx([
      row('a', 'T1'),
      row('b', 'T1', 'FAILED'),
      row('c', 'T1', 'CANCELLED'),
    ]);
    expect(groups).toEqual({});
  });
});

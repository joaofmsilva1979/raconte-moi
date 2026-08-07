import { initDatabase } from '@/db/database';

describe('initDatabase', () => {
  it('s\'initialise sans erreur', async () => {
    await expect(initDatabase()).resolves.not.toThrow();
  });
});

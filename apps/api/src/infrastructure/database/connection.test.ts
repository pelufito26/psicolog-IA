import { expect, test, vi } from 'vitest';
import type { Pool } from 'pg';
import { databaseConfig, runDatabaseCheck } from './connection.js';

test('configuración ausente no crea una conexión', async () => {
  const factory = vi.fn();
  expect(await runDatabaseCheck({}, factory)).toBe(false);
  expect(factory).not.toHaveBeenCalled();
});
test('TLS verifica certificados y rechaza sustitución desde URL', () => {
  const config = databaseConfig({ DATABASE_URL: 'postgresql://local:fake@localhost/test' });
  expect(config.ssl).toEqual({ rejectUnauthorized: true });
  expect(config.connectionTimeoutMillis).toBe(5000);
  expect(config.max).toBe(2);
  expect(() =>
    databaseConfig({ DATABASE_URL: 'postgresql://local:fake@localhost/test?sslmode=disable' }),
  ).toThrow();
});
test.each(['red', 'timeout'])(
  'fallo de conexión %s cierra pool sin revelar detalles',
  async (reason) => {
    const end = vi.fn().mockResolvedValue(undefined);
    const pool = { connect: vi.fn().mockRejectedValue(new Error(reason)), end } as unknown as Pool;
    expect(
      await runDatabaseCheck(
        { DATABASE_URL: 'postgresql://local:fake@localhost/test' },
        () => pool,
      ),
    ).toBe(false);
    expect(end).toHaveBeenCalledOnce();
  },
);
test('rechaza cuenta privilegiada y libera recursos', async () => {
  const query = vi.fn().mockResolvedValue({
    rows: [{ superuser: true, bypass: true, creator: true, name: 'postgres' }],
  });
  const release = vi.fn();
  const end = vi.fn().mockResolvedValue(undefined);
  const pool = { connect: vi.fn().mockResolvedValue({ query, release }), end } as unknown as Pool;
  expect(
    await runDatabaseCheck({ DATABASE_URL: 'postgresql://local:fake@localhost/test' }, () => pool),
  ).toBe(false);
  expect(query).toHaveBeenCalledWith('ROLLBACK');
  expect(release).toHaveBeenCalled();
  expect(end).toHaveBeenCalledOnce();
});

test('un fallo de SQL revierte la transacción y no confirma éxito', async () => {
  const query = vi.fn().mockImplementation(async (sql: string) => {
    if (sql.startsWith('select rolsuper'))
      return {
        rows: [
          {
            superuser: false,
            bypass: false,
            creator: false,
            createdb: false,
            replication: false,
            member: true,
            owner: false,
            name: 'test_restringido',
          },
        ],
      };
    if (sql === 'SELECT 1') throw new Error('fallo interno que no se imprime');
    return { rows: [] };
  });
  const release = vi.fn();
  const end = vi.fn().mockResolvedValue(undefined);
  const pool = { connect: vi.fn().mockResolvedValue({ query, release }), end } as unknown as Pool;
  expect(
    await runDatabaseCheck({ DATABASE_URL: 'postgresql://local:fake@localhost/test' }, () => pool),
  ).toBe(false);
  expect(query).toHaveBeenCalledWith('BEGIN');
  expect(query).toHaveBeenCalledWith('ROLLBACK');
  expect(release).toHaveBeenCalledWith(false);
  expect(end).toHaveBeenCalledOnce();
});

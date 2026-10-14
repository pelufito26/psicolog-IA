import { afterEach, expect, test } from 'vitest';
import type { Server } from 'node:http';
import { createApp } from './app.js';

let server: Server | undefined;
afterEach(async () => {
  if (server)
    await new Promise<void>((resolve, reject) =>
      server!.close((error) => (error ? reject(error) : resolve())),
    );
});
test('health responde por HTTP sin datos personales', async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server!.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Puerto ausente');
  const response = await fetch(`http://127.0.0.1:${address.port}/api/health`);
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('application/json');
  expect(await response.json()).toEqual({ status: 'ok' });
});

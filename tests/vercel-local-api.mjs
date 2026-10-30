import assert from 'node:assert/strict';
import test from 'node:test';
import {spawn} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {createClient} from '@libsql/client';

test('Next.js production server + libSQL: local order and admin flows', async t => {
  assert.equal(process.env.VERCEL, undefined, 'This test must never run against Vercel.');
  const directory = await mkdtemp(join(tmpdir(), 'kika-api-test-'));
  const url = `file:${join(directory, 'orders.db')}`;
  const client = createClient({url});
  await client.execute(await readFile(new URL('../drizzle/0000_normal_boom_boom.sql', import.meta.url), 'utf8'));
  client.close();
  const socket = createServer();
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const admin = randomUUID();
  let server;
  const start = async () => {
    server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
      cwd: process.cwd(),
      env: {...process.env, TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: '', ADMIN_TOKEN: admin, NODE_ENV: 'production'},
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    for (let attempt = 0; attempt < 120; attempt++) {
      try { if ((await fetch(base)).ok) return; } catch {}
      if (server.exitCode !== null) throw new Error('Local Next.js server exited.');
      await delay(250);
    }
    throw new Error('Local Next.js server did not start.');
  };
  const stop = async () => {
    if (!server || server.exitCode !== null) return;
    const exited = new Promise(resolve => server.once('exit', resolve));
    server.kill('SIGTERM');
    await exited;
  };
  const order = {
    id: randomUUID(), token: randomUUID(), customer: 'Teste local Kika', phone: '11999999999',
    fulfillment: 'entrega', zone: 1, address: 'Rua de Teste, 100',
    items: [{id: 'frango', qty: 2, size: 'G', side: 'Legumes', extras: ['ovo'], unit: 1}],
  };
  const post = body => fetch(`${base}/api/orders`, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
  const lookup = token => fetch(`${base}/api/orders?id=${order.id}`, {headers: {'x-order-token': token}});
  const authorization = {authorization: `Bearer ${admin}`};
  try {
    await start();
    await t.test('serves branded page and dish assets', async () => {
      assert.match(await (await fetch(base)).text(), /Delícias da Kika/);
      assert.equal((await fetch(`${base}/brand/kika-logo.webp`)).status, 200);
      assert.equal((await fetch(`${base}/brand/kika-cozinha.webp`)).status, 200);
    });
    await t.test('server calculates R$68.80 and never marks payment paid', async () => {
      const response = await post(order);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {id: order.id, total: 6880, status: 'recebido', payment: 'não cobrado'});
    });
    await t.test('same request is idempotent', async () => assert.equal((await post(order)).status, 200));
    await t.test('conflicting request is rejected', async () => assert.equal((await post({...order, customer: 'Outro nome'})).status, 409));
    await t.test('private lookup requires the correct order token', async () => {
      assert.equal((await lookup('wrong')).status, 404);
      assert.equal((await lookup('')).status, 404);
    });
    await t.test('lookup returns totals without exposing order secrets', async () => {
      const response = await lookup(order.token);
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.total, 6880);
      assert.equal(result.fee, 800);
      assert.equal(result.token, undefined);
      assert.equal(result.requestHash, undefined);
    });
    await t.test('delivery address and quantity validation remain enforced', async () => {
      assert.equal((await post({...order, id: randomUUID(), address: ''})).status, 400);
      assert.equal((await post({...order, id: randomUUID(), items: [{...order.items[0], qty: -1}]})).status, 400);
    });
    await t.test('unauthorized admin reads and writes are denied', async () => {
      assert.equal((await fetch(`${base}/api/admin`)).status, 401);
      assert.equal((await fetch(`${base}/api/admin`, {method: 'PATCH', headers: {'content-type': 'application/json'}, body: '{}'})).status, 401);
    });
    await t.test('authorized admin sees exactly one persisted order', async () => {
      const result = await (await fetch(`${base}/api/admin`, {headers: authorization})).json();
      assert.equal(result.length, 1);
      assert.equal(result[0].id, order.id);
    });
    await t.test('admin rejects invalid states and can update valid states', async () => {
      const patch = status => fetch(`${base}/api/admin`, {method: 'PATCH', headers: {...authorization, 'content-type': 'application/json'}, body: JSON.stringify({id: order.id, status})});
      assert.equal((await patch('inválido')).status, 400);
      assert.equal((await patch('em preparo')).status, 200);
      assert.equal((await (await lookup(order.token)).json()).status, 'em preparo');
    });
    await t.test('order survives a full server restart', async () => {
      await stop();
      await start();
      const result = await (await lookup(order.token)).json();
      assert.equal(result.id, order.id);
      assert.equal(result.status, 'em preparo');
      assert.equal(result.total, 6880);
    });
  } finally {
    await stop();
    await rm(directory, {recursive: true, force: true});
  }
});

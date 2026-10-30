import assert from 'node:assert/strict';
import test from 'node:test';
import {createClient} from '@libsql/client';
import {ensureKikaSchema} from '../scripts/db/kika-schema.mjs';

test('initializes only an empty database with the existing SQLite schema', async () => {
  const client = createClient({url: ':memory:'});
  try {
    await assert.rejects(ensureKikaSchema(client), /ausente/);
    assert.deepEqual(await ensureKikaSchema(client, {initializeEmpty: true}), {initialized: true, columns: 13});
    assert.deepEqual(await ensureKikaSchema(client, {initializeEmpty: true}), {initialized: false, columns: 13});
    await client.execute("INSERT INTO orders(id,token,request_hash,customer,phone,fulfillment,address,items,total,fee,created_at) VALUES ('local','test','hash','Teste','11999999999','retirada','','[]',1234,0,'test')");
    await ensureKikaSchema(client);
    assert.equal((await client.execute('SELECT total FROM orders')).rows[0].total, 1234);
  } finally { client.close(); }
});

test('refuses an unrelated database and leaves its tables untouched', async () => {
  const client = createClient({url: ':memory:'});
  try {
    await client.execute('CREATE TABLE unrelated (id INTEGER)');
    await assert.rejects(ensureKikaSchema(client, {initializeEmpty: true}), /fora do escopo/);
    assert.deepEqual((await client.execute("SELECT name FROM sqlite_master WHERE type='table'")).rows.map(row => row.name), ['unrelated']);
  } finally { client.close(); }
});

test('refuses an incompatible orders table without altering its data', async () => {
  const client = createClient({url: ':memory:'});
  try {
    await client.execute('CREATE TABLE orders (id TEXT, total INTEGER)');
    await client.execute("INSERT INTO orders VALUES ('preserve', 900)");
    await assert.rejects(ensureKikaSchema(client, {initializeEmpty: true}), /incompatível/);
    assert.equal((await client.execute('SELECT total FROM orders')).rows[0].total, 900);
    assert.equal((await client.execute('PRAGMA table_info(orders)')).rows.length, 2);
  } finally { client.close(); }
});

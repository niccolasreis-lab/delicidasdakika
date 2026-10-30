import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {isApprovedKikaHost} from '../scripts/db/turso-target.mjs';

test('approved destination accepts only the project brand spellings on Turso', () => {
  for (const spelling of ['delicias-da-kika', 'deliciasdakika', 'delicidasdakika']) {
    assert.equal(isApprovedKikaHost(`${spelling}-test.turso.io`), true);
    assert.equal(isApprovedKikaHost(`${spelling}.turso.io`), true);
  }
  for (const host of ['unrelated.turso.io', 'deliciasdakika-test.example.com', 'deliciasdakika-test.turso.io.example.com', 'deliciasdakikaother.turso.io']) {
    assert.equal(isApprovedKikaHost(host), false);
  }
});

for (const [name, url, stage] of [
  ['missing configuration', '', 'configuration'],
  ['malformed URL', 'invalid-private-url', 'url_format'],
  ['insecure protocol', 'http://delicias-da-kika-test.turso.io', 'secure_protocol'],
  ['different database', 'libsql://unrelated-private-database.turso.io', 'approved_kika_destination'],
]) {
  test(`database check rejects ${name} without exposing credentials or connecting`, () => {
    const token = 'synthetic-private-token-for-local-test';
    const result = spawnSync(process.execPath, ['scripts/db/ensure-turso.mjs', '--initialize-empty-kika'], {
      cwd: process.cwd(), encoding: 'utf8',
      env: {...process.env, TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: token},
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, new RegExp(`stage=${stage};`));
    assert.ok(!result.stderr.includes(token));
    if (url) assert.ok(!result.stderr.includes(url));
    assert.equal(result.stdout, '');
  });
}

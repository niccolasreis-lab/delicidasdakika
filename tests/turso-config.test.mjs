import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {isApprovedKikaHost} from '../scripts/db/turso-target.mjs';

test('approved destination is limited to the verified Kika resource name or ID', () => {
  for (const stem of ['database-bisque-cushion', '01a18a7d-cd01-7479-b1a8-b1d3b8e180ca']) {
    assert.equal(isApprovedKikaHost(`${stem}-test.turso.io`), true);
    assert.equal(isApprovedKikaHost(`${stem}.turso.io`), true);
  }
  for (const host of ['unrelated.turso.io', 'deliciasdakika-test.turso.io', 'database-bisque-cushion-test.example.com', 'database-bisque-cushion-test.turso.io.example.com', 'database-bisque-cushionother.turso.io', '01a18a7d-cd01-7479-b1a8-other.turso.io']) {
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

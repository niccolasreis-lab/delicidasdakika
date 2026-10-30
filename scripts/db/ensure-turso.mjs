import {createClient} from '@libsql/client/web';
import {ensureKikaSchema} from './kika-schema.mjs';
import {isApprovedKikaHost} from './turso-target.mjs';
import {ensureAdminSchema} from './admin-schema.mjs';

// Only the new, explicitly approved Kika database may be initialized.
// Never print the URL, token, environment, or raw provider errors.
let client;
let stage = 'configuration';
try {
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) throw new Error('missing_configuration');
  stage = 'url_format';
  const url = new URL(process.env.TURSO_DATABASE_URL);
  stage = 'secure_protocol';
  if (!['libsql:', 'https:'].includes(url.protocol)) throw new Error('insecure_protocol');
  stage = 'approved_kika_destination';
  if (!isApprovedKikaHost(url.hostname)) throw new Error('unapproved_destination');
  stage = 'connection_and_schema';
  client = createClient({url: url.href, authToken: process.env.TURSO_AUTH_TOKEN});
  const result = await ensureKikaSchema(client, {
    initializeEmpty: process.argv.includes('--initialize-empty-kika'),
  });
  console.log(`Kika database: connection and ${result.columns}-column schema verified; initialized=${result.initialized}.`);
  if(process.argv.includes('--initialize-admin')){
    if(!process.env.BETTER_AUTH_SECRET||process.env.BETTER_AUTH_SECRET.length<32||process.env.BETTER_AUTH_URL!=='https://delicias-da-kika.vercel.app')throw new Error('Configure autenticação e origem antes da migração.');
    stage='admin_schema';
    const admin=await ensureAdminSchema(client,{initialize:true,passwordHash:process.env.KIKA_ADMIN_PASSWORD_HASH});
    console.log(`Kika admin schema verified: ${admin.tables} tables.`);
  }
} catch (error) {
  // Only fixed stages and documented provider codes may enter build logs.
  const safeCodes = ['UNAUTHORIZED', 'AUTH_FAILED', 'SERVER_ERROR', 'SQLITE_ERROR', 'SQLITE_BUSY', 'URL_INVALID', 'FETCH_FAILED'];
  const code = safeCodes.includes(error?.code) ? error.code : 'CHECK_FAILED';
  console.error(`Kika database verification failed: stage=${stage}; code=${code}. Confirm the new Kika database and server configuration. No existing tables are changed by this check.`);
  process.exitCode = 1;
} finally {
  client?.close();
}

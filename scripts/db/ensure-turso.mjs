import {createClient} from '@libsql/client/web';
import {ensureKikaSchema} from './kika-schema.mjs';

// Only the new, explicitly approved Kika database may be initialized.
// Never print the URL, token, environment, or raw provider errors.
let client;
try {
  const url = new URL(process.env.TURSO_DATABASE_URL || '');
  if (!['libsql:', 'https:'].includes(url.protocol) ||
      !url.hostname.endsWith('.turso.io') ||
      !url.hostname.startsWith('delicias-da-kika-') ||
      !process.env.TURSO_AUTH_TOKEN) {
    throw new Error('Configuração do banco não corresponde ao destino aprovado.');
  }
  client = createClient({url: url.href, authToken: process.env.TURSO_AUTH_TOKEN});
  const result = await ensureKikaSchema(client, {
    initializeEmpty: process.argv.includes('--initialize-empty-kika'),
  });
  console.log(`Kika database: connection and ${result.columns}-column schema verified; initialized=${result.initialized}.`);
} catch {
  console.error('Kika database verification failed. Confirm the new Kika database, server credentials and compatible schema. No existing tables are changed by this check.');
  process.exitCode = 1;
} finally {
  client?.close();
}

import {readFile} from 'node:fs/promises';

const columns = [
  ['id', 'TEXT', 1, 1, null],
  ['token', 'TEXT', 1, 0, null],
  ['request_hash', 'TEXT', 1, 0, null],
  ['customer', 'TEXT', 1, 0, null],
  ['phone', 'TEXT', 1, 0, null],
  ['fulfillment', 'TEXT', 1, 0, null],
  ['address', 'TEXT', 1, 0, null],
  ['items', 'TEXT', 1, 0, null],
  ['total', 'INTEGER', 1, 0, null],
  ['fee', 'INTEGER', 1, 0, null],
  ['status', 'TEXT', 1, 0, "'recebido'"],
  ['payment', 'TEXT', 1, 0, "'não cobrado'"],
  ['created_at', 'TEXT', 1, 0, null],
];

export async function ensureKikaSchema(client, {initializeEmpty = false} = {}) {
  const tx = await client.transaction(initializeEmpty ? 'write' : 'read');
  try {
    const tables = await tx.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'");
    const names = tables.rows.map(row => row.name);
    if (names.some(name => name !== 'orders' && name !== '__drizzle_migrations')) {
      throw new Error('Banco contém tabelas fora do escopo da Kika; nenhuma alteração realizada.');
    }
    let initialized = false;
    if (!names.includes('orders')) {
      if (!initializeEmpty || names.length) throw new Error('Schema de pedidos ausente.');
      const sql = await readFile(new URL('../../drizzle/0000_normal_boom_boom.sql', import.meta.url), 'utf8');
      await tx.execute(sql);
      initialized = true;
    }
    const result = await tx.execute('PRAGMA table_info(orders)');
    const actual = result.rows.map(row => [row.name, row.type.toUpperCase(), Number(row.notnull), Number(row.pk), row.dflt_value]);
    if (JSON.stringify(actual) !== JSON.stringify(columns)) {
      throw new Error('Schema incompatível; nenhuma tabela existente foi modificada.');
    }
    await tx.commit();
    return {initialized, columns: actual.length};
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}

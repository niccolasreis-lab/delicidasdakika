import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

function createDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || (process.env.VERCEL && !authToken)) {
    throw new Error("Configure o banco de pedidos no servidor.");
  }
  if (process.env.VERCEL && !/^(libsql|https):\/\//.test(url)) {
    throw new Error("O banco de pedidos precisa de uma conexão remota segura.");
  }

  return drizzle(createClient({ url, authToken }), { schema });
}

let db: ReturnType<typeof createDb> | undefined;

// Initialization stays inside the request; a build never needs database secrets.
export function getDb() {
  return (db ??= createDb());
}

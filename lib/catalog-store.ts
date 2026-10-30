import {getDb} from '../db';
import {catalog} from '../db/admin-schema';
import {eq} from 'drizzle-orm';
import {catalogSchema,defaultCatalog} from './catalog-model';
export async function readCatalog(){const [row]=await getDb().select().from(catalog).where(eq(catalog.id,'main'));return {catalog:row?catalogSchema.parse(JSON.parse(row.document)):defaultCatalog,revision:row?.revision??0}}

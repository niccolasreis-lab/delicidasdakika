import {readCatalog} from '../../../lib/catalog-store';
import {operation,productAvailable} from '../../../lib/catalog-model';
import {getDb} from '../../../db';
import {stockFor} from '../../../lib/pdv-engine.mjs';
export const dynamic='force-dynamic';
export async function GET(){try{const {catalog}=await readCatalog();const status=operation(catalog);const inventory:Record<string,Record<string,number>>={};if(!catalog.store.demo)for(const row of await stockFor(getDb().$client,status.date)){(inventory[String(row.product_id)]??={})[String(row.size)]=Number(row.quantity);}return Response.json({catalog:{...catalog,menu:catalog.menu.filter(p=>productAvailable(p,status.date,status.weekday))},status,inventory},{headers:{'cache-control':'no-store'}})}catch{return Response.json({error:'Cardápio temporariamente indisponível.'},{status:503})}}

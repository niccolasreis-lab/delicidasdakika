import {readCatalog} from '../../../lib/catalog-store';
import {operation,productAvailable} from '../../../lib/catalog-model';
export const dynamic='force-dynamic';
export async function GET(){try{const {catalog}=await readCatalog();const status=operation(catalog);return Response.json({catalog:{...catalog,menu:catalog.menu.filter(p=>productAvailable(p,status.date,status.weekday))},status},{headers:{'cache-control':'no-store'}})}catch{return Response.json({error:'Cardápio temporariamente indisponível.'},{status:503})}}

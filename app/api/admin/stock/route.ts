import {pdvErrorMessage} from '../../../../lib/pdv-errors';
import {z} from 'zod';
import {isOwner,sameOrigin} from '../../../../lib/auth';
import {getDb} from '../../../../db';
import {readCatalog} from '../../../../lib/catalog-store';
import {setStock,stockFor} from '../../../../lib/pdv-engine.mjs';
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(s+'T12:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===s});
const body=z.object({date,productId:z.string().max(80),size:z.enum(['P','M','G']),quantity:z.number().int().min(0).max(10000),version:z.number().int().min(-1)});
export async function GET(r:Request){if(!await isOwner(r))return Response.json({error:'Acesso negado.'},{status:401});try{return Response.json(await stockFor(getDb().$client,date.parse(new URL(r.url).searchParams.get('date'))),{headers:{'cache-control':'no-store'}})}catch{return Response.json({error:'Não foi possível carregar o estoque.'},{status:400})}}
export async function PUT(r:Request){
 if(!await isOwner(r))return Response.json({error:'Acesso negado.'},{status:401});if(!sameOrigin(r))return Response.json({error:'Origem inválida.'},{status:403});
 try{const raw=await r.text();if(raw.length>2000)throw Error('Requisição inválida.');const b=body.parse(JSON.parse(raw)),{catalog}=await readCatalog(),p=catalog.menu.find(x=>x.id===b.productId);if(!p||(!['Marmitas','Prato do dia'].includes(p.category)&&b.size!=='P'))throw Error('Produto ou tamanho inválido.');await setStock(getDb().$client,b);return Response.json({ok:true});}catch(e){return Response.json({error:pdvErrorMessage(e)},{status:409})}
}

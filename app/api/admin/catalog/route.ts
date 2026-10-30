import {isOwner,sameOrigin} from '../../../../lib/auth';
import {readCatalog} from '../../../../lib/catalog-store';
import {catalogSchema} from '../../../../lib/catalog-model';
import {getDb} from '../../../../db';
import {catalog} from '../../../../db/admin-schema';
import {and,eq} from 'drizzle-orm';
export async function GET(r:Request){if(!await isOwner(r))return Response.json({error:'Acesso negado.'},{status:401});return Response.json(await readCatalog(),{headers:{'cache-control':'no-store'}})}
export async function PUT(r:Request){
 if(!await isOwner(r))return Response.json({error:'Acesso negado.'},{status:401});
 if(!sameOrigin(r))return Response.json({error:'Origem inválida.'},{status:403});
 try{const raw=await r.text();if(raw.length>200000)return Response.json({error:'Configuração muito grande.'},{status:413});const body=JSON.parse(raw);const parsed=catalogSchema.safeParse(body.catalog);if(!parsed.success)return Response.json({error:parsed.error.issues[0]?.message||'Confira os campos.'},{status:400});
 if(!Number.isInteger(body.revision))return Response.json({error:'Revisão inválida.'},{status:400});
 const rows=await getDb().update(catalog).set({document:JSON.stringify(parsed.data),revision:body.revision+1,updatedAt:new Date().toISOString()}).where(and(eq(catalog.id,'main'),eq(catalog.revision,body.revision))).returning({revision:catalog.revision});
 if(!rows.length)return Response.json({error:'O cardápio mudou em outra tela. Recarregue antes de salvar.'},{status:409});return Response.json({catalog:parsed.data,revision:rows[0].revision});
 }catch{return Response.json({error:'Não foi possível salvar. Confira os campos.'},{status:400})}
}

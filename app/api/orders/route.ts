import {getDb} from '../../../db';
import {orders} from '../../../db/schema';
import {eq,and} from 'drizzle-orm';
import {quoteWithCatalog,zones as legacyZones} from '../../../lib/menu';
import {readCatalog} from '../../../lib/catalog-store';
import {assertOrderAvailable} from '../../../lib/catalog-model';
import {sameOrderIntent,intentHash} from '../../../lib/order-intent';
export async function POST(req:Request){
 try{
  const raw=await req.text();if(raw.length>20000)return Response.json({error:'Pedido muito grande.'},{status:413});
  const b=JSON.parse(raw);if(!/^[a-f0-9-]{36}$/.test(b.id)||typeof b.token!=='string'||b.token.length!==36)throw Error('Identificador inválido.');
  const customer=String(b.customer||'').trim(),phone=String(b.phone||'').replace(/\D/g,''),address=String(b.address||'').trim();
  if(customer.length<2||customer.length>100||!/^\d{10,13}$/.test(phone)||(b.fulfillment==='entrega'&&(address.length<8||address.length>500)))throw Error('Confira nome, telefone e endereço.');
  const db=getDb();const intent={...b,customer,phone,address};
  const response=async(saved:typeof orders.$inferSelect)=>{
   if(saved.token!==b.token||!sameOrderIntent(saved,intent)||(!saved.requestHash.startsWith('intent-v1:')&&saved.fulfillment==='entrega'&&legacyZones[b.zone]?.fee!==saved.fee)||(saved.requestHash.startsWith('intent-v1:')&&saved.requestHash!==await intentHash(JSON.parse(saved.items),intent)))return Response.json({error:'Este identificador pertence a outro pedido.'},{status:409});
   return Response.json({id:saved.id,total:saved.total,status:saved.status,payment:saved.payment});
  };
  const [existing]=await db.select().from(orders).where(eq(orders.id,b.id));if(existing)return response(existing);
  const {catalog}=await readCatalog();
  const q=quoteWithCatalog(b.items,b.fulfillment,b.zone,catalog);
  assertOrderAvailable(catalog,b.items,b.fulfillment);
  if(b.expectedTotal!==undefined&&b.expectedTotal!==q.total)return Response.json({error:'O cardápio foi atualizado. Revise o valor antes de confirmar.',code:'PRICE_CHANGED'},{status:409});
  const hash=await intentHash(q.items,intent);
  await db.insert(orders).values({id:b.id,token:b.token,requestHash:hash,customer,phone,address,fulfillment:b.fulfillment,items:JSON.stringify(q.items),total:q.total,fee:q.fee,status:'recebido',payment:'não cobrado',createdAt:new Date().toISOString()}).onConflictDoNothing();
  const [saved]=await db.select().from(orders).where(eq(orders.id,b.id));return response(saved);
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Falha no pedido.'},{status:400})}
}
export async function GET(req:Request){const u=new URL(req.url);const [order]=await getDb().select().from(orders).where(and(eq(orders.id,u.searchParams.get('id')||''),eq(orders.token,req.headers.get('x-order-token')||'')));if(!order)return Response.json({error:'Pedido não encontrado.'},{status:404});return Response.json({...order,token:undefined,requestHash:undefined})}

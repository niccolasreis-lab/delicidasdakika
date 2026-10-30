import {getDb} from '../../../db';
import {orders} from '../../../db/schema';
import {desc,eq} from 'drizzle-orm';
function allowed(r:Request){const token=process.env.ADMIN_TOKEN;return token&&r.headers.get('authorization')===`Bearer ${token}`;}
export async function GET(r:Request){if(!allowed(r))return Response.json({error:'Configure a chave administrativa no servidor e informe-a para entrar.'},{status:401});return Response.json(await getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(100));}
export async function PATCH(r:Request){if(!allowed(r))return Response.json({error:'Acesso negado.'},{status:401});const b=await r.json() as any;if(!['recebido','em preparo','pronto','saiu para entrega','concluído','cancelado'].includes(b.status))return Response.json({error:'Status inválido'},{status:400});await getDb().update(orders).set({status:b.status}).where(eq(orders.id,b.id));return Response.json({ok:true});}

import {isOwner,sameOrigin} from '../../../lib/auth';
import {getDb} from '../../../db';
import {orders} from '../../../db/schema';
import {desc,eq} from 'drizzle-orm';
function legacy(r:Request){const token=process.env.ADMIN_TOKEN;return token&&r.headers.get('authorization')===`Bearer ${token}`;}
async function allowed(r:Request){return !!legacy(r)||await isOwner(r)}
export async function GET(r:Request){if(!await allowed(r))return Response.json({error:'Configure a chave administrativa no servidor e informe-a para entrar.'},{status:401});return Response.json(await getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(100));}
export async function PATCH(r:Request){if(!await allowed(r))return Response.json({error:'Acesso negado.'},{status:401});if(!legacy(r)&&!sameOrigin(r))return Response.json({error:'Origem inválida.'},{status:403});const b=await r.json() as any;if(!['recebido','em preparo','pronto','saiu para entrega','concluído','cancelado'].includes(b.status))return Response.json({error:'Status inválido'},{status:400});await getDb().update(orders).set({status:b.status}).where(eq(orders.id,b.id));return Response.json({ok:true});}

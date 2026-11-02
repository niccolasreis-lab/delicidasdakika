import {pdvErrorMessage} from '../../../../lib/pdv-errors';
import {isOwner,sameOrigin} from '../../../../lib/auth';
import {getDb} from '../../../../db';
import {saleInput,createSale} from '../../../../lib/sales';
import {saleAction} from '../../../../lib/pdv-engine.mjs';
export async function POST(r:Request){
 if(!await isOwner(r))return Response.json({error:'Acesso negado.'},{status:401});
 if(!sameOrigin(r))return Response.json({error:'Origem inválida.'},{status:403});
 try{const raw=await r.text();if(raw.length>20000)throw Error('Pedido muito grande.');const input=saleInput.parse(JSON.parse(raw));if(input.source==='site')throw Error('Selecione balcão ou WhatsApp.');return Response.json(await createSale(input,true));}catch(e){return Response.json({error:pdvErrorMessage(e)},{status:409})}
}
export async function PATCH(r:Request){
 if(!await isOwner(r))return Response.json({error:'Acesso negado.'},{status:401});
 if(!sameOrigin(r))return Response.json({error:'Origem inválida.'},{status:403});
 try{const raw=await r.text();if(raw.length>2000)throw Error('Requisição inválida.');const b=JSON.parse(raw);if(typeof b.id!=='string'||!Number.isInteger(b.version)||b.version<0||typeof b.action!=='string'||(b.returnStock!==undefined&&typeof b.returnStock!=='boolean'))throw Error('Ação inválida.');return Response.json(await saleAction(getDb().$client,{...b,owner:true}));}catch(e){return Response.json({error:pdvErrorMessage(e)},{status:409})}
}

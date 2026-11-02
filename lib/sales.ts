import {createHash} from 'node:crypto';
import {z} from 'zod';
import {getDb} from '../db';
import {catalogSchema,operation,assertOrderAvailable,assertSlot} from './catalog-model';
import {quoteWithCatalog} from './menu';
import {recordSale,PdvError} from './pdv-engine.mjs';
const line=z.object({id:z.string().max(80),qty:z.number().int().min(1).max(20),size:z.enum(['P','M','G']),side:z.string().max(50),extras:z.array(z.string().max(80)).max(2),note:z.string().max(300).default('')});
export const saleInput=z.object({id:z.string().uuid(),token:z.string().uuid(),customer:z.string().trim().min(2).max(100),phone:z.string().regex(/^(?:\d{10,13})?$/),address:z.string().trim().max(500).default(''),fulfillment:z.enum(['entrega','retirada']),zone:z.number().int().min(0).max(19),items:z.array(line).min(1).max(30),slot:z.string().regex(/^(?:\d{2}:\d{2}-\d{2}:\d{2})?$/).default(''),method:z.enum(['dinheiro','cartao','pix_manual']),paid:z.boolean().default(false),source:z.enum(['site','balcao','whatsapp']).default('site'),expectedTotal:z.number().int().nonnegative()});
export type SaleInput=z.infer<typeof saleInput>;
export async function createSale(input:SaleInput,owner=false){
 if((!owner||input.source==='whatsapp')&&!/^\d{10,13}$/.test(input.phone))throw new PdvError('Informe o telefone com DDD.');
 if(!owner&&(input.paid||input.source!=='site'||input.method==='pix_manual'))throw new PdvError('Forma de pagamento indisponível.');
 if(input.fulfillment==='entrega'&&input.address.length<8)throw new PdvError('Informe o endereço completo.');
 // The price acknowledgement is excluded from identity; retries preserve the saved total.
 const {expectedTotal,...intent}=input;
 const hash='sale-v1:'+createHash('sha256').update(JSON.stringify(intent)).digest('hex');
 return recordSale(getDb().$client,{...input,hash},(document:unknown)=>{
  const c=catalogSchema.parse(document),s=operation(c);
  if(!owner&&c.store.demo)throw new PdvError('Pedidos reais ainda não estão ativados.');
  let q;try{assertOrderAvailable(c,input.items,input.fulfillment);assertSlot(c,input.fulfillment,input.slot);q=quoteWithCatalog(input.items,input.fulfillment,input.zone,c);}catch(e){throw new PdvError(e instanceof Error?e.message:'Confira o pedido.');}
  if(q.total!==expectedTotal)throw new PdvError('O preço mudou. Revise o total antes de confirmar.');
  return {...q,date:s.date,slot:input.slot};
 });
}

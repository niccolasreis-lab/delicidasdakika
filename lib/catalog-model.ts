import {z} from 'zod';
import initial from './default-catalog.json' with {type:'json'};
const cents=z.number().int().min(0).max(1000000);
const day=z.object({open:z.boolean(),start:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),end:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),delivery:z.boolean(),pickup:z.boolean()}).refine(d=>!d.open||(d.start<d.end&&(d.delivery||d.pickup)),{message:'Informe horários válidos e ao menos uma modalidade.'});
const dateKey=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(s+'T12:00:00Z');return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===s});
export const catalogSchema=z.object({
 menu:z.array(z.object({id:z.string().regex(/^[a-z0-9-]{1,80}$/),name:z.string().trim().min(2).max(100),description:z.string().max(600),price:cents,category:z.enum(['Marmitas','Prato do dia','Extras','Bebidas']),icon:z.string().max(12).default('🍱'),color:z.string().regex(/^#[a-fA-F0-9]{6}$/).default('#e8b66b'),tag:z.string().max(50),active:z.boolean(),mediumExtra:cents,largeExtra:cents,image:z.string().regex(/^\/(images\/[a-z0-9-]+(?:-480)?\.webp|api\/media\/[a-f0-9-]{36})$/),photoLabel:z.enum(['Foto ilustrativa','Foto do prato']),days:z.array(z.number().int().min(0).max(6)).max(7),dates:z.record(dateKey,z.boolean())})).max(100).refine(items=>new Set(items.map(p=>p.id)).size===items.length,{message:'Produtos duplicados.'}),
 extras:z.array(z.object({id:z.string().regex(/^[a-z0-9-]{1,80}$/),name:z.string().min(1).max(80),price:cents})).max(20),
 zones:z.array(z.object({name:z.string().min(1).max(120),fee:cents})).min(1).max(20),
 store:z.object({paused:z.boolean(),weekly:z.array(day).length(7),exceptions:z.record(dateKey,day),notice:z.string().max(160),address:z.string().max(500),leadTime:z.string().max(80),demo:z.boolean()})
});
export type Catalog=z.infer<typeof catalogSchema>;
export type Product=Catalog['menu'][number];
export const defaultCatalog:Catalog=catalogSchema.parse(initial);
export function localDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
export function operation(c:Catalog,now=new Date()){
 const date=localDate(now),weekday=new Date(date+'T12:00:00Z').getUTCDay();
 const time=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);
 const schedule=c.store.exceptions[date]??c.store.weekly[weekday];
 return {...schedule,date,weekday,isOpen:!c.store.paused&&schedule.open&&time>=schedule.start&&time<schedule.end};
}
export function productAvailable(p:Product,date:string,weekday:number){return p.active&&(p.dates[date]??p.days.includes(weekday))}
export function assertOrderAvailable(c:Catalog,lines:{id:string}[],fulfillment:string,now=new Date()){
 const status=operation(c,now);
 if(!status.isOpen)throw new Error('Estamos fora do horário de atendimento.');
 if((fulfillment==='entrega'&&!status.delivery)||(fulfillment==='retirada'&&!status.pickup))throw new Error('Esta modalidade não está disponível agora.');
 for(const line of lines){const p=c.menu.find(p=>p.id===line.id);if(!p||!productAvailable(p,status.date,status.weekday))throw new Error('Um prato do carrinho não está disponível. Atualize seu pedido.');}
}

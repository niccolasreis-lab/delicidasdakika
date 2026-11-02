import {readFile} from 'node:fs/promises';
const expected={kika_stock:['date','product_id','size','quantity','version'],kika_sale:['order_id','date','slot','source','method','payment_state','stock_returned','revision','created_at'],kika_sale_event:['id','order_id','action','created_at']};
export async function ensurePdvSchema(client,{initialize=false}={}){
 const tx=await client.transaction(initialize?'write':'read');
 try{
  if(initialize){const sql=await readFile(new URL('../../drizzle/0002_kika_pdv.sql',import.meta.url),'utf8');for(const s of sql.split(';').map(s=>s.trim()).filter(Boolean))await tx.execute(s);}
  for(const [table,cols] of Object.entries(expected)){const actual=await tx.execute(`PRAGMA table_info(${table})`);if(JSON.stringify(actual.rows.map(x=>x.name))!==JSON.stringify(cols))throw Error('Schema do PDV incompatível.');}
  await tx.commit();return {tables:3};
 }catch(e){await tx.rollback();throw e}finally{tx.close()}
}

export class PdvError extends Error {}
// Business operations use one SQLite write transaction. No gateway is simulated here.
export async function stockFor(client,date){return (await client.execute({sql:'SELECT * FROM kika_stock WHERE date=? ORDER BY product_id,size',args:[date]})).rows;}
export async function setStock(client,{date,productId,size,quantity,version}){
 const tx=await client.transaction('write');try{
  const found=await tx.execute({sql:'SELECT version FROM kika_stock WHERE date=? AND product_id=? AND size=?',args:[date,productId,size]});
  if(found.rows.length){if(found.rows[0].version!==version)throw new PdvError('O estoque mudou. Atualize antes de salvar.');await tx.execute({sql:'UPDATE kika_stock SET quantity=?,version=version+1 WHERE date=? AND product_id=? AND size=?',args:[quantity,date,productId,size]});}
  else {if(version!==-1)throw new PdvError('O estoque mudou. Atualize antes de salvar.');await tx.execute({sql:'INSERT INTO kika_stock(date,product_id,size,quantity) VALUES(?,?,?,?)',args:[date,productId,size,quantity]});}
  await event(tx,`stock:${date}:${productId}:${size}`,`available=${quantity}`);
  await tx.commit();
 }catch(e){await tx.rollback();throw e}finally{tx.close()}
}
export async function recordSale(client,input,prepare){
 const tx=await client.transaction('write');try{
  const old=await tx.execute({sql:'SELECT * FROM orders WHERE id=?',args:[input.id]});
  if(old.rows.length){const o=old.rows[0];if(o.token!==input.token||o.request_hash!==input.hash)throw new PdvError('Este identificador pertence a outro pedido.');await tx.commit();return {id:o.id,total:o.total,status:o.status,payment:o.payment};}
  const row=await tx.execute("SELECT document FROM kika_catalog WHERE id='main'");if(!row.rows.length)throw new PdvError('Cardápio indisponível.');
  const q=await prepare(JSON.parse(row.rows[0].document));
  const amounts=new Map();for(const l of q.items){const key=JSON.stringify([l.id,l.size]);amounts.set(key,(amounts.get(key)??0)+l.qty);}
  for(const [key,qty] of amounts){const [product,size]=JSON.parse(key);const r=await tx.execute({sql:'UPDATE kika_stock SET quantity=quantity-?,version=version+1 WHERE date=? AND product_id=? AND size=? AND quantity>=?',args:[qty,q.date,product,size,qty]});if(r.rowsAffected!==1)throw new PdvError('Estoque insuficiente para um dos itens. Atualize o pedido.');}
  const payment=input.paid?'recebido manualmente':'pagar no recebimento',state=input.paid?'paid_manual':'due',now=new Date().toISOString();
  await tx.execute({sql:'INSERT INTO orders(id,token,request_hash,customer,phone,fulfillment,address,items,total,fee,status,payment,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',args:[input.id,input.token,input.hash,input.customer,input.phone,input.fulfillment,input.address,JSON.stringify(q.items),q.total,q.fee,'recebido',payment,now]});
  await tx.execute({sql:'INSERT INTO kika_sale(order_id,date,slot,source,method,payment_state,created_at) VALUES(?,?,?,?,?,?,?)',args:[input.id,q.date,q.slot,input.source,input.method,state,now]});
  await event(tx,input.id,'created:'+input.source+':'+state);
  await tx.commit();return {id:input.id,total:q.total,status:'recebido',payment};
 }catch(e){await tx.rollback();throw e}finally{tx.close()}
}
async function event(tx,id,action){await tx.execute({sql:'INSERT INTO kika_sale_event(order_id,action,created_at) VALUES(?,?,?)',args:[id,action,new Date().toISOString()]});}
/** @param {import('@libsql/client').Client} client @param {{id:string,action:string,version:number,returnStock?:boolean,token?:string,owner?:boolean,status?:string}} options */
export async function saleAction(client,{id,action,version,returnStock=false,token=undefined,owner=false,status=undefined}){
 const tx=await client.transaction('write');try{
  const rows=await tx.execute({sql:'SELECT o.*,s.date,s.payment_state,s.stock_returned,s.revision,s.method FROM orders o JOIN kika_sale s ON s.order_id=o.id WHERE o.id=?',args:[id]});const o=rows.rows[0];
  if(!o||(!owner&&o.token!==token))throw new PdvError('Pedido não encontrado.');
  if(o.revision!==version)throw new PdvError('O pedido mudou. Atualize antes de continuar.');
  let next=o.status,payment=o.payment_state,restore=false;
  const terminal=['cancelado','não compareceu'];
  if(action==='cancel'){
   if(o.status!=='recebido')throw new PdvError('O preparo já começou ou o pedido foi encerrado. Fale com a Kika.');
   next='cancelado';restore=true;if(payment==='paid_manual')payment='refund_pending';
  }else if(owner&&action==='no_show'){
   if(!['recebido','em preparo','pronto'].includes(o.status)||payment!=='due'||o.fulfillment!=='retirada')throw new PdvError('Esta ação é apenas para retirada não paga e ainda não concluída.');
   next='não compareceu';restore=returnStock;
  }else if(owner&&action==='receive'){
   if(payment!=='due'||terminal.includes(o.status))throw new PdvError('Este pagamento não pode ser registrado.');payment='paid_manual';
  }else if(owner&&action==='refund'){
   if(payment!=='refund_pending')throw new PdvError('Não existe reembolso pendente.');payment='refunded_manual';
  }else if(owner&&action==='status'){
   const transitions={'recebido':['em preparo'],'em preparo':['pronto'],'pronto':o.fulfillment==='entrega'?['saiu para entrega']:['concluído'],'saiu para entrega':['concluído']};
   if(!(transitions[o.status]??[]).includes(status))throw new PdvError('Mudança de preparo inválida.');
   if(status==='concluído'&&payment==='due')throw new PdvError('Registre o recebimento antes de concluir.');next=status;
  }else throw new PdvError('Ação inválida.');
  if(restore&&!o.stock_returned){for(const l of JSON.parse(o.items)){await tx.execute({sql:'UPDATE kika_stock SET quantity=quantity+?,version=version+1 WHERE date=? AND product_id=? AND size=?',args:[l.qty,o.date,l.id,l.size]});}}
  const label={due:'pagar no recebimento',paid_manual:'recebido manualmente',refund_pending:'reembolso pendente',refunded_manual:'reembolso confirmado manualmente'}[payment];
  await tx.execute({sql:'UPDATE orders SET status=?,payment=? WHERE id=?',args:[next,label,id]});
  await tx.execute({sql:'UPDATE kika_sale SET payment_state=?,stock_returned=?,revision=revision+1 WHERE order_id=?',args:[payment,restore||o.stock_returned?1:0,id]});
  await event(tx,id,action+':'+next+':'+payment+(action==='no_show'?':returnStock='+returnStock:''));
  await tx.commit();return {ok:true};
 }catch(e){await tx.rollback();throw e}finally{tx.close()}
}

type Item={id:string;qty:number;size:string;side:string;extras:string[];note:string};
export async function intentHash(items:Item[],body:{customer:string;phone:string;address:string;fulfillment:string;zone:number}){
 const normalized={items:items.map(({id,qty,size,side,extras,note})=>({id,qty,size,side,extras,note})),customer:body.customer,phone:body.phone,address:body.address,fulfillment:body.fulfillment,zone:body.fulfillment==='entrega'?body.zone:0};
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(normalized)));
 return 'intent-v1:'+Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
}
export function sameOrderIntent(saved:{customer:string;phone:string;address:string;fulfillment:string;items:string},body:{customer:string;phone:string;address:string;fulfillment:string;items:Item[]}){
 if(saved.customer!==body.customer||saved.phone!==body.phone||saved.address!==body.address||saved.fulfillment!==body.fulfillment||!Array.isArray(body.items))return false;
 const original:Item[]=JSON.parse(saved.items);if(original.length!==body.items.length)return false;
 return original.every((line,index)=>{const incoming=body.items[index];return incoming&&line.id===incoming.id&&line.qty===incoming.qty&&line.size===(line.side?incoming.size:'P')&&line.side===(line.side?incoming.side:'')&&line.note===String(incoming.note||'').slice(0,300)&&JSON.stringify(line.extras)===JSON.stringify(incoming.extras??[])});
}

import {isOwner,sameOrigin} from '../../../../lib/auth';
import {getDb} from '../../../../db';
import {media} from '../../../../db/admin-schema';
import sharp from 'sharp';
import {gte,sql} from 'drizzle-orm';
export async function POST(r:Request){
 if(!await isOwner(r))return Response.json({error:'Acesso negado.'},{status:401});
 if(!sameOrigin(r))return Response.json({error:'Origem inválida.'},{status:403});
 if(!['image/jpeg','image/png','image/webp'].includes(r.headers.get('content-type')||'')||Number(r.headers.get('content-length')||0)>3000000)return Response.json({error:'Envie JPG, PNG ou WebP de até 3 MB.'},{status:400});
 try{
  const [recent]=await getDb().select({count:sql<number>`count(*)`}).from(media).where(gte(media.createdAt,new Date(Date.now()-60000).toISOString()));
  if(recent.count>=10)return Response.json({error:'Aguarde um minuto antes de enviar mais fotos.'},{status:429});
  const reader=r.body?.getReader();if(!reader)return Response.json({error:'Envie uma foto.'},{status:400});
  const chunks:Uint8Array[]=[];let length=0;
  for(;;){const result=await reader.read();if(result.done)break;length+=result.value.length;if(length>3000000){await reader.cancel();return Response.json({error:'Foto muito grande.'},{status:413})}chunks.push(result.value)}
  const input=Buffer.concat(chunks);
  const supported=(input[0]===255&&input[1]===216&&input[2]===255)||input.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||(input.toString('ascii',0,4)==='RIFF'&&input.toString('ascii',8,12)==='WEBP');
  if(!supported)return Response.json({error:'Envie uma foto JPG, PNG ou WebP válida.'},{status:400});
  const data=await sharp(input,{limitInputPixels:40000000}).rotate().resize({width:1400,height:1400,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();const id=crypto.randomUUID();await getDb().insert(media).values({id,data,createdAt:new Date().toISOString()});return Response.json({image:'/api/media/'+id});
 }catch{return Response.json({error:'Não foi possível processar essa foto.'},{status:400})}
}

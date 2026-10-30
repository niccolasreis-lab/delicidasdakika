import {getDb} from '../../../../db';
import {media} from '../../../../db/admin-schema';
import {eq} from 'drizzle-orm';
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;if(!/^[a-f0-9-]{36}$/.test(id))return new Response(null,{status:404});const [row]=await getDb().select({data:media.data}).from(media).where(eq(media.id,id));if(!row)return new Response(null,{status:404});return new Response(new Uint8Array(row.data),{headers:{'content-type':'image/webp','cache-control':'public,max-age=31536000,s-maxage=31536000,immutable','x-content-type-options':'nosniff'}})}

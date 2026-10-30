import {getAuth} from '../../../../lib/auth';
const allowed=new Set(['/get-session','/sign-in/username','/sign-out','/change-password','/ok']);
async function handle(request:Request){const path=new URL(request.url).pathname.replace(/^\/api\/auth/,'');if(!allowed.has(path))return Response.json({error:'Não encontrado.'},{status:404});return getAuth().handler(request)}
export const GET=handle;
export const POST=handle;

import {betterAuth} from 'better-auth';
import {drizzleAdapter} from '@better-auth/drizzle-adapter';
import {username} from 'better-auth/plugins/username';
import {nextCookies} from 'better-auth/next-js';
import {getDb} from '../db';
import * as schema from '../db/admin-schema';

let instance:ReturnType<typeof createAuth>|undefined;
function createAuth(){
 if(!process.env.BETTER_AUTH_SECRET)throw new Error('Autenticação ainda não configurada.');
 return betterAuth({database:drizzleAdapter(getDb(),{provider:'sqlite',schema}),secret:process.env.BETTER_AUTH_SECRET,baseURL:process.env.BETTER_AUTH_URL,
  emailAndPassword:{enabled:true,disableSignUp:true,minPasswordLength:10},
  disabledPaths:['/sign-up/email','/delete-user','/change-email','/is-username-available','/update-user'],
  rateLimit:{enabled:true,storage:'database',window:60,max:20,customRules:{'/sign-in/username':{window:60,max:5}}},
  session:{expiresIn:60*60*12,updateAge:60*30},
  plugins:[username({immutableUsername:true}),nextCookies()]
 });
}
export function getAuth(){return instance??=createAuth()}
export async function isOwner(request:Request){try{const s=await getAuth().api.getSession({headers:request.headers});return s?.user.id==='kika-owner';}catch{return false}}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !!origin&&[new URL(request.url).origin,process.env.BETTER_AUTH_URL].filter(Boolean).includes(origin)}

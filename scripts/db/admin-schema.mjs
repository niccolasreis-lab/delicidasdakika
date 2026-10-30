import {readFile} from 'node:fs/promises';
const expected={kika_user:['id','name','email','email_verified','image','created_at','updated_at','username','display_username'],kika_session:['id','expires_at','token','created_at','updated_at','ip_address','user_agent','user_id'],kika_account:['id','account_id','provider_id','user_id','access_token','refresh_token','id_token','access_token_expires_at','refresh_token_expires_at','scope','password','created_at','updated_at'],kika_verification:['id','identifier','value','expires_at','created_at','updated_at'],kika_rate_limit:['id','key','count','last_request'],kika_catalog:['id','document','revision','updated_at'],kika_media:['id','data','created_at']};
export async function ensureAdminSchema(client,{initialize=false,passwordHash}={}){
 const tx=await client.transaction(initialize?'write':'read');
 try{
  if(initialize){const sql=await readFile(new URL('../../drizzle/0001_kika_admin.sql',import.meta.url),'utf8');for(const statement of sql.split(';').map(s=>s.trim()).filter(Boolean))await tx.execute(statement);}
  for(const [table,columns] of Object.entries(expected)){const result=await tx.execute(`PRAGMA table_info(${table})`);if(JSON.stringify(result.rows.map(r=>r.name))!==JSON.stringify(columns))throw new Error('Schema administrativo incompatível.');}
  if(initialize){
   const document=await readFile(new URL('../../lib/default-catalog.json',import.meta.url),'utf8');
   await tx.execute({sql:'INSERT INTO kika_catalog(id,document,revision,updated_at) VALUES (?,?,0,?) ON CONFLICT(id) DO NOTHING',args:['main',document,new Date().toISOString()]});
   const owner=await tx.execute("SELECT id FROM kika_user WHERE id='kika-owner'");
   if(!owner.rows.length){
    if(!passwordHash||!/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(passwordHash))throw new Error('Defina o hash inicial da conta antes da migração.');
    const now=Date.now();
    await tx.execute({sql:'INSERT INTO kika_user(id,name,email,email_verified,created_at,updated_at,username,display_username) VALUES (?,?,?,0,?,?,?,?)',args:['kika-owner','Dona Kika','owner@kika.invalid',now,now,'adminkika','adminkika']});
    await tx.execute({sql:'INSERT INTO kika_account(id,account_id,provider_id,user_id,password,created_at,updated_at) VALUES (?,?,?,?,?,?,?)',args:['kika-owner-credential','kika-owner','credential','kika-owner',passwordHash,now,now]});
   }
  }
  await tx.commit();return {tables:Object.keys(expected).length};
 }catch(error){await tx.rollback();throw error}finally{tx.close()}
}

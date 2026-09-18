import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import type { RowDataPacket } from 'mysql2';

export type Role = 'admin' | 'rep';
type LocalUser = RowDataPacket & { id:string; full_name:string; email:string; password_hash:string; role:Role; is_active:0|1 };
const cookieName='autolustre_local_session';
const secret=process.env.LOCAL_AUTH_SECRET ?? 'development-only-secret';
const sign=(value:string)=>createHmac('sha256',secret).update(value).digest('base64url');
export function makeSession(user:{id:string;role:Role;full_name:string;email?:string}) { const value=Buffer.from(JSON.stringify({...user,exp:Date.now()+1000*60*60*12})).toString('base64url'); return `${value}.${sign(value)}`; }
export function readSession(raw:string|undefined): {id:string;role:Role;full_name:string;email?:string}|null { if(!raw)return null; const [value,signature]=raw.split('.'); if(!value||!signature)return null; const expected=sign(value); if(signature.length!==expected.length||!timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null; try { const payload=JSON.parse(Buffer.from(value,'base64url').toString()) as {id:string;role:Role;full_name:string;email?:string;exp:number}; return payload.exp>Date.now()?payload:null; } catch { return null; } }
export async function authenticate(email:string,password:string) { const [rows]=await db.query<LocalUser[]>('SELECT id,full_name,email,password_hash,role,is_active FROM users WHERE email=? LIMIT 1',[email.toLowerCase().trim()]); const user=rows[0]; if(!user||!user.is_active||!(await bcrypt.compare(password,user.password_hash)))return null; return user; }
export async function currentUser(): Promise<{id:string;role:Role;full_name:string;email:string;is_active?:number}|null> {
  const store=await cookies();
  const session=readSession(store.get(cookieName)?.value);
  if(!session) return null;
  try {
    const [rows]=await db.query<LocalUser[]>('SELECT id,full_name,email,role,is_active FROM users WHERE id=? LIMIT 1',[session.id]);
    const u=rows[0];
    if(!u||!u.is_active) return null;
    return { id:u.id, role:u.role, full_name:u.full_name, email:u.email, is_active:u.is_active };
  } catch (err) {
    console.error('Error fetching live DB user in currentUser:', err);
    return { id:session.id, role:session.role, full_name:session.full_name, email:session.email || '' };
  }
}
export async function requireRole(role:Role) { const user=await currentUser(); if(!user||user.role!==role)redirect(`/login?next=/portal/${role}`); return user; }
export const sessionCookie={name:cookieName,options:{httpOnly:true,sameSite:'lax' as const,secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*12}};

import { requireRole } from '@/lib/auth/local';export default async function RepLayout({children}:{children:React.ReactNode}){await requireRole('rep');return children;}

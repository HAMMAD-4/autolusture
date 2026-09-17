import { requireRole } from '@/lib/auth/local';export default async function AdminLayout({children}:{children:React.ReactNode}){await requireRole('admin');return children;}

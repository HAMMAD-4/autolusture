import { currentUser } from '@/lib/auth/local';
import { redirect } from 'next/navigation';
import { AdminLoginForm } from './admin-login-form';

export const metadata = {
  title: 'Admin Portal Login | AutoLustre',
  description: 'Administrative portal sign-in for studio management and service operations.'
};

export default async function AdminPage() {
  const user = await currentUser();
  if (user?.role === 'admin') {
    redirect('/portal/admin');
  }
  return <AdminLoginForm />;
}

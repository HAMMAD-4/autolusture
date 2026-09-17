import { currentUser } from '@/lib/auth/local';
import { redirect } from 'next/navigation';
import { RepLoginForm } from './rep-login-form';

export const metadata = {
  title: 'Rep Portal Login | AutoLustre',
  description: 'Field representative sign-in for active bookings, camera capture, and customer arrival.'
};

export default async function RepPage() {
  const user = await currentUser();
  if (user?.role === 'rep') {
    redirect('/portal/rep');
  }
  return <RepLoginForm />;
}

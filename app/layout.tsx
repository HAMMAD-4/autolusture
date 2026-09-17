import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AutoLustre | Premium vehicle detailing',
  description: 'Meticulous vehicle detailing, wherever the road takes you.',
  alternates: { languages: { 'en-AU': '/' } }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-AU"><body>{children}</body></html>;
}

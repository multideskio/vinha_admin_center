import { redirect } from 'next/navigation';

export default function Home() {
  // TODO: Add authentication and redirect to the correct dashboard based on user role.
  // For now, redirecting to the admin dashboard.
  redirect('/dashboard');
  return null;
}

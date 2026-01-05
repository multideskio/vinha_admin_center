import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to the login page by default.
  // Authentication flow will handle redirects to appropriate dashboards.
  redirect('/auth/login')
  return null
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from './AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail || !user || user.email !== adminEmail) {
    redirect('/admin/login')
  }

  return (
    <AdminSidebar email={user.email!}>
      {children}
    </AdminSidebar>
  )
}

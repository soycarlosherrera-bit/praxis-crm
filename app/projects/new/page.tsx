import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewProjectForm from './form'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <NewProjectForm userId={user.id} />
}

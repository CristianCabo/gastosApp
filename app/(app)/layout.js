import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { NavShell } from './nav-shell';

export default async function AppLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, currency, theme, active_household_id')
    .eq('id', user.id)
    .single();

  return (
    <NavShell userName={profile?.name || user.email} theme={profile?.theme || 'auto'}>
      {children}
    </NavShell>
  );
}

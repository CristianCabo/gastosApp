import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('name, currency, theme, active_household_id')
    .eq('id', user.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let household = null;
  if (profile.active_household_id) {
    const { data: h } = await supabase
      .from('households')
      .select('id, name, invite_code')
      .eq('id', profile.active_household_id)
      .single();
    household = h;
  }

  const { count: memberCount } = await supabase
    .from('household_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('household_id', profile.active_household_id);

  return NextResponse.json({ data: { ...profile, email: user.email, household, memberCount: memberCount || 1 } });
}

export async function PUT(request) {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 422 });

  const patch = { updated_at: new Date().toISOString() };
  if (body.currency) patch.currency = body.currency;
  if (body.theme) patch.theme = body.theme;
  if (body.name !== undefined) patch.name = body.name;

  const { data, error } = await supabase.from('profiles').update(patch).eq('id', user.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

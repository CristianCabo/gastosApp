import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// POST /api/household/join  { code: "AB12CD" }
// Suma al usuario actual como miembro de un hogar existente
// (usando su código de invitación) y lo vuelve su hogar activo,
// para que empiece a ver y cargar los mismos gastos que la otra
// persona.
export async function POST(request) {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const code = body && body.code ? String(body.code).trim().toUpperCase() : '';
  if (!code) return NextResponse.json({ error: 'Ingresá un código de invitación.' }, { status: 422 });

  const { data: household, error: hError } = await supabase
    .from('households')
    .select('id, name')
    .eq('invite_code', code)
    .single();

  if (hError || !household) return NextResponse.json({ error: 'No encontramos un hogar con ese código.' }, { status: 404 });

  const { error: joinError } = await supabase
    .from('household_members')
    .upsert({ household_id: household.id, user_id: user.id, role: 'member' }, { onConflict: 'household_id,user_id' });

  if (joinError) return NextResponse.json({ error: joinError.message }, { status: 400 });

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ active_household_id: household.id })
    .eq('id', user.id);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });

  return NextResponse.json({ data: household });
}

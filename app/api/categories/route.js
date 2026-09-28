import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/auth-context';

export async function GET() {
  const ctx = await getRequestContext();
  if (ctx.error) return NextResponse.json({ error: ctx.error.message }, { status: ctx.error.status });
  const { supabase, householdId } = ctx;

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', householdId)
    .order('name', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function POST(request) {
  const ctx = await getRequestContext();
  if (ctx.error) return NextResponse.json({ error: ctx.error.message }, { status: ctx.error.status });
  const { supabase, householdId } = ctx;

  const body = await request.json().catch(() => null);
  if (!body || !body.name || !body.name.trim()) {
    return NextResponse.json({ error: 'El nombre de la categoría es obligatorio.' }, { status: 422 });
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      household_id: householdId,
      name: body.name.trim().slice(0, 40),
      color: body.color || '#7A7A70',
      icon: body.icon || '✳️',
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

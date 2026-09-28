import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/auth-context';

export async function PUT(request, { params }) {
  const ctx = await getRequestContext();
  if (ctx.error) return NextResponse.json({ error: ctx.error.message }, { status: ctx.error.status });
  const { supabase, householdId } = ctx;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 422 });

  const patch = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) patch.name = body.name.trim().slice(0, 40);
  if (body.color !== undefined) patch.color = body.color;
  if (body.icon !== undefined) patch.icon = body.icon;
  if (body.isActive !== undefined) patch.is_active = !!body.isActive;

  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('household_id', householdId)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

// Si la categoría ya tiene gastos asociados no se borra: se
// desactiva. Solo se elimina físicamente si nunca se usó.
export async function DELETE(request, { params }) {
  const ctx = await getRequestContext();
  if (ctx.error) return NextResponse.json({ error: ctx.error.message }, { status: ctx.error.status });
  const { supabase, householdId } = ctx;

  const { count, error: countError } = await supabase
    .from('expenses')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .eq('category_id', params.id);

  if (countError) return NextResponse.json({ error: countError.message }, { status: 400 });

  if (count > 0) {
    const { data, error } = await supabase
      .from('categories')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('household_id', householdId)
      .eq('id', params.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ data, deactivated: true });
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('household_id', householdId)
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, deleted: true });
}

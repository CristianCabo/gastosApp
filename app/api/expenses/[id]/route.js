import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/auth-context';
import { validateExpense } from '../route';

export async function GET(request, { params }) {
  const ctx = await getRequestContext();
  if (ctx.error) return NextResponse.json({ error: ctx.error.message }, { status: ctx.error.status });
  const { supabase, householdId } = ctx;

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('household_id', householdId)
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: 'Gasto no encontrado.' }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PUT(request, { params }) {
  const ctx = await getRequestContext();
  if (ctx.error) return NextResponse.json({ error: ctx.error.message }, { status: ctx.error.status });
  const { supabase, householdId } = ctx;

  const body = await request.json().catch(() => null);
  const validation = validateExpense(body);
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: 422 });

  const { data, error } = await supabase
    .from('expenses')
    .update({
      category_id: body.categoryId,
      amount_cents: validation.amountCents,
      description: (body.description || '').slice(0, 200),
      date: body.date,
      payment_method: body.paymentMethod || '',
      notes: (body.notes || '').slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq('household_id', householdId)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function DELETE(request, { params }) {
  const ctx = await getRequestContext();
  if (ctx.error) return NextResponse.json({ error: ctx.error.message }, { status: ctx.error.status });
  const { supabase, householdId } = ctx;

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('household_id', householdId)
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

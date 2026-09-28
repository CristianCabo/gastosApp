import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/auth-context';

// GET /api/expenses?from=2026-09-01&to=2026-09-30&category=id1,id2
//     &minAmount=1000&maxAmount=100000&paymentMethod=Efectivo,Tarjeta
//     &search=texto&sort=date_desc&page=1&pageSize=100
export async function GET(request) {
  const ctx = await getRequestContext();
  if (ctx.error) return NextResponse.json({ error: ctx.error.message }, { status: ctx.error.status });
  const { supabase, householdId } = ctx;

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const category = searchParams.get('category');
  const minAmount = searchParams.get('minAmount');
  const maxAmount = searchParams.get('maxAmount');
  const paymentMethod = searchParams.get('paymentMethod');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'date_desc';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '100', 10)));

  let query = supabase
    .from('expenses')
    .select('*', { count: 'exact' })
    .eq('household_id', householdId);

  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);
  if (category) query = query.in('category_id', category.split(',').filter(Boolean));
  if (minAmount) query = query.gte('amount_cents', Math.round(parseFloat(minAmount) * 100));
  if (maxAmount) query = query.lte('amount_cents', Math.round(parseFloat(maxAmount) * 100));
  if (paymentMethod) query = query.in('payment_method', paymentMethod.split(',').filter(Boolean));
  if (search) query = query.or(`description.ilike.%${search}%,notes.ilike.%${search}%`);

  const sortMap = {
    date_desc: ['date', { ascending: false }],
    date_asc: ['date', { ascending: true }],
    amount_desc: ['amount_cents', { ascending: false }],
    amount_asc: ['amount_cents', { ascending: true }],
  };
  const [sortCol, sortOpts] = sortMap[sort] || sortMap.date_desc;
  query = query.order(sortCol, sortOpts).order('created_at', { ascending: false });

  query = query.range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data, count, page, pageSize });
}

// POST /api/expenses
export async function POST(request) {
  const ctx = await getRequestContext();
  if (ctx.error) return NextResponse.json({ error: ctx.error.message }, { status: ctx.error.status });
  const { supabase, user, householdId } = ctx;

  const body = await request.json().catch(() => null);
  const validation = validateExpense(body);
  if (validation.error) return NextResponse.json({ error: validation.error }, { status: 422 });

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      household_id: householdId,
      user_id: user.id,
      category_id: body.categoryId,
      amount_cents: validation.amountCents,
      description: (body.description || '').slice(0, 200),
      date: body.date,
      payment_method: body.paymentMethod || '',
      notes: (body.notes || '').slice(0, 500),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

export function validateExpense(body) {
  if (!body) return { error: 'Cuerpo de la solicitud inválido.' };
  const amount = parseFloat(body.amount);
  if (!body.amount || isNaN(amount) || amount <= 0) return { error: 'El monto debe ser mayor a cero.' };
  if (!body.categoryId) return { error: 'La categoría es obligatoria.' };
  if (!body.date || isNaN(new Date(body.date).getTime())) return { error: 'La fecha no es válida.' };
  if (body.description && body.description.length > 200) return { error: 'La descripción supera el máximo de 200 caracteres.' };
  if (body.notes && body.notes.length > 500) return { error: 'Las notas superan el máximo de 500 caracteres.' };
  return { amountCents: Math.round(amount * 100) };
}

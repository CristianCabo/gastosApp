import { NextResponse } from 'next/server';
import { getRequestContext } from '@/lib/auth-context';

// GET /api/statistics?type=summary|categories|timeline&from=&to=&group=day|week|month
export async function GET(request) {
  const ctx = await getRequestContext();
  if (ctx.error) return NextResponse.json({ error: ctx.error.message }, { status: ctx.error.status });
  const { supabase, householdId } = ctx;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'summary';
  const from = searchParams.get('from') || '0001-01-01';
  const to = searchParams.get('to') || '9999-12-31';
  const group = searchParams.get('group') || 'day';

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('amount_cents, category_id, date')
    .eq('household_id', householdId)
    .gte('date', from)
    .lte('date', to);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (type === 'summary') {
    const total = expenses.reduce((s, e) => s + e.amount_cents, 0);
    const count = expenses.length;
    const average = count ? Math.round(total / count) : 0;
    const byCategory = {};
    expenses.forEach((e) => { byCategory[e.category_id] = (byCategory[e.category_id] || 0) + e.amount_cents; });
    const top = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    return NextResponse.json({
      total, count, average,
      topCategoryId: top ? top[0] : null,
      topCategoryTotal: top ? top[1] : 0,
    });
  }

  if (type === 'categories') {
    const byCategory = {};
    expenses.forEach((e) => { byCategory[e.category_id] = (byCategory[e.category_id] || 0) + e.amount_cents; });
    const data = Object.entries(byCategory)
      .map(([categoryId, total]) => ({ categoryId, total }))
      .sort((a, b) => b.total - a.total);
    return NextResponse.json({ data });
  }

  if (type === 'timeline') {
    const m = {};
    expenses.forEach((e) => {
      let key = e.date;
      if (group === 'month') key = e.date.slice(0, 7);
      else if (group === 'week') key = weekKey(e.date);
      m[key] = (m[key] || 0) + e.amount_cents;
    });
    const data = Object.entries(m).sort((a, b) => a[0].localeCompare(b[0])).map(([key, total]) => ({ key, total }));
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: 'type inválido' }, { status: 400 });
}

function weekKey(iso) {
  const [y, mo, d] = iso.split('-').map(Number);
  const date = new Date(y, mo - 1, d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

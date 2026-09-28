import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Borra la cuenta del usuario autenticado. Requiere la variable de
// entorno SUPABASE_SERVICE_ROLE_KEY (Project Settings -> API -> service_role
// en Supabase). Esa clave NUNCA debe usarse en el navegador: por eso
// esto vive en una Route Handler, que corre solo en el servidor.
export async function POST() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.' }, { status: 500 });
  }

  const supabase = createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });

  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}

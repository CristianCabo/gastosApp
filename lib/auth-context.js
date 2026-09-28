import { createClient } from './supabase-server';

// Devuelve { supabase, user, householdId } o { error } si no hay
// sesión válida o el usuario todavía no tiene un hogar activo.
// Se usa al principio de cada Route Handler.
export async function getRequestContext() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: { status: 401, message: 'No autenticado.' } };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('active_household_id, currency')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.active_household_id) {
    return { error: { status: 400, message: 'El usuario no tiene un hogar activo.' } };
  }

  return { supabase, user, householdId: profile.active_household_id, currency: profile.currency };
}

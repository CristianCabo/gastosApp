import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Usar dentro de Server Components, Route Handlers y Server Actions.
// Cada llamada arma un cliente atado a las cookies de la request actual,
// así todas las consultas se ejecutan como el usuario autenticado y
// quedan sujetas a las políticas de Row Level Security de la base.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Se llama desde un Server Component: el middleware ya se
            // encarga de refrescar la sesión, así que se puede ignorar.
          }
        },
      },
    }
  );
}

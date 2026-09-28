# Gastos — app de gestión de gastos personales

Next.js (App Router) + Supabase (Postgres, Auth, Row Level Security).
Dos o más personas pueden compartir los mismos gastos mediante un
"hogar" (household) con código de invitación.

## 1. Crear el proyecto en Supabase

1. Entrá a https://supabase.com, creá una cuenta y un proyecto nuevo (plan gratuito).
2. En **Project Settings → API** copiá:
   - `Project URL` → va en `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → va en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → va en `SUPABASE_SERVICE_ROLE_KEY` (¡nunca la subas a git ni la expongas en el navegador!)
3. En **Authentication → Providers**, dejá habilitado Email (viene por defecto).
   Si no querés que haga falta confirmar el email para poder loguearse,
   en **Authentication → Settings** podés desactivar "Confirm email"
   mientras probás en local.
4. En **SQL Editor**, pegá y ejecutá el contenido de
   `supabase/migrations/0001_init.sql`. Esto crea las tablas, los
   índices, el trigger que arma el hogar por defecto de cada usuario
   nuevo, y las políticas de Row Level Security.

## 2. Configurar el proyecto localmente

```bash
cp .env.local.example .env.local
# completá .env.local con los 3 valores del paso anterior

npm install
npm run dev
```

Abrí http://localhost:3000, registrate, y confirmá el email si dejaste
esa opción activada en Supabase.

## 3. Cómo funciona lo de "compartir gastos con otra persona"

Cuando te registrás, se te crea automáticamente un "hogar" propio con
un código de invitación de 6 caracteres (lo ves en
**Configuración → Hogar compartido**). La otra persona se registra
normalmente y, desde su propia página de Configuración, pega ese
código en "Unirme a otro hogar con un código". A partir de ahí, las
categorías y los gastos son compartidos entre ambas cuentas — cada
gasto queda marcado con quién lo cargó.

La seguridad de esto no depende del código del frontend: está
garantizada por las políticas de Row Level Security de Postgres
(`supabase/migrations/0001_init.sql`), así que aunque haya un bug en
la API, la base de datos igual va a impedir que alguien lea o
modifique gastos de un hogar del que no es miembro.

## 4. Deploy

**Base de datos:** ya vive en Supabase, no hace falta nada más.

**Frontend + API:**
1. Subí este proyecto a un repositorio de GitHub.
2. Entrá a https://vercel.com, "Add New Project" y elegí el repo.
3. En las variables de entorno del proyecto en Vercel, cargá las
   mismas 3 variables de `.env.local`.
4. Deploy. Listo — tu dominio de Vercel ya sirve la app completa.

## 5. Estructura del proyecto

```
app/
  login/, register/, forgot-password/, reset-password/   páginas públicas de autenticación
  (app)/                                                  sección privada (requiere sesión)
    dashboard/, expenses/, categories/, stats/, settings/  páginas
    layout.js, nav-shell.jsx                                sidebar / navegación inferior
  api/
    expenses/            GET (con filtros), POST
    expenses/[id]/       GET, PUT, DELETE
    categories/          GET, POST
    categories/[id]/     PUT, DELETE (desactiva si tiene gastos)
    statistics/          GET ?type=summary|categories|timeline
    household/join/      POST — unirse a un hogar con código
    profile/              GET, PUT — moneda, tema, nombre
    account/delete/       POST — elimina la cuenta
lib/                     clientes de Supabase, constantes, formateo de fechas/moneda
components/               UI compartida (modales, gráficos SVG, íconos)
supabase/migrations/      esquema SQL, índices y políticas de RLS
middleware.js              protege las rutas privadas y refresca la sesión
```

## 6. Próximos pasos sugeridos

- Paginación real en `/api/expenses` si el hogar acumula miles de
  gastos (ya soporta `page`/`pageSize`, falta el control en la UI).
- Invitar por email en vez de por código (requiere una función con
  `service_role` para buscar el usuario por email).
- Presupuestos mensuales, ingresos, gastos recurrentes: se agregan
  como tablas nuevas (`budgets`, `incomes`, `recurring_expenses`) con
  el mismo patrón de `household_id` + RLS que ya usan `categories` y
  `expenses`.
- Importación de CSV y notificaciones/recordatorios (quedaron fuera
  del MVP a propósito).

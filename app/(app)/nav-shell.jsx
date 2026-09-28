'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { createClient } from '@/lib/supabase-browser';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/expenses', label: 'Gastos', icon: 'expenses' },
  { href: '/categories', label: 'Categorías', icon: 'categories' },
  { href: '/stats', label: 'Estadísticas', icon: 'stats' },
  { href: '/settings', label: 'Configuración', icon: 'settings' },
];
const BOTTOM_NAV_ITEMS = [
  { href: '/dashboard', label: 'Inicio', icon: 'dashboard' },
  { href: '/expenses', label: 'Gastos', icon: 'expenses' },
  { href: '/expenses?add=1', label: 'Agregar', icon: 'plus', isAdd: true },
  { href: '/stats', label: 'Estadísticas', icon: 'stats' },
  { href: '/settings', label: 'Perfil', icon: 'user' },
];

export function NavShell({ children, userName, theme }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">💸</span><span className="brand-name">Gastos</span></div>
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className={'nav-item' + (pathname === item.href ? ' is-active' : '')}>
                <Icon name={item.icon} size={17} /> {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="sidebar-foot">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', padding: '0 8px' }}>
            <Icon name="user" size={15} /> {userName}
          </div>
          <button className="btn btn-ghost" onClick={handleLogout}><Icon name="logout" size={15} /> Cerrar sesión</button>
          <Link href="/expenses?add=1" className="add-btn"><Icon name="plus" size={17} /> Agregar gasto</Link>
        </div>
      </aside>

      <div className="topbar">
        <div className="brand"><span className="brand-mark">💸</span><span className="brand-name">Gastos</span></div>
      </div>

      <main className="main">{children}</main>

      <nav className="bottom-nav">
        {BOTTOM_NAV_ITEMS.map((item) =>
          item.isAdd ? (
            <Link key={item.href} href={item.href} className="bn-item is-add">
              <span className="bn-add-circle"><Icon name="plus" size={20} /></span>
            </Link>
          ) : (
            <Link key={item.href} href={item.href} className={'bn-item' + (pathname === item.href ? ' is-active' : '')}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
            </Link>
          )
        )}
      </nav>
    </div>
  );
}

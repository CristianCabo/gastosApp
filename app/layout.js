import './globals.css';

export const metadata = {
  title: 'Gastos',
  description: 'Gestión de gastos personales compartida',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

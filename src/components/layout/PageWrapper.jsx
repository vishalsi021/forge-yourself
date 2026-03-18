export function PageWrapper({ children, className = '' }) {
  return (
    <main className={`app-shell min-h-screen px-4 pb-28 pt-4 ${className}`}>
      {children}
    </main>
  );
}

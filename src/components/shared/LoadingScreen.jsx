export function LoadingScreen({ title = 'Loading FORGE', subtitle = 'Preparing your next move...' }) {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <div className="mb-3 font-display text-5xl tracking-[0.2em] text-forge-gold">FORGE</div>
        <div className="section-label mb-3">{title}</div>
        <div className="mx-auto h-1 w-28 overflow-hidden bg-forge-bg4">
          <div className="loading-screen-bar h-full bg-forge-gold" />
        </div>
        <p className="mt-4 text-sm text-forge-muted2">{subtitle}</p>
      </div>
    </div>
  );
}

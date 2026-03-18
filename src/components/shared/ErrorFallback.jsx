import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';

export function ErrorFallback({
  title = 'Something broke',
  description = 'We hit an unexpected error. Reload and try again.',
  primaryLabel = 'Reload',
  onPrimaryAction,
  showHomeLink = true,
}) {
  const handlePrimaryAction = () => {
    if (onPrimaryAction) {
      onPrimaryAction();
      return;
    }

    window.location.reload();
  };

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-6">
      <div className="surface w-full p-6 text-center">
        <div className="section-label mb-2">Recovery</div>
        <h1 className="display-title text-4xl">{title}</h1>
        <p className="mt-3 text-sm text-forge-muted2">{description}</p>
        <div className="mt-5 grid gap-3">
          <Button onClick={handlePrimaryAction}>{primaryLabel}</Button>
          {showHomeLink ? (
            <Link to="/">
              <Button variant="secondary" className="w-full">Return Home</Button>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

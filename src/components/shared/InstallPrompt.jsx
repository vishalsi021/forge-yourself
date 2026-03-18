import { Button } from '@/components/ui/Button';
import { useUiStore } from '@/stores/uiStore';

export function InstallPrompt() {
  const installPromptEvent = useUiStore((state) => state.installPromptEvent);
  const setInstallPromptEvent = useUiStore((state) => state.setInstallPromptEvent);

  if (!installPromptEvent) return null;

  return (
    <div className="surface mt-4 p-4">
      <div className="section-label mb-2">Installable</div>
      <h3 className="display-title text-3xl">Add FORGE to your home screen</h3>
      <p className="mt-2 text-sm text-forge-muted2">Install the app for faster daily access, offline support, and a cleaner focus loop.</p>
      <Button
        className="mt-4 w-full"
        onClick={async () => {
          await installPromptEvent.prompt();
          setInstallPromptEvent(null);
        }}
      >
        Install FORGE
      </Button>
    </div>
  );
}

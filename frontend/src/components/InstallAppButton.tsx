import { useEffect, useState } from 'react';
import { Download, Smartphone, Check, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallAppButton({ className = '' }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) return;

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIosGuide(!showIosGuide);
    } else {
      // Browser didn't trigger prompt yet or desktop browser
      alert(
        'To install CodeAI as an app:\n\n' +
        '• Chrome/Edge (Desktop): Click the install icon (⊕) on the right side of the address bar.\n' +
        '• Android: Tap browser menu (⋮) -> "Add to Home screen" or "Install App".\n' +
        '• iPhone/iPad: Tap Share (⎋) -> "Add to Home Screen".'
      );
    }
  };

  if (isInstalled) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold ${className}`}>
        <Check className="h-3.5 w-3.5" />
        <span>App Installed</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleInstallClick}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-brand-violet/20 to-brand-indigo/20 hover:from-brand-violet/30 hover:to-brand-indigo/30 border border-brand-purple/35 text-brand-accent hover:text-white text-xs font-bold transition-all shadow-sm group ${className}`}
        title="Install as Desktop or Mobile App"
      >
        <Smartphone className="h-4 w-4 group-hover:scale-110 transition-transform" />
        <span>Install App</span>
        <Download className="h-3.5 w-3.5 ml-auto opacity-70" />
      </button>

      {showIosGuide && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-dark-900 border border-brand-purple/40 rounded-xl text-xs text-slate-200 shadow-xl z-50">
          <p className="font-semibold text-brand-accent mb-1 flex items-center gap-1">
            <Share className="h-3.5 w-3.5" /> How to install on iOS:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
            <li>Safari bottom bar me <strong>Share (⎋)</strong> tap karein</li>
            <li>Scroll down karke <strong>"Add to Home Screen"</strong> chunein</li>
            <li>Top-right me <strong>"Add"</strong> dabayein</li>
          </ol>
        </div>
      )}
    </div>
  );
}

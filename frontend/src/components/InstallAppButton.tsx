import { useEffect, useState } from 'react';
import { Download, Smartphone, Check, Share, QrCode, X, Copy, ExternalLink } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallAppButton({ className = '' }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const APP_URL = 'https://coding-interview-78ad.vercel.app';

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
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.log('Install prompt error:', err);
      }
    }
    // Always open QR & download modal so user can also scan with their phone
    setShowModal(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(APP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
    <>
      <div className="relative">
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-brand-violet/20 to-brand-indigo/20 hover:from-brand-violet/30 hover:to-brand-indigo/30 border border-brand-purple/35 text-brand-accent hover:text-white text-xs font-bold transition-all shadow-sm group ${className}`}
          title="Install App or Scan QR Code"
        >
          <Smartphone className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span>Install / QR Scan</span>
          <QrCode className="h-3.5 w-3.5 ml-auto opacity-70 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* QR CODE & MOBILE APP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-dark-900 border border-brand-purple/40 rounded-2xl p-6 shadow-2xl overflow-hidden">
            {/* Background glow */}
            <div className="absolute -top-20 -left-20 w-44 h-44 bg-brand-violet/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-brand-cyan/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-dark-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand-violet/20 border border-brand-purple/30 text-brand-accent">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-outfit font-bold text-base text-white">CodeAI Mobile App</h3>
                  <p className="text-xs text-slate-400">Scan with Phone or Direct Install</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="py-4 space-y-4">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-dark-950/80 border border-dark-700/60">
                <div className="p-2.5 bg-white rounded-xl shadow-lg border-2 border-brand-purple/40">
                  <img
                    src="/qr.png"
                    alt="CodeAI Mobile QR Code"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-accent">
                  <QrCode className="h-4 w-4" />
                  <span>Scan with Phone Camera to Open Instantly</span>
                </div>
                <p className="text-[11px] text-slate-400 text-center mt-1">
                  Works on all Android & iOS devices without downloading any heavy file
                </p>
              </div>

              {/* Instructions */}
              <div className="p-3.5 rounded-xl bg-dark-800/50 border border-dark-700/50 space-y-2 text-xs">
                <div className="flex items-start gap-2 text-slate-300">
                  <span className="font-bold text-brand-cyan">1.</span>
                  <span>Phone camera se upar wala <strong>QR code scan karein</strong> ya link open karein.</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <span className="font-bold text-brand-cyan">2.</span>
                  <span>
                    <strong>Android:</strong> Chrome menu (⋮) me ja kar <strong>"Install app"</strong> tap karein.
                    <br />
                    <strong>iPhone:</strong> Safari bottom bar me <strong>Share (⎋)</strong> &gt; <strong>"Add to Home Screen"</strong> tap karein.
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-violet/20 hover:bg-brand-violet/30 border border-brand-purple/40 text-brand-accent font-semibold text-xs transition-all"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Mobile App Link'}</span>
                </button>

                <a
                  href={`https://www.pwabuilder.com?url=${encodeURIComponent(APP_URL)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-600 text-slate-300 hover:text-white font-medium text-xs transition-all"
                >
                  <Download className="h-4 w-4 text-brand-cyan" />
                  <span>Download Android APK via PWABuilder</span>
                  <ExternalLink className="h-3 w-3 ml-auto opacity-60" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

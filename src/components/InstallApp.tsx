import { useEffect, useState } from "react";
import { Download, Share2, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone() {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isIosSafari() {
  const userAgent = navigator.userAgent.toLowerCase();
  const ios =
    /iphone|ipad|ipod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const webkit = /safari/.test(userAgent);
  const anotherIosBrowser = /crios|fxios|edgios|opios/.test(userAgent);
  return ios && webkit && !anotherIosBrowser;
}

export function InstallApp() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem("pwa-install-dismissed") === "true"
  );

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    setShowIosHelp(isIosSafari());

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setShowIosHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [dismissed]);

  function dismiss() {
    sessionStorage.setItem("pwa-install-dismissed", "true");
    setDismissed(true);
  }

  async function install() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  }

  if (dismissed || (!installPrompt && !showIosHelp)) return null;

  return (
    <aside
      className="fixed z-[100] left-3 right-3 sm:left-auto sm:right-5 bottom-[calc(env(safe-area-inset-bottom)+12px)] sm:w-[380px] rounded-2xl border border-white/10 bg-slate-950/95 p-4 text-white shadow-2xl shadow-black/50 backdrop-blur-xl"
      aria-label="Instalar aplicativo"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fechar sugestão de instalação"
        className="absolute right-2.5 top-2.5 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-white/5 hover:text-white transition"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex gap-3 pr-8">
        <div className="w-11 h-11 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Instale o Atendimento</h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Acesse mais rápido e use o painel como um aplicativo.
          </p>
        </div>
      </div>

      {installPrompt ? (
        <Button
          type="button"
          onClick={install}
          className="w-full h-10 mt-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white"
        >
          <Download className="w-4 h-4 mr-2" /> Instalar aplicativo
        </Button>
      ) : (
        <div className="mt-4 rounded-xl bg-white/[0.05] border border-white/[0.06] p-3 flex items-start gap-2.5">
          <Share2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            No Safari, toque em <strong>Compartilhar</strong> e depois em{" "}
            <strong>Adicionar à Tela de Início</strong>.
          </p>
        </div>
      )}
    </aside>
  );
}

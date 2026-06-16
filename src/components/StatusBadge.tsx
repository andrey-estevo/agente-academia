import { cn } from "@/lib/utils";

type Status = "aguardando" | "atendimento" | "finalizado" | "bot";

const STATUS_CONFIG: Record<
  Status,
  { label: string; dotClass: string; badgeClass: string }
> = {
  aguardando: {
    label: "Aguardando",
    dotClass: "bg-yellow-400",
    badgeClass: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
  },
  atendimento: {
    label: "Em atendimento",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-500/20 text-blue-400 border border-blue-500/30"
  },
  finalizado: {
    label: "Finalizado",
    dotClass: "bg-green-500",
    badgeClass: "bg-green-500/20 text-green-400 border border-green-500/30"
  },
  bot: {
    label: "Bot",
    dotClass: "bg-purple-500",
    badgeClass: "bg-purple-500/20 text-purple-400 border border-purple-500/30"
  }
};

export function StatusDot({ status }: { status?: string }) {
  const config =
    STATUS_CONFIG[(status as Status) || "aguardando"] ||
    STATUS_CONFIG.aguardando;

  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full inline-block shadow-sm shrink-0",
        config.dotClass
      )}
    />
  );
}

export function StatusBadge({
  status,
  size = "sm"
}: {
  status?: string;
  size?: "sm" | "xs";
}) {
  const config =
    STATUS_CONFIG[(status as Status) || "aguardando"] ||
    STATUS_CONFIG.aguardando;

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full font-medium backdrop-blur-sm",
        "px-2 py-0.5 text-xs",
        config.badgeClass,
        size === "xs" && "px-1.5 text-[10px]"
      )}
    >
      {config.label}
    </span>
  );
}
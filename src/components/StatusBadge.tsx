import { cn } from "@/lib/utils";

type Status = "aguardando" | "atendimento" | "finalizado" | "bot";

const STATUS_CONFIG: Record<Status, { label: string; dotClass: string; badgeClass: string }> = {
  aguardando: {
    label: "Aguardando",
    dotClass: "bg-yellow-500",
    badgeClass: "bg-yellow-100 text-yellow-700"
  },
  atendimento: {
    label: "Atendimento",
    dotClass: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700"
  },
  finalizado: {
    label: "Finalizado",
    dotClass: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700"
  },
  bot: {
    label: "Bot",
    dotClass: "bg-purple-500",
    badgeClass: "bg-purple-100 text-purple-700"
  }
};

export function StatusDot({ status }: { status?: string }) {

  const config =
    STATUS_CONFIG[(status as Status) || "aguardando"] ||
    STATUS_CONFIG["aguardando"];

  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full inline-block",
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
    STATUS_CONFIG["aguardando"];

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium",
        config.badgeClass,
        size === "xs" && "text-[10px]"
      )}
    >
      {config.label}
    </span>
  );
}
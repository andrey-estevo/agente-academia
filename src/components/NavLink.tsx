import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  (
    {
      className,
      activeClassName,
      pendingClassName,
      to,
      ...props
    },
    ref
  ) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(
            // 🔥 BASE PADRÃO (dark premium)
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
            "text-gray-300 hover:bg-[#1e293b] hover:text-white",

            // custom vindo de fora
            className,

            // estados
            isActive &&
              (activeClassName ||
                "bg-[#1e293b] text-white border-l-4 border-blue-500"),

            isPending &&
              (pendingClassName || "opacity-60")
          )
        }
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
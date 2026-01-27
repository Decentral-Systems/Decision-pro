"use client";

import { useRouter } from "next/navigation";
import { navigateTo } from "@/lib/utils/navigation";
import { cn } from "@/lib/utils/cn";

interface SkipLinkProps {
  href: string;
  label?: string;
  className?: string;
}

export function SkipLink({ href, label = "Skip to main content", className }: SkipLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigateTo(href);
    // Focus the main content after navigation
    setTimeout(() => {
      const main = document.querySelector("main");
      if (main) {
        main.focus();
        main.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        "skip-link",
        className
      )}
      aria-label={label}
    >
      {label}
    </a>
  );
}

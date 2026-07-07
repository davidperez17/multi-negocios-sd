"use client";

import { useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {
          window.prompt("Copia el enlace de seguimiento:", url);
        }
      }}
      className="inline-flex h-9 items-center gap-2 rounded-(--radius-control) border border-border px-3.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors duration-150 cursor-pointer"
    >
      {copied ? <Check size={15} className="text-status-ready" aria-hidden /> : <LinkIcon size={15} aria-hidden />}
      {copied ? "Copiado" : "Copiar link de seguimiento"}
    </button>
  );
}

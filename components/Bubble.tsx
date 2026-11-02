import type { ReactNode } from "react";

/** Balão de fala do mascote. O texto é complemento para o adulto; a voz lê em voz alta. */
export default function Bubble({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="bubble" role="status" aria-live="polite">
      {icon && <span className="bubble-icon">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}

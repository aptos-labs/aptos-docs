import type { ReactNode } from "react";
import { Button } from "~/components/react/Button/Button";

export interface LoginButtonProps {
  className?: string;
  onLogin: () => void;
  provider: string;
  icon?: ReactNode;
}

export function LoginButton({ onLogin: handleLogin, provider, icon, className }: LoginButtonProps) {
  return (
    <Button size="sm" variant="secondary" className={className} onClick={handleLogin}>
      <div className="flex items-center justify-center gap-2">
        Login with {provider}
        {icon}
      </div>
    </Button>
  );
}

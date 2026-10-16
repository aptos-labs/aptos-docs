import type { ReactNode } from "react";
import { Button } from "~/components/react/Button/Button";

export interface LoginButtonProps {
  className?: string;
  onLogin: () => void;
  provider: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export function LoginButton({
  onLogin: handleLogin,
  provider,
  icon,
  className,
  disabled,
}: LoginButtonProps) {
  return (
    <Button
      size="sm"
      variant="secondary"
      className={className}
      onClick={handleLogin}
      disabled={disabled}
    >
      <div className="flex items-center justify-center gap-2">
        Login with {provider}
        {icon}
      </div>
    </Button>
  );
}

// import { useStore } from "@nanostores/react";

import { Button } from "~/components/react/Button/Button";
import { useAuth } from "~/components/react/hooks/useAuth";
import { IconGithub } from "~/components/react/Icon/IconGithub";
import { IconGoogle } from "~/components/react/Icon/IconGoogle";
import { LoginButton } from "~/components/react/LoginButton/LoginButton";
import { FaucetForm } from "./FaucetForm";

export interface FaucetProps {
  showGithub?: boolean;
}

export function Faucet({ showGithub = false }: FaucetProps) {
  const { user, error, logout, loginByGithub, loginByGoogle } = useAuth();
  if (error) {
    return (
      <p className="text-text-error mt-8">
        Could not instantiate a connection with firebase. Please make sure the correct environment
        variables are specified.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-8">
      {user && (
        <div className="flex flex-col gap-16 items-start">
          <FaucetForm user={user} />
          <Button
            size="sm"
            variant="secondary"
            onClick={logout}
            className="text-text-muted border-text-muted"
          >
            Log out
          </Button>
        </div>
      )}
      {!user && (
        <div className="flex gap-4">
          <LoginButton
            onLogin={loginByGoogle}
            provider="Google"
            icon={<IconGoogle style={{ width: "16", height: "16" }} />}
          />
          {showGithub && (
            <LoginButton onLogin={loginByGithub} provider="GitHub" icon={<IconGithub />} />
          )}
        </div>
      )}
    </div>
  );
}

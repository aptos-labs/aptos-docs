import { type FormEvent, useState } from "react";
import type { User } from "~/stores/auth";
import { Button } from "~/components/react/Button/Button";
import { IconCheck } from "~/components/react/Icon/IconCheck";
import { IconWarning } from "~/components/react/Icon/IconWarning";

function truncateHash(input: string) {
  return input.length <= 10 ? input : `${input.slice(0, 6)}...${input.slice(-4)}`;
}

function getAddressFromSearchParams(): string {
  return typeof window !== "undefined"
    ? (new URLSearchParams(window.location.search).get("address") ?? "")
    : "";
}

interface FaucetFormProps {
  user: User;
}

export function FaucetForm({ user }: FaucetFormProps) {
  const [accountAddress, setAccountAddress] = useState(() => getAddressFromSearchParams());
  const [txnHash, setTxnHash] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFaucetRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setTxnHash(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("https://faucet.testnet.aptoslabs.com/fund", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          // Required by the faucet.
          "x-is-jwt": "true",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: accountAddress,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { txn_hashes: string[] };
        const firstTxnHash = data.txn_hashes[0];

        if (!firstTxnHash) {
          setError("No transaction hash returned");
        } else {
          setTxnHash(firstTxnHash);
        }
      } else {
        const data = (await response.json()) as {
          rejection_reasons?: { reason: string }[];
          message?: string;
        };
        if (data.rejection_reasons && data.rejection_reasons.length > 0) {
          setError(data.rejection_reasons.map((reason) => reason.reason).join(", "));
        } else if (data.message) {
          setError(data.message);
        } else {
          setError(`Unknown error: ${JSON.stringify(data)}`);
        }
      }
    } catch (e) {
      setError(`Unknown error: ${String(e)}`);
    }
    setIsSubmitting(false);
  };

  const isSubmitEnabled = accountAddress && !isSubmitting;

  return (
    <div className="w-full">
      <form className="w-full flex items-end gap-4" onSubmit={handleFaucetRequest}>
        <div className="w-full grid">
          <label
            className="text-[15px] font-medium leading-[35px] text-text-primary"
            htmlFor="accountAddress"
          >
            Enter an account address below to receive APT
          </label>
          <input
            id="accountAddress"
            name="accountAddress"
            className="box-border inline-flex h-[34px] w-full appearance-none items-center justify-center rounded px-2.5 text-[15px] leading-none text-text-primary outline-none selection:text-text-primary shadow-[0_0_0_1px_#DEDEE0] dark:hover:shadow-[0_0_0_1px_white] dark:focus:shadow-[white] hover:shadow-[0_0_0_1px_#45454F] focus:shadow-[#45454F]"
            required
            value={accountAddress}
            onChange={(e) => {
              setAccountAddress(e.target.value);
            }}
          />
        </div>
        <Button size="sm" disabled={!isSubmitEnabled} type="submit">
          Mint
        </Button>
      </form>
      <div className="mt-6 text-[15px] font-medium">
        {txnHash && (
          <div className="flex gap-2 items-center">
            <IconCheck className="text-text-success" />
            Minted transaction {truncateHash(txnHash)}
            <Button size="sm" variant="secondary" className="text-text-success border-text-success">
              <a
                href={`https://explorer.aptoslabs.com/txn/0x${txnHash}?network=testnet`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on explorer
              </a>
            </Button>
          </div>
        )}
        {error && (
          <div className="flex gap-2 items-center text-text-error">
            <IconWarning />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button, Card, Flex, Input, message, Space, Typography } from "antd";
import { useCallback, useState } from "react";

import { useAptosClient } from "../aptos/useAptosClient";
import {
  randomReplayNonce,
  readAccountExistsAtView,
  readAptBalanceOctas,
} from "../lib/aptosPatterns";

const { Paragraph, Text } = Typography;

const APT_COIN = "0x1::aptos_coin::AptosCoin";

export function AptosPanel() {
  const aptos = useAptosClient();
  const { account, connected, network, signAndSubmitTransaction } = useWallet();

  const [balanceOctas, setBalanceOctas] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [viewExists, setViewExists] = useState<boolean | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [viewAddress, setViewAddress] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [amountOctas, setAmountOctas] = useState("100");
  const [orderless, setOrderless] = useState(false);
  const [lastHash, setLastHash] = useState<string | null>(null);
  const [txBusy, setTxBusy] = useState(false);

  const sender = account?.address?.toString();

  const explorerNetwork =
    network?.name?.toLowerCase() === "mainnet"
      ? "mainnet"
      : network?.name?.toLowerCase() === "devnet"
        ? "devnet"
        : "testnet";

  const refreshBalance = useCallback(async () => {
    if (!sender) {
      message.warning("Connect an Aptos wallet first.");
      return;
    }
    setBalanceLoading(true);
    try {
      const octas = await readAptBalanceOctas(aptos, sender);
      setBalanceOctas(octas);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Failed to load balance");
    } finally {
      setBalanceLoading(false);
    }
  }, [aptos, sender]);

  const runView = useCallback(async () => {
    const addr = (viewAddress || sender || "").trim();
    if (!addr) {
      message.warning("Enter an address or connect a wallet.");
      return;
    }
    setViewLoading(true);
    try {
      const exists = await readAccountExistsAtView(aptos, addr);
      setViewExists(exists);
    } catch (e) {
      message.error(e instanceof Error ? e.message : "View call failed");
    } finally {
      setViewLoading(false);
    }
  }, [aptos, sender, viewAddress]);

  const sendTransfer = useCallback(async () => {
    if (!connected || !account) {
      message.warning("Connect an Aptos wallet first.");
      return;
    }
    const toAddr = (transferTo || sender || "").trim();
    if (!toAddr) {
      message.warning("Set a recipient address.");
      return;
    }
    let amount: bigint;
    try {
      amount = BigInt(amountOctas);
    } catch {
      message.error("Amount must be an integer string of octas.");
      return;
    }
    setTxBusy(true);
    setLastHash(null);
    try {
      const pending = await signAndSubmitTransaction({
        data: {
          function: "0x1::aptos_account::transfer",
          functionArguments: [toAddr, amount],
        },
        options: orderless
          ? {
              replayProtectionNonce: randomReplayNonce(),
            }
          : undefined,
      });

      const committed = await aptos.waitForTransaction({
        transactionHash: pending.hash,
      });
      if (!committed.success) {
        throw new Error(committed.vm_status ?? "Transaction failed");
      }
      setLastHash(pending.hash);
      message.success("Committed on-chain.");
      await refreshBalance();
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Transaction failed");
    } finally {
      setTxBusy(false);
    }
  }, [
    account,
    amountOctas,
    aptos,
    connected,
    orderless,
    refreshBalance,
    sender,
    signAndSubmitTransaction,
    transferTo,
  ]);

  return (
    <Card title="Aptos (wallet network)" style={{ flex: "1 1 420px", minWidth: 320 }}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Text strong>Account</Text>
          <Paragraph style={{ marginBottom: 0 }}>
            {connected && sender ? sender : "Connect an Aptos wallet in the header."}
          </Paragraph>
        </div>
        <div>
          <Text strong>Balance (APT / octas)</Text>
          <Paragraph style={{ marginBottom: 0 }}>
            <code>aptos.getBalance</code> with <code>{APT_COIN}</code>
          </Paragraph>
          <Paragraph style={{ marginBottom: 8 }}>
            {balanceOctas === null ? "—" : `${balanceOctas.toLocaleString()} octas`}
            <Button
              size="small"
              style={{ marginLeft: 8 }}
              loading={balanceLoading}
              onClick={() => void refreshBalance()}
            >
              Refresh
            </Button>
          </Paragraph>
        </div>
        <div>
          <Text strong>View function</Text>
          <Paragraph type="secondary" style={{ marginBottom: 8 }}>
            Example: <code>0x1::account::exists_at</code> (same pattern as{" "}
            <code>primary_fungible_store::balance</code> in the guide).
          </Paragraph>
          <Flex vertical gap={8}>
            <Input
              placeholder="Address to query (defaults to connected account)"
              value={viewAddress}
              onChange={(e) => setViewAddress(e.target.value)}
            />
            <Button onClick={() => void runView()} loading={viewLoading}>
              Run view
            </Button>
            {viewExists === null ? null : (
              <Text>
                exists_at: <strong>{String(viewExists)}</strong>
              </Text>
            )}
          </Flex>
        </div>
        <div>
          <Text strong>Submit transfer</Text>
          <Paragraph type="secondary" style={{ marginBottom: 8 }}>
            Wallet <code>signAndSubmitTransaction</code> + SDK <code>waitForTransaction</code> (per
            integration guide).
          </Paragraph>
          <Flex vertical gap={8}>
            <Input
              placeholder="Recipient Aptos address (defaults to self)"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
            />
            <Input
              placeholder="Amount in octas (integer)"
              value={amountOctas}
              onChange={(e) => setAmountOctas(e.target.value)}
            />
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={orderless}
                onChange={(e) => setOrderless(e.target.checked)}
              />
              <span>
                Orderless (AIP-123): set <code>replayProtectionNonce</code> on the payload options
              </span>
            </label>
            <Button type="primary" onClick={() => void sendTransfer()} loading={txBusy}>
              Sign & submit transfer
            </Button>
            {lastHash ? (
              <Text>
                Tx:{" "}
                <a
                  href={`https://explorer.aptoslabs.com/txn/${lastHash}?network=${explorerNetwork}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {lastHash}
                </a>
              </Text>
            ) : null}
          </Flex>
        </div>
      </Space>
    </Card>
  );
}

import { Button, Card, Flex, Input, message, Space, Typography } from "antd";
import { useCallback, useState } from "react";
import { parseEther } from "viem";
import {
  useAccount,
  useBalance,
  useBlockNumber,
  useChainId,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from "wagmi";

const { Paragraph, Text } = Typography;

export function EthereumPanel() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: blockNumber, refetch: refetchBlock } = useBlockNumber({ watch: false });
  const {
    data: balance,
    refetch: refetchBalance,
    isFetching: balanceLoading,
  } = useBalance({
    address,
  });

  const [to, setTo] = useState("");
  const [amountEth, setAmountEth] = useState("0.0001");

  const {
    data: hash,
    sendTransaction,
    isPending: sendPending,
    error: sendError,
    reset: resetSend,
  } = useSendTransaction();

  const { isLoading: confirmLoading, isSuccess: confirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const onSend = useCallback(() => {
    resetSend();
    if (!address) {
      message.error("Connect an EVM wallet first.");
      return;
    }
    const recipient = (to || address) as `0x${string}`;
    try {
      const value = parseEther(amountEth || "0");
      sendTransaction({ to: recipient, value });
    } catch {
      message.error("Invalid amount (use a decimal ETH string, e.g. 0.0001).");
    }
  }, [address, amountEth, resetSend, sendTransaction, to]);

  return (
    <Card title="Ethereum (Sepolia)" style={{ flex: "1 1 420px", minWidth: 320 }}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div>
          <Text strong>Network</Text>
          <Paragraph style={{ marginBottom: 0 }}>
            chainId: {chainId} · block: {blockNumber?.toString() ?? "—"}{" "}
            <Button size="small" onClick={() => void refetchBlock()}>
              Refresh block
            </Button>
          </Paragraph>
        </div>
        <div>
          <Text strong>Balance (native)</Text>
          <Paragraph style={{ marginBottom: 0 }}>
            {isConnected
              ? `${balance?.formatted ?? "…"} ${balance?.symbol ?? ""}`
              : "Connect a wallet in the header."}
            {isConnected ? (
              <Button
                size="small"
                style={{ marginLeft: 8 }}
                loading={balanceLoading}
                onClick={() => void refetchBalance()}
              >
                Refresh
              </Button>
            ) : null}
          </Paragraph>
        </div>
        <div>
          <Text strong>Send native transfer</Text>
          <Paragraph type="secondary" style={{ marginBottom: 8 }}>
            wagmi <code>useSendTransaction</code> + <code>useWaitForTransactionReceipt</code> (EVM
            parallel to build → sign → submit → wait).
          </Paragraph>
          <Flex vertical gap={8}>
            <Input
              placeholder="Recipient (defaults to self)"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
            <Input
              placeholder="Amount in ETH"
              value={amountEth}
              onChange={(e) => setAmountEth(e.target.value)}
            />
            <Button type="primary" onClick={onSend} loading={sendPending || confirmLoading}>
              {confirmLoading ? "Confirming…" : "Send"}
            </Button>
            {sendError ? <Text type="danger">{sendError.message}</Text> : null}
            {hash ? (
              <Text>
                Tx:{" "}
                <a
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {hash}
                </a>
                {confirmed ? " · confirmed" : null}
              </Text>
            ) : null}
          </Flex>
        </div>
      </Space>
    </Card>
  );
}

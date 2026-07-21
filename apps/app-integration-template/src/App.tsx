import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ConfigProvider, Flex, Layout, Typography } from "antd";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";

import { AptosPanel } from "./components/AptosPanel";
import { EthereumPanel } from "./components/EthereumPanel";

const { Header, Content } = Layout;
const { Link, Paragraph, Title } = Typography;

export function App() {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#0d6efd" } }}>
      <RainbowKitProvider>
        <Layout style={{ minHeight: "100vh" }}>
          <Header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#0b1220",
              paddingInline: 24,
            }}
          >
            <Title level={4} style={{ color: "#fff", margin: 0 }}>
              EVM ↔ Aptos integration template
            </Title>
            <Flex gap={12} align="center" wrap="wrap">
              <ConnectButton chainStatus="icon" showBalance={false} />
              <WalletSelector />
            </Flex>
          </Header>
          <Content style={{ padding: 24, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
            <Paragraph>
              Minimal side-by-side flows for integrators: connect wallet, read balances, submit a
              transaction, and read on-chain state. Pair this with the{" "}
              <Link href="https://aptos.dev/build/guides/application-integration" target="_blank">
                Application Integration Guide
              </Link>
              .
            </Paragraph>
            <Flex gap={24} wrap="wrap" style={{ marginTop: 16 }}>
              <EthereumPanel />
              <AptosPanel />
            </Flex>
          </Content>
        </Layout>
      </RainbowKitProvider>
    </ConfigProvider>
  );
}

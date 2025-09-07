/**
 * Korean labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */
const labels = {
  // Top Level
  sdksAndTools: "SDK 및 도구",
  smartContracts: "스마트 컨트랙트",
  guides: "가이드",
  nodes: "노드",
  concepts: "개념",
  reference: "참조",
  ai: "AI 및 LLMs",
  contribute: "기여",

  // Build Sub-Groups
  "build.group.sdks": "SDK",
  "build.group.sdks.ts-sdk": "TypeScript SDK",
  "build.group.sdks.ts-sdk.accounts": "계정",
  "build.group.sdks.ts-sdk.building-transactions": "트랜잭션 구축",
  "build.group.sdks.ts-sdk.legacy-ts-sdk": "레거시 TS SDK",
  "build.group.sdks.go-sdk": "Go SDK",
  "build.group.sdks.go-sdk.building-transactions": "트랜잭션 구축",
  "build.group.sdks.dotnet-sdk": ".NET SDK",
  "build.group.sdks.dotnet-sdk.accounts": "계정",
  "build.group.sdks.dotnet-sdk.queries": "쿼리",
  "build.group.sdks.dotnet-sdk.transactions": "트랜잭션",
  "build.group.sdks.python-sdk": "Python SDK",
  "build.group.sdks.unity-sdk": "Unity SDK",
  "build.group.sdks.cpp-sdk": "C++ SDK",
  "build.group.sdks.rust-sdk": "Rust SDK",
  "build.group.sdks.wallet-adapter": "월렛 어댑터",
  "build.group.sdks.community-sdks": "커뮤니티 SDK",
  "build.group.sdks.react-hooks": "React Hooks",
  "build.group.sdks.community-sdks.kotlin-sdk": "Kotlin SDK",
  "build.group.sdks.community-sdks.swift-sdk": "Swift SDK",
  "build.group.sdks.community-sdks.unity-opendive-sdk": "Unity OpenDive SDK",
  "build.group.sdks.community-sdks.kotlin-sdk.for-ios-devs": "iOS 개발자용",
  "build.group.sdks.official": "공식",
  "build.group.sdks.community": "커뮤니티",
  "build.group.apis": "API",
  "build.group.indexer": "인덱서",
  "build.group.indexer.indexer-api": "인덱서 API",
  "build.group.indexer.indexer-sdk": "인덱서 SDK",
  "build.group.indexer.indexer-sdk.documentation": "문서",
  "build.group.indexer.indexer-sdk.quickstart": "빠른 시작",
  "build.group.indexer.indexer-sdk.advanced-tutorials": "고급 튜토리얼",
  "build.group.indexer.nft-aggregator": "NFT 애그리게이터",
  "build.group.indexer.nft-aggregator.marketplaces": "마켓플레이스",
  "build.group.indexer.txn-stream": "트랜잭션 스트림",
  "build.group.indexer.legacy": "레거시",
  "build.group.cli": "CLI",
  "build.group.cli.install-cli": "CLI 설치",
  "build.group.cli.setup-cli": "CLI 설정",
  "build.group.cli.trying-things-on-chain": "체인에서 테스트",
  "build.group.cli.working-with-move-contracts": "Move 컨트랙트 작업",
  "build.group.createAptosDapp": "Aptos DApp 생성",
  "build.group.aips": "AIPs",

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Move 북",
  "smartContracts.group.development": "개발",
  "smartContracts.group.aptosFeatures": "Aptos Move 기능",
  "smartContracts.group.aptosFeatures.objects": "객체",
  "smartContracts.group.aptosFeatures.aptosStandards": "Aptos 표준",
  "smartContracts.group.aptosFeatures.aptosStandards.fungibleTokens": "대체 가능 토큰",
  "smartContracts.group.aptosFeatures.aptosStandards.nonFungibleTokens": "비대체 가능 토큰",
  "smartContracts.group.aptosFeatures.dataStructures": "데이터 구조",
  "smartContracts.group.tooling": "도구",
  "smartContracts.group.tooling.move-prover": "Move Prover",
  "smartContracts.group.reference": "Move 참조",

  // Guides Sub-Groups
  "guides.group.getStarted": "시작하기",
  "guides.group.beginner": "초보자",
  "guides.group.beginner.e2e": "E2E DApp 구축",
  "guides.group.advanced": "고급",
  "guides.group.aptos-keyless": "Aptos Keyless",
  "guides.group.aptos-keyless.federated-keyless": "연합 Keyless",
  "guides.group.integration": "통합",

  // Network Sub-Groups
  "network.group.validatorNode": "검증자 노드",
  "network.group.validatorNode.runValidators": "검증자 실행",
  "network.group.validatorNode.deployNodes": "노드 배포",
  "network.group.validatorNode.connectNodes": "노드 연결",
  "network.group.validatorNode.poolOperations": "풀 작업",
  "network.group.validatorNode.configureValidators": "검증자 구성",
  "network.group.validatorNode.monitorValidators": "검증자 모니터링",
  "network.group.validatorNode.modifyNodes": "노드 수정",
  "network.group.validatorNode.verifyNodes": "노드 검증",
  "network.group.fullNode": "완전 노드",
  "network.group.fullNode.runFullNodes": "완전 노드 실행",
  "network.group.fullNode.deployFullNodes": "완전 노드 배포",
  "network.group.fullNode.modifyFullNodes": "완전 노드 수정",
  "network.group.fullNode.bootstrapFullnode": "부트스트랩 완전노드",
  "network.group.fullNode.configure": "구성",
  "network.group.fullNode.configure.nodeFiles": "노드 파일",
  "network.group.fullNode.measure": "측정",
  "network.group.fullNode.verifyFullNodes": "완전 노드 검증",
  "network.group.fullNode.deployments": "배포",
  "network.group.fullNode.modify": "수정",
  "network.group.bootstrapFullnode": "부트스트랩 완전노드",
  "network.group.configure": "구성",
  "network.group.configure.nodeFiles": "노드 파일",
  "network.group.measure": "측정",
  "network.group.measure.nodeHealthChecker": "노드 건강 검사기",
  "network.group.networkInformation": "네트워크 정보",
  "network.group.networkInformation.locatingNetworkFiles": "네트워크 파일 찾기",
  "network.group.localnet": "로컬 네트워크",
  "network.group.blockchain": "블록체인 기초",
  "network.group.accountsResources": "계정 및 리소스",
  "network.group.networkNodes": "네트워크 및 노드",
  "network.group.stakingGovernance": "스테이킹 및 거버넌스",
  "network.group.executionTransactions": "실행 및 트랜잭션",

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "인덱서 API",
  "reference.group.restApi": "REST API",

  // AI Sub-Groups
  "ai.group.aptos-mcp": "Aptos MCP",

  // Contribute Sub-Groups
  "contribute.group.components": "컴포넌트",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;

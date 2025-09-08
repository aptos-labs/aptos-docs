/**
 * Russian labels for navigation items
 * Keys correspond to identifiers used in sidebar configuration
 */
const labels = {
  // Top Level
  sdksAndTools: "SDK и Инструменты",
  smartContracts: "Смарт-контракты",
  guides: "Руководства",
  nodes: "Узлы",
  concepts: "Концепции",
  reference: "Справочник",
  ai: "ИИ и LLMs",
  contribute: "Внести вклад",

  // Build Sub-Groups
  "build.group.sdks": "SDK",
  "build.group.sdks.ts-sdk": "TypeScript SDK",
  "build.group.sdks.ts-sdk.accounts": "Аккаунты",
  "build.group.sdks.ts-sdk.building-transactions": "Создание транзакций",
  "build.group.sdks.ts-sdk.legacy-ts-sdk": "Устаревший TS SDK",
  "build.group.sdks.go-sdk": "Go SDK",
  "build.group.sdks.go-sdk.building-transactions": "Создание транзакций",
  "build.group.sdks.dotnet-sdk": ".NET SDK",
  "build.group.sdks.dotnet-sdk.accounts": "Аккаунты",
  "build.group.sdks.dotnet-sdk.queries": "Запросы",
  "build.group.sdks.dotnet-sdk.transactions": "Транзакции",
  "build.group.sdks.python-sdk": "Python SDK",
  "build.group.sdks.unity-sdk": "Unity SDK",
  "build.group.sdks.cpp-sdk": "C++ SDK",
  "build.group.sdks.rust-sdk": "Rust SDK",
  "build.group.sdks.wallet-adapter": "Адаптер кошелька",
  "build.group.sdks.community-sdks": "SDK сообщества",
  "build.group.sdks.react-hooks": "React Hooks",
  "build.group.sdks.community-sdks.kotlin-sdk": "Kotlin SDK",
  "build.group.sdks.community-sdks.swift-sdk": "Swift SDK",
  "build.group.sdks.community-sdks.unity-opendive-sdk": "Unity OpenDive SDK",
  "build.group.sdks.community-sdks.kotlin-sdk.for-ios-devs": "Для разработчиков iOS",
  "build.group.sdks.official": "Официальный",
  "build.group.sdks.community": "Сообщество",
  "build.group.apis": "API",
  "build.group.indexer": "Индексатор",
  "build.group.indexer.indexer-api": "API индексатора",
  "build.group.indexer.indexer-sdk": "SDK индексатора",
  "build.group.indexer.indexer-sdk.documentation": "Документация",
  "build.group.indexer.indexer-sdk.quickstart": "Быстрый старт",
  "build.group.indexer.indexer-sdk.advanced-tutorials": "Расширенные учебные пособия",
  "build.group.indexer.nft-aggregator": "NFT агрегатор",
  "build.group.indexer.nft-aggregator.marketplaces": "Маркетплейсы",
  "build.group.indexer.txn-stream": "Поток транзакций",
  "build.group.indexer.legacy": "Устаревшее",
  "build.group.cli": "CLI",
  "build.group.cli.install-cli": "Установить CLI",
  "build.group.cli.setup-cli": "Настроить CLI",
  "build.group.cli.trying-things-on-chain": "Тестирование на цепи",
  "build.group.cli.working-with-move-contracts": "Работа с контрактами Move",
  "build.group.createAptosDapp": "Создать Aptos DApp",
  "build.group.aips": "AIPs",

  // Smart Contracts & Move Sub-Groups
  "smartContracts.group.moveBook": "Книга Move",
  "smartContracts.group.development": "Разработка",
  "smartContracts.group.aptosFeatures": "Особенности Aptos Move",
  "smartContracts.group.aptosFeatures.objects": "Объекты",
  "smartContracts.group.aptosFeatures.aptosStandards": "Стандарты Aptos",
  "smartContracts.group.aptosFeatures.aptosStandards.fungibleTokens": "Заменяемые токены",
  "smartContracts.group.aptosFeatures.aptosStandards.nonFungibleTokens": "Незаменяемые токены",
  "smartContracts.group.aptosFeatures.dataStructures": "Структуры данных",
  "smartContracts.group.tooling": "Инструменты",
  "smartContracts.group.tooling.move-prover": "Move Prover",
  "smartContracts.group.reference": "Справочник Move",

  // Guides Sub-Groups
  "guides.group.getStarted": "Начало работы",
  "guides.group.beginner": "Начинающий",
  "guides.group.beginner.e2e": "Создание E2E DApp",
  "guides.group.advanced": "Расширенный",
  "guides.group.aptos-keyless": "Aptos Keyless",
  "guides.group.aptos-keyless.federated-keyless": "Федеративный Keyless",
  "guides.group.integration": "Интеграция",

  // Network Sub-Groups
  "network.group.validatorNode": "Валидаторные узлы",
  "network.group.validatorNode.runValidators": "Запуск валидаторов",
  "network.group.validatorNode.deployNodes": "Развертывание узлов",
  "network.group.validatorNode.connectNodes": "Подключение узлов",
  "network.group.validatorNode.poolOperations": "Операции пула",
  "network.group.validatorNode.configureValidators": "Настройка валидаторов",
  "network.group.validatorNode.monitorValidators": "Мониторинг валидаторов",
  "network.group.validatorNode.modifyNodes": "Изменение узлов",
  "network.group.validatorNode.verifyNodes": "Проверка узлов",
  "network.group.fullNode": "Полные узлы",
  "network.group.fullNode.runFullNodes": "Запуск полных узлов",
  "network.group.fullNode.deployFullNodes": "Развертывание полных узлов",
  "network.group.fullNode.modifyFullNodes": "Изменение полных узлов",
  "network.group.fullNode.bootstrapFullnode": "Загрузка полного узла",
  "network.group.fullNode.configure": "Настройка",
  "network.group.fullNode.configure.nodeFiles": "Файлы узла",
  "network.group.fullNode.measure": "Измерение",
  "network.group.fullNode.verifyFullNodes": "Проверка полных узлов",
  "network.group.fullNode.deployments": "Развертывания",
  "network.group.fullNode.modify": "Изменение",
  "network.group.bootstrapFullnode": "Загрузка полного узла",
  "network.group.configure": "Настройка",
  "network.group.configure.nodeFiles": "Файлы узла",
  "network.group.measure": "Измерение",
  "network.group.measure.nodeHealthChecker": "Проверка здоровья узла",
  "network.group.networkInformation": "Информация о сети",
  "network.group.networkInformation.locatingNetworkFiles": "Поиск файлов сети",
  "network.group.localnet": "Локальные сети",
  "network.group.blockchain": "Основы блокчейна",
  "network.group.accountsResources": "Аккаунты и ресурсы",
  "network.group.networkNodes": "Сеть и узлы",
  "network.group.stakingGovernance": "Стейкинг и управление",
  "network.group.executionTransactions": "Выполнение и транзакции",

  // Reference Sub-Groups (Only has generated API and glossary for now)
  "reference.group.indexerApi": "API индексатора",
  "reference.group.restApi": "REST API",

  // AI Sub-Groups
  "ai.group.aptos-mcp": "Aptos MCP",

  // Languages Sub-Groups
  "languages.group.translationStatus": "Статус перевода",

  // Contribute Sub-Groups
  "contribute.group.components": "Компоненты",
} as const;

type NavLabels = typeof labels;

export type NavKey = keyof NavLabels;

export default labels;

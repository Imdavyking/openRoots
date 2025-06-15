# 🌱 OpenRoots

**OpenRoots** is an open, verifiable dataset registry for AI applications. It empowers dataset creators, curators, and consumers to register, license, and share datasets with full provenance, leveraging [IPFS](https://ipfs.tech/), [Story Protocol](https://storyprotocol.xyz/), and [Tomo](https://www.npmjs.com/package/@tomo-inc/tomo-evm-kit) for smart account wallet connectivity.

## 🔍 Why OpenRoots?

AI is only as good as the data it learns from. OpenRoots ensures:

- 🔗 **Provenance**: Every dataset is transparently traced back to its source.
- 📦 **Decentralization**: Datasets are stored and referenced via IPFS.
- ⚖️ **Fair Licensing**: Integrates with Story Protocol to register IP and usage rights.
- 🔍 **Auditability**: Every interaction is recorded for transparency and reproducibility.

## ✨ Features

- Register datasets and metadata to IPFS
- Log provenance and licensing via Story Protocol
- Query and explore publicly available datasets
- Smart account session management via Tomo SDK
- Integration-ready APIs for AI researchers and developers

## 🛠 Tech Stack

- **Storage**: IPFS
- **Licensing & Provenance**: Story Protocol
- **Smart Wallet Connection**: [`@tomo-inc/tomo-evm-kit`](https://www.npmjs.com/package/@tomo-inc/tomo-evm-kit) `^0.0.46`
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js / Story Client SDK
- **Smart Contracts**: (If applicable, e.g. Solidity / Ink!)

## 🚀 Getting Started

1. Clone the repo:

   ```bash
   git clone https://github.com/your-org/openroots.git
   cd openroots
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Run locally:

   ```bash
   yarn dev
   ```

## 📄 Registering a Dataset

1. Upload your dataset or metadata file to IPFS.
2. Use the OpenRoots UI or CLI to:

   - Register your dataset's CID.
   - Link your Story Protocol license (if applicable).
   - Add metadata (source, creator, description, license, model compatibility, etc.)

## 🌐 Integrations

- [Story Protocol](https://storyprotocol.xyz) — IP and licensing registry
- [IPFS](https://ipfs.tech) — Distributed storage
- [`@tomo-inc/tomo-evm-kit`](https://www.npmjs.com/package/@tomo-inc/tomo-evm-kit) — Smart wallet connectivity and programmable sessions

## 📜 License

OpenRoots is open-source under the [MIT License](LICENSE).

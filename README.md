# 🌱 OpenRoots

**OpenRoots** is an open, verifiable dataset registry for AI applications. It empowers dataset creators, curators, and consumers to register, license, and share datasets with full provenance, leveraging [IPFS](https://ipfs.tech/), [Story Protocol](https://storyprotocol.xyz/), and [Tomo](https://www.npmjs.com/package/@tomo-inc/tomo-evm-kit) for smart account wallet connectivity.

## 🔍 Why OpenRoots?

AI is only as good as the data it learns from. OpenRoots ensures:

- 🔗 **Provenance**: Every dataset is transparently traced back to its source.
- 📦 **Decentralization**: Datasets are stored and referenced via IPFS.
- ⚖️ **Fair Licensing**: Integrates with Story Protocol to register IP and usage rights.
- 👥 **Group-based Access Control**: Uses Story Protocol’s Group Module to organize datasets, manage membership, and control access.
- 💸 **Monetization**: Enable royalty collection and distribution through group-linked vaults.
- 🔍 **Auditability**: Every interaction is recorded for transparency and reproducibility.

## ✨ Features

- Register datasets and metadata to IPFS
- Log provenance and licensing via Story Protocol
- Organize datasets into access-controlled groups
- Collect and distribute royalties using Group Vaults
- Smart account session management via Tomo SDK
- Integration-ready APIs for AI researchers and developers

## 🛠 Tech Stack

- **Storage**: IPFS
- **Licensing & Provenance**: Story Protocol
- **Group Access & Monetization**: Story Protocol Group Module
- **Smart Wallet Connection**: [`@tomo-inc/tomo-evm-kit`](https://www.npmjs.com/package/@tomo-inc/tomo-evm-kit) `^0.0.46`
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js / Story Client SDK
- **Smart Contracts**: Story Protocol Modules

## 🚀 Getting Started

1. Clone the repo:

   ```bash
   git clone https://github.com/Imdavyking/openRoots
   cd openRoots
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

   - Register your dataset's CID on-chain.
   - Mint a Story Protocol IP asset for the dataset.
   - Attach a license to the IP asset.
   - Add the dataset to a Group for access control.
   - Distribute access to contributors or consumers by adding them to the Group.

## 💰 Claiming Rewards

- Royalties generated from licensed use of datasets are held in a **Group Vault**.
- Contributors can **claim their share** using the Royalty Module integrated with the Group Module.
- Only authorized group members (or their IP assets) can claim.

## 🌐 Integrations

- [Story Protocol](https://story.foundation) — IP & licensing registry, Group access management, Royalty distribution
- [IPFS](https://ipfs.tech) — Distributed, content-addressed file storage
- [`@tomo-inc/tomo-evm-kit`](https://www.npmjs.com/package/@tomo-inc/tomo-evm-kit) — Smart wallet SDK for programmable sessions

## 📜 License

OpenRoots is open-source under the [MIT License](LICENSE).

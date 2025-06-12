import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { DatasetMarketplace } from "../typechain-types";
import { ContractTransactionResponse } from "ethers";
import { initKeystore } from "../utils/init.keystore";
import { wallet } from "../hardhat.config";
import dotenv from "dotenv";

dotenv.config();

describe("DatasetMarketplace", function () {
  let marketplace: DatasetMarketplace & {
      deploymentTransaction(): ContractTransactionResponse;
    },
    owner,
    user1: HardhatEthersSigner,
    user2: HardhatEthersSigner;
  const dataSetId = crypto.randomUUID().replace(/-/g, "");
  let signature: string;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const Marketplace = await ethers.getContractFactory("DatasetMarketplace");
    marketplace = await Marketplace.deploy(process.env.BLOCKLOCK_SENDER_PROXY!);
    await marketplace.waitForDeployment();

    const ethSignedMessageproofHash = ethers.solidityPackedKeccak256(
      ["string", "string"],
      [dataSetId, "cid1"]
    );

    signature = await wallet.signMessage(
      ethers.getBytes(ethSignedMessageproofHash)
    );
  });

  it("should allow uploading datasets", async function () {
    await marketplace
      .connect(user1)
      .uploadDataset(
        dataSetId,
        "cid1",
        ethers.parseEther("1"),
        0,
        "preview",
        "title",
        signature
      );
    const dataset = await marketplace.datasets(dataSetId);
    expect(dataset.cid).to.equal("cid1");
    expect(dataset.owner).to.equal(user1.address);
  });

  it("should allow updating datasets", async function () {
    await marketplace
      .connect(user1)
      .uploadDataset(
        dataSetId,
        "cid1",
        ethers.parseEther("1"),
        0,
        "preview",
        "title",
        signature
      );
    await marketplace
      .connect(user1)
      .updateDataset(dataSetId, "newCid", ethers.parseEther("2"));
    const dataset = await marketplace.datasets(dataSetId);
    expect(dataset.cid).to.equal("newCid");
    expect(dataset.price).to.equal(ethers.parseEther("2"));
  });

  it("should fail to update dataset if not owner", async function () {
    await marketplace
      .connect(user1)
      .uploadDataset(
        dataSetId,
        "cid1",
        ethers.parseEther("1"),
        0,
        "preview",
        "title",
        signature
      );
    await expect(
      marketplace
        .connect(user2)
        .updateDataset(dataSetId, "newCid", ethers.parseEther("2"))
    ).to.be.revertedWithCustomError(
      marketplace,
      "DatasetMarketplace__NotDatasetOwner"
    );
  });

  it("should allow purchasing access", async function () {
    await marketplace
      .connect(user1)
      .uploadDataset(
        dataSetId,
        "cid1",
        ethers.parseEther("1"),
        0,
        "preview",
        "title",
        signature
      );
    await marketplace
      .connect(user2)
      .purchaseAccess(dataSetId, { value: ethers.parseEther("1") });
    const has = await marketplace.canAccess(dataSetId, user2.address);
    expect(has).to.be.true;
  });

  it("should revert if underpaying for access", async function () {
    await marketplace
      .connect(user1)
      .uploadDataset(
        dataSetId,
        "cid1",
        ethers.parseEther("1"),
        0,
        "preview",
        "title",
        signature
      );
    await expect(
      marketplace
        .connect(user2)
        .purchaseAccess(dataSetId, { value: ethers.parseEther("0.5") })
    ).to.be.revertedWithCustomError(
      marketplace,
      "DatasetMarketplace__InsufficientPayment"
    );
  });

  it("should allow rating a dataset", async function () {
    await marketplace
      .connect(user1)
      .uploadDataset(
        dataSetId,
        "cid1",
        ethers.parseEther("1"),
        0,
        "preview",
        "title",
        signature
      );
    await marketplace.connect(user2).rateDataset(dataSetId, 4);
    const dataset = await marketplace.datasets(dataSetId);
    expect(dataset.starsTotal).to.equal(4);
    expect(dataset.starsCount).to.equal(1);
  });

  it("should revert if user rates more than once", async function () {
    await marketplace
      .connect(user1)
      .uploadDataset(
        dataSetId,
        "cid1",
        ethers.parseEther("1"),
        0,
        "preview",
        "title",
        signature
      );
    await marketplace.connect(user2).rateDataset(dataSetId, 4);
    await expect(
      marketplace.connect(user2).rateDataset(dataSetId, 5)
    ).to.be.revertedWithCustomError(
      marketplace,
      "DatasetMarketplace__AlreadyRated"
    );
  });

  it("should increment downloads only if user has access", async function () {
    await marketplace
      .connect(user1)
      .uploadDataset(
        dataSetId,
        "cid1",
        ethers.parseEther("1"),
        0,
        "preview",
        "title",
        signature
      );
    await marketplace
      .connect(user2)
      .purchaseAccess(dataSetId, { value: ethers.parseEther("1") });
    await marketplace.connect(user2).recordDownload(dataSetId);
    const dataset = await marketplace.datasets(dataSetId);
    expect(dataset.downloads).to.equal(1);
  });

  it("should revert download if user has no access", async function () {
    await marketplace
      .connect(user1)
      .uploadDataset(
        dataSetId,
        "cid1",
        ethers.parseEther("1"),
        0,
        "preview",
        "title",
        signature
      );
    await expect(
      marketplace.connect(user2).recordDownload(dataSetId)
    ).to.be.revertedWithCustomError(
      marketplace,
      "DatasetMarketplace__AccessDenied"
    );
  });
});

import { useEffect, useState } from "react";
import { useWalletClient } from "wagmi";
import { WIP_TOKEN_ADDRESS } from "@story-protocol/core-sdk";
import { useStory } from "../../context/AppContext";
import { getUserGroupId } from "../upload-now/main";

type Props = {
  groupId: `0x${string}`;
  wipTokenAddress: `0x${string}`;
  memberIpId: `0x${string}`;
  client: any;
};

const RoyaltiesPage = () => {
  const [status, setStatus] = useState("");
  const [royalties, setRoyalties] = useState<null | string>(null);
  const [rewards, setRewards] = useState<null | string>(null);
  const [claimed, setClaimed] = useState<null | string>(null);
  const { data: wallet } = useWalletClient();
  const { txLoading, txHash, txName, client } = useStory();
  const [groupId, setGroupId] = useState<`0x${string}` | null>();

  useEffect(() => {
    if (!wallet || !wallet.account) {
      setStatus("❌ Please connect your wallet first.");
      return;
    }
    setStatus("⏳ Fetching group ID...");
    const userAddress = wallet?.account?.address || "";
    getUserGroupId(userAddress)
      .then((id) => {
        setGroupId(id as `0x${string}`);
      })
      .catch((error) => {
        console.error("Error fetching group ID:", error);
        setStatus("❌ Error fetching group ID. Please try again later.");
      });
  }, []);

  const formatEth = (amount: string | number | bigint) => {
    return parseFloat(amount.toString()) / 1e18;
  };

  const handleCollectAndClaim = async () => {
    try {
      if (!wallet) {
        setStatus("❌ Please connect your wallet first.");
        return;
      }

      if (!client) {
        setStatus("❌ Client not initialized. Please try again later.");
        return;
      }

      if (!groupId) {
        setStatus("❌ Group ID not found. Please try again later.");
        return;
      }
      setStatus("⏳ Collecting royalties...");
      const collected = await client.groupClient.collectRoyalties({
        groupIpId: groupId!,
        currencyToken: WIP_TOKEN_ADDRESS,
      });
      setRoyalties("Royalties collected successfully.");
      setStatus("✅ Royalties collected");

      setStatus("⏳ Checking claimable rewards...");
      //   const rewardInfo = await client.groupClient.getClaimableReward({
      //     groupIpId: groupId!,
      //     currencyToken: WIP_TOKEN_ADDRESS,
      //     memberIpIds: [memberIpId],
      //   });

      //   console.log("Reward Info:", rewardInfo);

      //   //   const amount = rewardInfo[0]? || "0";
      //   const amount = "0";
      //   setRewards(`${formatEth(amount)} WIP`);
      //   setStatus("✅ Claimable rewards fetched");

      //   setStatus("⏳ Claiming rewards...");
      //   const claimResponse = await client.groupClient.claimReward({
      //     groupIpId: groupId!,
      //     currencyToken: WIP_TOKEN_ADDRESS,
      //     memberIpIds: [memberIpId],
      //   });

      setClaimed("Rewards claimed successfully.");
      setStatus("🎉 Rewards claimed");
    } catch (error: any) {
      console.error(error);
      setStatus(`❌ Error: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 p-6 bg-white rounded-2xl shadow-lg space-y-6">
      <h1 className="text-3xl font-bold text-center text-gray-800">
        🎁 Royalties & Rewards
      </h1>

      <button
        onClick={handleCollectAndClaim}
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition"
      >
        Collect & Claim
      </button>

      <div className="text-center text-sm text-gray-500">{status}</div>

      {royalties && (
        <div className="bg-gray-100 p-4 rounded-xl">
          <h2 className="text-lg font-semibold text-gray-700">📥 Royalties</h2>
          <p className="text-gray-600 mt-1">{royalties}</p>
        </div>
      )}

      {rewards && (
        <div className="bg-yellow-100 p-4 rounded-xl">
          <h2 className="text-lg font-semibold text-yellow-800">
            💰 Claimable Rewards
          </h2>
          <p className="text-yellow-700 mt-1">{rewards}</p>
        </div>
      )}

      {claimed && (
        <div className="bg-green-100 p-4 rounded-xl">
          <h2 className="text-lg font-semibold text-green-800">✅ Claimed</h2>
          <p className="text-green-700 mt-1">{claimed}</p>
        </div>
      )}
    </div>
  );
};

export default RoyaltiesPage;

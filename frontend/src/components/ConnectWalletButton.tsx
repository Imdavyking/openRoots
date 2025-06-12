import { ellipsify } from "../utils/ellipsify";
import { useConnectModal } from "@tomo-inc/tomo-evm-kit";

export default function ConnectWalletButton() {
  const { openConnectModal } = useConnectModal();
  const account = {
    address: null,
  };
  const isConnecting = false;
  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={openConnectModal}
        className={`cursor-pointer px-6 py-2 ${
          account?.address
            ? "bg-red-600 hover:bg-red-700"
            : "bg-blue-600 hover:bg-blue-700"
        } text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50`}
        disabled={false}
      >
        {isConnecting
          ? "Connecting..."
          : account?.address
          ? `Disconnect (${ellipsify(account.address)})`
          : "Connect Wallet"}
      </button>
    </div>
  );
}

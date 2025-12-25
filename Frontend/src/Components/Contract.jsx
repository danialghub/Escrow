import React, { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppProvider";
import { dummyData } from "../data/dummyData";

import DepositModal from "./DepositModal";
import PlaceContractModal from "./PlaceContractModal";

/* =======================
   Contract Component
======================= */
const Contract = () => {
    const {
        connectWallet,
        account,
        deposit,
        release,
        refund,
        events,
        balance,
        isTransactionPlaced,
        transactionState,
        setupEscrow,
        arbiter,
        seller,
        buyer,
    } = useApp();

    /* ---------- Local UI States ---------- */
    const [depositModal, setDepositModal] = useState(false);
    const [setUpModal, setSetUpModal] = useState(false);

    /* =======================
       User / Role Resolution
    ======================= */

    // کاربر فعال بر اساس آدرس متصل
    const activeUser = useMemo(() => {
        if (!account) return null;

        return dummyData.find(
            (user) => user.address.toLowerCase() === account.toLowerCase()
        );
    }, [account]);

    // نمایش نام کاربر یا آدرس کوتاه‌شده
    const getUserName = (address) => {
        if (!address) return "-";

        const user = dummyData.find(
            (u) => u.address.toLowerCase() === address.toLowerCase()
        );

        return user
            ? user.name
            : `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    /* =======================
       Role & State Flags
    ======================= */
    const isDeliveryPhase = transactionState === "AWAITING_DELIVERY";

    const isBuyer =
        activeUser?.role === "buyer" && activeUser.address === buyer;

    const isSeller =
        activeUser?.role === "seller" && activeUser.address === seller;

    const isArbiter =
        activeUser?.role === "arbiter" && activeUser.address === arbiter;

    /* =======================
       Wallet Auto-Connect
    ======================= */
    useEffect(() => {
        if (!window.ethereum) return;

        connectWallet();

        const handleAccountsChanged = () => connectWallet();

        window.ethereum.on("accountsChanged", handleAccountsChanged);

        return () => {
            window.ethereum.removeListener(
                "accountsChanged",
                handleAccountsChanged
            );
        };
    }, []);

    /* =======================
       Render
    ======================= */
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black p-6 text-white relative">
            {/* Modals */}
            <DepositModal
                isOpen={depositModal}
                onClose={() => setDepositModal(false)}
                balance={balance}
                onConfirm={deposit}
            />

            <PlaceContractModal
                isOpen={setUpModal}
                onClose={() => setSetUpModal(false)}
                onConfirm={setupEscrow}
            />

            <div className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-6">
                    <h1 className="text-3xl font-bold">Escrow Dashboard</h1>
                    <p className="text-gray-300 mt-2 text-sm">
                        براساس نقش وظیفت را انجام بده
                    </p>
                </div>

                {/* Active User Card */}
                {activeUser ? (
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/20 shadow-xl mb-6">
                        <div className="flex items-center gap-5 mb-4">
                            <img
                                src={activeUser.logo}
                                alt={activeUser.name}
                                className="w-16 h-16 rounded-xl"
                            />
                            <div>
                                <h2 className="text-xl font-semibold">{activeUser.name}</h2>
                                <p className="text-gray-300 capitalize">
                                    {activeUser.role}
                                </p>
                                <p className="text-xs mt-2 text-blue-300">
                                    {activeUser.address}
                                </p>
                            </div>
                        </div>

                        {/* Balance */}
                        <div className="bg-blue-500/20 text-blue-200 rounded-xl p-3 text-center font-semibold shadow-md">
                            Balance: <span className="text-white">{balance} ETH</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-300 mb-6">
                        ابتدا به یک کیف پول متصل شو
                    </p>
                )}

                {/* Actions */}
                {isTransactionPlaced ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        {/* Deposit (Buyer) */}
                        <button
                            disabled={!isBuyer || isDeliveryPhase}
                            onClick={() => setDepositModal(true)}
                            className={`px-5 py-3 rounded-md font-semibold transition-all
                ${isBuyer && !isDeliveryPhase
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-gray-700 cursor-not-allowed opacity-50"
                                }`}
                        >
                            واریز به فروشنده
                        </button>

                        {/* Refund (Seller / Arbiter) */}
                        <button
                            disabled={!isDeliveryPhase || (!isArbiter && !isSeller)}
                            onClick={refund}
                            className={`px-5 py-3 rounded-md font-semibold transition-all
                ${isDeliveryPhase && (isArbiter || isSeller)
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-gray-700 cursor-not-allowed opacity-50"
                                }`}
                        >
                            بازپرداخت وجه
                        </button>

                        {/* Release (Buyer / Arbiter) */}
                        <button
                            disabled={!isDeliveryPhase || (!isBuyer && !isArbiter)}
                            onClick={release}
                            className={`px-5 py-3 rounded-md font-semibold transition-all
                ${isDeliveryPhase && (isBuyer || isArbiter)
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-gray-700 cursor-not-allowed opacity-50"
                                }`}
                        >
                            آزاد سازی وجه
                        </button>
                    </div>
                ) : account && activeUser?.role === "buyer" ? (
                    <div className="flex justify-center mb-4">
                        <button
                            onClick={() => setSetUpModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-md font-semibold"
                        >
                            تنظیم قرارداد
                        </button>
                    </div>
                ) : activeUser?.role === "buyer" && (
                    <div className="flex justify-center mb-4">
                        <button
                            onClick={connectWallet}
                            className="bg-slate-700 hover:bg-slate-800 px-5 py-3 rounded-md font-semibold"
                        >
                            اتصال به کیف پول
                        </button>
                    </div>
                )}

                {/* Events */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-lg font-semibold mb-4 text-gray-200">
                        رویداد های اخیر
                    </h3>

                    <ul className="space-y-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                        {events.map((e, i) => (
                            <li
                                key={i}
                                className="bg-white/5 p-4 rounded-xl text-sm border border-white/10 text-gray-300"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-purple-300">
                                        {e.type}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(e.time).toLocaleString("fa-IR")}
                                    </span>
                                </div>

                                <div className="mt-2 space-y-1">
                                    {e.buyer && (
                                        <p>
                                            <strong className="text-white">Buyer:</strong>{" "}
                                            {getUserName(e.buyer)}
                                        </p>
                                    )}
                                    {e.seller && (
                                        <p>
                                            <strong className="text-white">Seller:</strong>{" "}
                                            {getUserName(e.seller)}
                                        </p>
                                    )}
                                    {e.arbiter && (
                                        <p>
                                            <strong className="text-white">Arbiter:</strong>{" "}
                                            {getUserName(e.arbiter)}
                                        </p>
                                    )}
                                    {e.amount && (
                                        <p>
                                            <strong className="text-white">Amount:</strong>{" "}
                                            {e.amount} ETH
                                        </p>
                                    )}
                                    {e.timeStamp && (
                                        <p>
                                            <strong className="text-white">Reset Time:</strong>{" "}
                                            {new Date(
                                                e.timeStamp * 1000
                                            ).toLocaleString("fa-IR")}
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>

                    {events.length === 0 && (
                        <p className="text-gray-400 mt-2 text-sm">
                            No events yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Contract;

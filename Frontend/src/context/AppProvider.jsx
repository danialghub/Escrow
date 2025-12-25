import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";
import { useContract } from "../hooks/useContract";

/* =======================
   Context Initialization
======================= */
const AppContext = createContext();

/* =======================
   Escrow States (Enum-like)
======================= */
const STATES = [
  "AWAITING_PAYMENT",
  "AWAITING_DELIVERY",
];

/* =======================
   Provider Component
======================= */
const AppProvider = ({ children }) => {
  const { connectWallet, contract, account, allAccounts } = useContract();

  /* ---------- UI & Contract States ---------- */
  const [events, setEvents] = useState([]);
  const [balance, setBalance] = useState(null);

  const [arbiter, setArbiter] = useState(null);
  const [seller, setSeller] = useState(null);
  const [buyer, setBuyer] = useState(null);

  const [isTransactionPlaced, setIsTransactionPlaced] = useState(false);
  const [transactionState, setTransactionState] = useState("AWAITING_PAYMENT");

  /* =======================
     Helper Functions
  ======================= */

  // استخراج پیام خطا از revert های متامسک / Ethers
  const getRevertReason = (error) => {
    if (!error) return "Unknown error";

    if (error.reason) return error.reason;
    if (error?.data?.message) return error.data.message;

    if (error.message?.includes("execution reverted")) {
      const match = error.message.match(/"(.*?)"/);
      if (match) return match[1];
    }

    return "Transaction failed";
  };

  // ریست وضعیت تراکنش بعد از Release یا Refund
  const resetTransaction = () => {
    setIsTransactionPlaced(false);
    setTransactionState("AWAITING_PAYMENT");
  };

  // دریافت موجودی یک اکانت
  const getBalance = async (account) => {
    if (!window.ethereum || !account) return "0.00";

    const provider = new ethers.BrowserProvider(window.ethereum);
    const balanceWei = await provider.getBalance(account);
    return parseFloat(ethers.formatEther(balanceWei));
  };

  // نمایش موجودی حساب متصل
  const showBalance = async () => {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (!accounts.length) return setBalance("0.00");

    const bal = await getBalance(accounts[0]);
    setBalance(bal);
  };

  /* =======================
     Contract Actions
  ======================= */

  // واریز ETH به قرارداد
  const deposit = async (amountInEther) => {
    if (!contract || !isTransactionPlaced || transactionState !== "AWAITING_PAYMENT")
      return;

    try {
      const tx = await contract.deposit({
        value: ethers.parseEther(amountInEther),
      });

      await tx.wait();
      setTransactionState("AWAITING_DELIVERY");
      toast.success(`با موفقیت ${amountInEther} اتر واریز شد`);

      showBalance();
    } catch (error) {
      toast.error(getRevertReason(error));
    }
  };

  // آزادسازی وجه برای فروشنده
  const release = async () => {
    if (!contract || !isTransactionPlaced || transactionState !== "AWAITING_DELIVERY")
      return;

    try {
      const tx = await contract.release();
      await tx.wait();

      resetTransaction();
      showBalance();
    } catch (error) {
      toast.error(getRevertReason(error));
    }
  };

  // بازگشت وجه به خریدار
  const refund = async () => {
    if (!contract || !isTransactionPlaced || transactionState !== "AWAITING_DELIVERY")
      return;

    try {
      const tx = await contract.refund();
      await tx.wait();

      resetTransaction();
      showBalance();
    } catch (error) {
      toast.error(getRevertReason(error));
    }
  };

  // تنظیم فروشنده و ناظر (Arbiter)
  const setupEscrow = async (_seller, _arbiter) => {
    if (!contract) return;

    try {
      const tx = await contract.setupEscrow(_seller, _arbiter);
      await tx.wait();

      toast.success("با موفقیت تنظیم شد");
      getState();
      showBalance();
    } catch (error) {
      toast.error(getRevertReason(error));
    }
  };

  /* =======================
     Read Contract State
  ======================= */

  const getState = async () => {
    if (!contract) return;

    const state = await contract.currentState();
    const stateNum = Number(state);

    const arbiter = await contract.arbiter();
    const seller = await contract.seller();
    const buyer = await contract.buyer();

    setTransactionState(STATES[stateNum]);
    setArbiter(arbiter);
    setSeller(seller);
    setBuyer(buyer);

    // بررسی اینکه Escrow ست شده یا نه
    const isPlaced =
      seller !== ethers.ZeroAddress ||
      arbiter !== ethers.ZeroAddress;

    setIsTransactionPlaced(isPlaced);
  };

  /* =======================
     Contract Event Listeners
  ======================= */
  useEffect(() => {
    if (!contract) return;

    contract.removeAllListeners();
    showBalance();

    const pushEvent = (type, data) => {
      setEvents((prev) => [
        ...prev,
        { type, ...data, time: new Date().toISOString() },
      ]);
    };

    contract.on("EscrowSet", (seller, arbiter) =>
      pushEvent("EscrowSetUp", { seller, arbiter })
    );

    contract.on("Funded", (buyer, amount) =>
      pushEvent("FUNDED", { buyer, amount: ethers.formatEther(amount) })
    );

    contract.on("Released", (seller, amount) =>
      pushEvent("RELEASED", { seller, amount: ethers.formatEther(amount) })
    );

    contract.on("Refunded", (seller, amount) =>
      pushEvent("REFUNDED", { seller, amount: ethers.formatEther(amount) })
    );

    contract.on("SessionReset", (buyer, timeStamp) =>
      pushEvent("RESET", { buyer, timeStamp: Number(timeStamp) })
    );

    return () => contract.removeAllListeners();
  }, [contract]);

  useEffect(() => {
    getState();
  }, [contract]);

  /* =======================
     Context Value
  ======================= */
  const value = {
    contract,
    account,
    connectWallet,
    allAccounts,

    deposit,
    release,
    refund,
    setupEscrow,

    showBalance,
    balance,
    events,

    isTransactionPlaced,
    transactionState,

    seller,
    arbiter,
    buyer,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/* =======================
   Custom Hook
======================= */
export const useApp = () => useContext(AppContext);
export default AppProvider;

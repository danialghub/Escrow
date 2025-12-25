import { useState } from "react";
import { ethers } from "ethers";
import { ESCROW_ADDRESS, ESCROW_ABI } from "./contract/escrow";

/* =======================
   Transaction Modal
======================= */
export default function TransactionModal() {
  /* ---------- UI State ---------- */
  const [isOpen, setIsOpen] = useState(false);

  /* ---------- Wallet / Contract State ---------- */
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);

  /* ---------- Form State ---------- */
  const [buyer, setBuyer] = useState("");
  const [seller, setSeller] = useState("");
  const [arbiter, setArbiter] = useState("");
  const [amount, setAmount] = useState("");

  /* =======================
     Load Accounts & Contract
  ======================= */
  const loadAccountsAndContract = async () => {
    if (!window.ethereum) {
      alert("MetaMask در دسترس نیست");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    // دریافت لیست اکانت‌ها
    const list = await provider.listAccounts();
    setAccounts(list.map((acc) => acc.address));

    // ساخت اینستنس قرارداد
    const signer = await provider.getSigner();
    const escrowContract = new ethers.Contract(
      ESCROW_ADDRESS,
      ESCROW_ABI,
      signer
    );

    setContract(escrowContract);
  };

  /* =======================
     Open Modal
  ======================= */
  const openModal = async () => {
    await loadAccountsAndContract();
    setIsOpen(true);
  };

  /* =======================
     Create Transaction
  ======================= */
  const createTransaction = async () => {
    if (!contract) return;

    if (!seller || !arbiter) {
      alert("Seller و Arbiter را انتخاب کنید.");
      return;
    }

    try {
      /* 1) Setup Escrow */
      const setupTx = await contract.setupEscrow(seller, arbiter);
      await setupTx.wait();

      /* 2) Optional Deposit (Buyer) */
      if (buyer && amount) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // فقط Buyer اجازه پرداخت دارد
        if ((await signer.getAddress()) !== buyer) {
          alert("برای پرداخت باید با حساب Buyer وارد شده باشید.");
          return;
        }

        const depositTx = await contract.deposit({
          value: ethers.parseEther(amount),
        });

        await depositTx.wait();
      }

      alert("Transaction created successfully!");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("خطا در ایجاد تراکنش");
    }
  };

  /* =======================
     Render
  ======================= */
  return (
    <div className="w-full">
      {/* Open Button */}
      <button
        onClick={openModal}
        className="px-6 py-3 bg-purple-600 text-white rounded-xl shadow-md hover:bg-purple-700"
      >
        ایجاد تراکنش
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 text-white w-full max-w-lg p-6 rounded-2xl shadow-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">
              ایجاد تراکنش جدید
            </h2>

            {/* Seller */}
            <label className="block mb-2">Seller:</label>
            <select
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="">انتخاب کنید</option>
              {accounts.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>

            {/* Buyer */}
            <label className="block mb-2">
              Buyer (پرداخت‌کننده):
            </label>
            <select
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
              className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="">بدون پرداخت (فقط setup)</option>
              {accounts.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>

            {/* Arbiter */}
            <label className="block mb-2">
              Arbiter (داور):
            </label>
            <select
              value={arbiter}
              onChange={(e) => setArbiter(e.target.value)}
              className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="">انتخاب کنید</option>
              {accounts.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>

            {/* Amount */}
            {buyer && (
              <>
                <label className="block mb-2">
                  مبلغ (ETH):
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="مثلاً 0.5"
                  className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded-lg"
                />
              </>
            )}

            {/* Actions */}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
              >
                بستن
              </button>

              <button
                onClick={createTransaction}
                className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                ایجاد تراکنش
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

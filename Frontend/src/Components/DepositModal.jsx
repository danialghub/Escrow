import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* =======================
   Deposit Modal Component
======================= */
const DepositModal = ({ isOpen, onClose, balance, onConfirm }) => {
  /* ---------- Local State ---------- */
  const [amount, setAmount] = useState("");

  /* =======================
     Handlers
  ======================= */

  // فقط مقادیر عددی مجاز هستند
  const handleChange = (e) => {
    const value = e.target.value;

    // جلوگیری از ورود مقدار غیرعددی
    if (value === "" || !isNaN(value)) {
      setAmount(value);
    }
  };

  /* =======================
     Derived State
  ======================= */

  // غیرفعال شدن دکمه در صورت موجودی ناکافی یا مقدار نامعتبر
  const isDisabled = useMemo(() => {
    const numericAmount = parseFloat(amount);
    const numericBalance = parseFloat(balance);

    if (isNaN(numericAmount)) return true;

    return numericAmount <= 0 || numericAmount > numericBalance;
  }, [amount, balance]);

  /* =======================
     Render
  ======================= */
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{
              duration: 0.35,
              type: "spring",
              stiffness: 250,
              damping: 25,
            }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                       w-11/12 max-w-md bg-white/10 backdrop-blur-xl
                       border border-white/20 rounded-3xl p-6
                       flex flex-col items-center shadow-2xl"
          >
            {/* Header */}
            <h2 className="text-2xl font-bold text-white mb-2">
              Deposit ETH
            </h2>

            <p className="text-gray-300 mb-4">
              Your balance:{" "}
              <span className="text-blue-400 font-semibold">
                {balance} ETH
              </span>
            </p>

            {/* Input */}
            <div className="w-full flex flex-col gap-6">
              <div className="flex flex-col p-5 rounded-2xl transition-all">
                <label className="text-sm text-gray-300 mb-2 font-medium">
                  مقدار پرداخت (ETH)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={handleChange}
                  placeholder="مثلاً 0.5 ETH"
                  className="w-full bg-white/10 text-white placeholder-gray-400 p-3 rounded-xl
                             border border-white/20 focus:outline-none
                             focus:ring-2 focus:ring-green-400
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Warning */}
            <AnimatePresence>
              {isDisabled && amount && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="text-red-400 text-sm mb-4 font-medium"
                >
                  ⚠️ Amount exceeds your balance!
                </motion.p>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex justify-between w-full gap-4 mt-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-800
                           rounded-xl font-semibold transition-all shadow-md"
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                disabled={isDisabled}
                onClick={() => {
                  onConfirm(amount);
                  setAmount("");
                  onClose();
                }}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all shadow-md
                  ${
                    isDisabled
                      ? "bg-gray-700 cursor-not-allowed opacity-50"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
              >
                Confirm
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DepositModal;

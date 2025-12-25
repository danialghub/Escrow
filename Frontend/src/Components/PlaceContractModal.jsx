import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { dummyData } from "../data/dummyData";
import { useApp } from "../context/AppProvider";

/* =======================
   Setup Escrow Modal
======================= */
const SetUpModal = ({ isOpen, onClose, onConfirm }) => {
  const { allAccounts, account } = useApp();

  /* ---------- Local State ---------- */
  const [seller, setSeller] = useState("");
  const [arbiter, setArbiter] = useState("");

  /* =======================
     Derived Data
  ======================= */
  /**
   * کاربران مجاز برای انتخاب فروشنده یا ناظر:
   * - در لیست اکانت‌های متامسک باشند
   * - اکانت فعلی نباشند
   * - role مطابق داشته باشند
   */
  const getMatchedUsers = (role) => {
    if (!allAccounts || !account) return [];

    return dummyData.filter((user) =>
      user.role === role &&
      allAccounts.some(
        (acc) =>
          acc.toLowerCase() === user.address.toLowerCase() &&
          acc.toLowerCase() !== account.toLowerCase()
      )
    );
  };

  const matchedSellers = useMemo(
    () => getMatchedUsers("seller"),
    [allAccounts, account]
  );

  const matchedArbiters = useMemo(
    () => getMatchedUsers("arbiter"),
    [allAccounts, account]
  );

  /* =======================
     Handlers
  ======================= */

  const handleSubmit = () => {
    if (!seller || !arbiter) return;

    onConfirm(seller, arbiter);

    // reset local state
    setSeller("");
    setArbiter("");
    onClose();
  };

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
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.9 }}
            transition={{
              duration: 0.35,
              type: "spring",
              stiffness: 220,
              damping: 25,
            }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                       z-50 w-11/12 max-w-lg 
                       bg-white/10 backdrop-blur-2xl 
                       border border-white/20 rounded-3xl 
                       px-8 py-7 
                       shadow-[0_0_40px_rgba(99,60,255,0.35)]"
          >
            {/* Header */}
            <h2 className="text-3xl font-bold text-white text-center mb-6">
              تنظیم قرارداد Escrow
            </h2>

            {/* Select Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Seller */}
              <div className="flex flex-col bg-white/10 p-5 rounded-2xl border border-white/20 
                              shadow-lg hover:shadow-purple-500/30 transition-all">
                <label className="text-sm text-gray-200 mb-2">
                  انتخاب فروشنده
                </label>

                <select
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  className="bg-white/10 text-white p-3 rounded-xl border border-white/20
                             focus:ring-2 focus:ring-purple-500 outline-none
                             appearance-none cursor-pointer"
                >
                  <option value="" className="text-gray-900">
                    انتخاب فروشنده
                  </option>

                  {matchedSellers.map((user) => (
                    <option
                      key={user.id}
                      value={user.address}
                      className="text-gray-900"
                    >
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Arbiter */}
              <div className="flex flex-col bg-white/10 p-5 rounded-2xl border border-white/20 
                              shadow-lg hover:shadow-blue-500/30 transition-all">
                <label className="text-sm text-gray-200 mb-2">
                  انتخاب ناظر
                </label>

                <select
                  value={arbiter}
                  onChange={(e) => setArbiter(e.target.value)}
                  className="bg-white/10 text-white p-3 rounded-xl border border-white/20
                             focus:ring-2 focus:ring-blue-500 outline-none
                             appearance-none cursor-pointer"
                >
                  <option value="" className="text-gray-900">
                    انتخاب ناظر
                  </option>

                  {matchedArbiters.map((user) => (
                    <option
                      key={user.id}
                      value={user.address}
                      className="text-gray-900"
                    >
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between w-full gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-700/80 hover:bg-gray-800 
                           rounded-xl font-semibold text-white
                           transition-all"
              >
                لغو
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700
                           rounded-xl font-semibold text-white transition-all"
              >
                تایید
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SetUpModal;

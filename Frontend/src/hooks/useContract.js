import { useCallback, useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";

import { EscrowABI, EscrowAddress } from "../utils/Contract";

/* =======================
   Custom Hook: useContract
======================= */
export const useContract = () => {
    /* ---------- Wallet / Contract States ---------- */
    const [account, setAccount] = useState(null);        //(Account[0]) اکانت فعال 
    const [allAccounts, setAllAccounts] = useState(null); // تمام اکانت‌های متصل
    const [contract, setContract] = useState(null);      //Escrow نمونه قرارداد 

    /* =======================
       Connect Wallet (MetaMask)
    ======================= */
    const connectWallet = useCallback(async () => {
        const { ethereum } = window;

        // اگر متامسک نصب نبود
        if (!ethereum) {
            toast.error("MetaMask نصب نیست");
            return;
        }

        try {
            // درخواست دسترسی به اکانت‌ها
            const accounts = await ethereum.request({
                method: "eth_requestAccounts",
            });

            //state ست کردن اکانت‌ها در 
            setAccount(accounts[0]);
            setAllAccounts(accounts);

            //از متامسک Provider و Signer ساخت  
            const provider = new ethers.BrowserProvider(ethereum);
            const signer = await provider.getSigner();

            // ساخت نمونه قرارداد  
            const escrowContract = new ethers.Contract(
                EscrowAddress,
                EscrowABI,
                signer
            );

            setContract(escrowContract);

            console.log("Contract Connected:", escrowContract);
        } catch (error) {
            console.error("Wallet connection failed:", error);
        }
    }, []);

    /* =======================
       Exposed API
    ======================= */
    return {
        connectWallet,
        contract,
        account,
        allAccounts,
    };
};

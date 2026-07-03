/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Wallet, 
  Send, 
  History, 
  Layers, 
  PlusCircle, 
  Download, 
  FileText, 
  Bell, 
  LogOut, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertTriangle,
  ArrowUpRight,
  Menu,
  X,
  ExternalLink,
  User as UserIcon,
  HelpCircle,
  TrendingUp,
  Briefcase,
  Save,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Landmark,
  UploadCloud,
  Mail,
  Phone,
  Table,
  Link2,
  Search,
  Edit,
  Pencil,
  Trash2
} from "lucide-react";
import { User, Order, DepositRequest, Notification, AppSettings, BACKLINK_CATEGORIES, DashboardRow } from "../types.js";
import WeBacklinksLogo, { WeBacklinksSiteIcon } from "./WeBacklinksLogo.js";

interface UserDashboardProps {
  user: User;
  token: string;
  settings: AppSettings;
  onLogout: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

export default function UserDashboard({ user, token, settings, onLogout, onUpdateUser }: UserDashboardProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"main_dashboard" | "dashboard" | "order" | "deposit" | "history" | "profile">("main_dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNewOrderDropdownOpen, setIsNewOrderDropdownOpen] = useState<boolean>(false);

  // States
  const [orders, setOrders] = useState<Order[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Dashboard Table States
  const [dashboardRows, setDashboardRows] = useState<DashboardRow[]>([]);
  const [tableSearch, setTableSearch] = useState<string>("");
  const [loadingTable, setLoadingTable] = useState<boolean>(true);
  const [inventoryTab, setInventoryTab] = useState<string>("");
  
  // Calculator States
  const [calcCategory, setCalcCategory] = useState<string>("");
  const [calcQty, setCalcQty] = useState<number>(10);

  const [orderCategory, setOrderCategory] = useState<string>("Web 2.0");
  const [orderQty, setOrderQty] = useState<number>(100);
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [orderInputMode, setOrderInputMode] = useState<"text" | "file">("text");
  const [orderFile, setOrderFile] = useState<File | null>(null);
  const [orderError, setOrderError] = useState<string>("");
  const [orderSuccess, setOrderSuccess] = useState<string>("");
  const [orderSubmitting, setOrderSubmitting] = useState<boolean>(false);
  const [showPackageRates, setShowPackageRates] = useState<boolean>(false);

  // Top Bar Modals & Dropdown States
  const [showBankModal, setShowBankModal] = useState<boolean>(false);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [showInstantTopUpModal, setShowInstantTopUpModal] = useState<boolean>(false);
  const [showTodayOrdersDropdown, setShowTodayOrdersDropdown] = useState<boolean>(false);

  // Instant Top Up States
  const [instantAmount, setInstantAmount] = useState<string>("");
  const [instantSubmitting, setInstantSubmitting] = useState<boolean>(false);
  const [instantError, setInstantError] = useState<string>("");
  const [showWrongAmountModal, setShowWrongAmountModal] = useState<boolean>(false);
  const [wrongAmountError, setWrongAmountError] = useState<string>("");

  // Deposit Form
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositMethod, setDepositMethod] = useState<string>("Easypaisa");
  const [depositTxn, setDepositTxn] = useState<string>("");
  const [depositFile, setDepositFile] = useState<File | null>(null);
  const [depositError, setDepositError] = useState<string>("");
  const [depositSuccess, setDepositSuccess] = useState<string>("");
  const [depositSubmitting, setDepositSubmitting] = useState<boolean>(false);

  // Profile Form States
  const [profileName, setProfileName] = useState<string>(user.name);
  const [profilePhone, setProfilePhone] = useState<string>(user.phone);
  const [profileAvatar, setProfileAvatar] = useState<string>(user.avatar || "");
  const [profilePassword, setProfilePassword] = useState<string>("");
  const [profileSuccess, setProfileSuccess] = useState<string>("");
  const [profileError, setProfileError] = useState<string>("");
  const [profileSubmitting, setProfileSubmitting] = useState<boolean>(false);

  // User Bank Details States
  const [userBankName, setUserBankName] = useState<string>(user.userBankName || "");
  const [userAccountTitle, setUserAccountTitle] = useState<string>(user.userAccountTitle || "");
  const [userAccountNumber, setUserAccountNumber] = useState<string>(user.userAccountNumber || "");
  const [bankSuccess, setBankSuccess] = useState<string>("");
  const [bankError, setBankError] = useState<string>("");
  const [bankSubmitting, setBankSubmitting] = useState<boolean>(false);
  const [isEditingBank, setIsEditingBank] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [bankDeleting, setBankDeleting] = useState<boolean>(false);
  const hasBankDetails = !!(user.userBankName?.trim() && user.userAccountTitle?.trim() && user.userAccountNumber?.trim());

  // Congrats Success Modal States
  const [showCongratsModal, setShowCongratsModal] = useState<boolean>(false);
  const [congratsType, setCongratsType] = useState<"order" | "deposit">("order");
  const [congratsDetails, setCongratsDetails] = useState<string>("");

  // Copy helper
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const handleCopyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const handleExportCSV = () => {
    // 1. If admin has uploaded a custom file, download it!
    if (settings?.domainListFile) {
      try {
        const base64Data = settings.domainListFile;
        const fileName = settings.domainListFileName || "WeBacklinks_Domain_Inventory.csv";
        
        // Split if it contains data URI prefix
        const parts = base64Data.split(",");
        const content = parts.length > 1 ? parts[1] : parts[0];
        
        const raw = window.atob(content);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        
        for (let i = 0; i < rawLength; i++) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        
        const mimeType = base64Data.match(/data:([^;]+);/)?.[1] || "application/octet-stream";
        const blob = new Blob([uInt8Array], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      } catch (err) {
        console.error("Failed to download custom domain list file, falling back to generated CSV:", err);
      }
    }

    // 2. If admin has specified an external sheet link but no file is attached, open it
    if (settings?.domainListUrl) {
      window.open(settings.domainListUrl, "_blank");
      return;
    }

    // 3. Fallback: Dynamic CSV generation
    if (!dashboardRows || dashboardRows.length === 0) return;
    const headers = ["Category", "DA", "DR", "Price"];
    const csvRows = [headers.join(",")];
    for (const r of dashboardRows) {
      const categoryEscaped = `"${r.category.replace(/"/g, '""')}"`;
      csvRows.push([categoryEscaped, r.da, r.dr, r.price].join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `WeBacklinks_Domain_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setProfileAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileSubmitting(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          avatar: profileAvatar,
          password: profilePassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Profile update failed.");
      }

      setProfileSuccess("🎉 Profile and avatar updated successfully!");
      setProfilePassword("");
      onUpdateUser(data.user);
      setTimeout(() => setProfileSuccess(""), 3500);
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handleBankDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankError("");
    setBankSuccess("");
    setBankSubmitting(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName || user.name,
          phone: profilePhone || user.phone,
          avatar: profileAvatar || user.avatar,
          userBankName,
          userAccountTitle,
          userAccountNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update bank details.");
      }

      setBankSuccess("🎉 Your payment bank account details have been updated successfully!");
      setIsEditingBank(false);
      onUpdateUser(data.user);
      setTimeout(() => setBankSuccess(""), 4000);
    } catch (err: any) {
      setBankError(err.message);
    } finally {
      setBankSubmitting(false);
    }
  };

  const handleBankDetailsDelete = async () => {
    setBankError("");
    setBankSuccess("");
    setBankDeleting(true);

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName || user.name,
          phone: profilePhone || user.phone,
          avatar: profileAvatar || user.avatar,
          userBankName: "",
          userAccountTitle: "",
          userAccountNumber: "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete bank details.");
      }

      setBankSuccess("🗑️ Your payment bank account details have been deleted successfully.");
      setIsEditingBank(false);
      setUserBankName("");
      setUserAccountTitle("");
      setUserAccountNumber("");
      onUpdateUser(data.user);
      setTimeout(() => setBankSuccess(""), 4000);
    } catch (err: any) {
      setBankError(err.message);
    } finally {
      setBankDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleConfigureBankClick = () => {
    setShowBankModal(false);
    setActiveTab("profile");
    setTimeout(() => {
      const element = document.getElementById("bank-details-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  };

  // Auto calculate order costs
  const activeCatItem = (settings.categories || []).find(c => c.name === orderCategory);
  const priceEach = activeCatItem ? activeCatItem.price : (settings.prices[orderCategory] || 10);
  const subtotal = orderQty * priceEach;
  const remainingBalance = user.balance - subtotal;
  const isInsufficient = user.balance < subtotal;

  const table1Rows = (dashboardRows || []).filter(r => {
    if (!r.status || r.status.trim() === "") return false;
    
    const catLower = r.category.toLowerCase();
    const isGuestOrPremium = 
      (r.tab && (r.tab.toLowerCase().includes("guest") || r.tab.toLowerCase().includes("premium"))) ||
      catLower.includes("guest") || 
      catLower.includes("premium");

    if (isGuestOrPremium) return false;

    return (
      r.category.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (r.da && String(r.da).toLowerCase().includes(tableSearch.toLowerCase())) ||
      (r.dr && String(r.dr).toLowerCase().includes(tableSearch.toLowerCase())) ||
      (r.status && r.status.toLowerCase().includes(tableSearch.toLowerCase()))
    );
  });

  const table2Rows = (dashboardRows || []).filter(r => {
    if (!r.status || r.status.trim() === "") return false;
    
    const catLower = r.category.toLowerCase();
    const isGuestOrPremium = 
      (r.tab && (r.tab.toLowerCase().includes("guest") || r.tab.toLowerCase().includes("premium"))) ||
      catLower.includes("guest") || 
      catLower.includes("premium");

    if (!isGuestOrPremium) return false;

    return (
      r.category.toLowerCase().includes(tableSearch.toLowerCase()) ||
      (r.da && String(r.da).toLowerCase().includes(tableSearch.toLowerCase())) ||
      (r.dr && String(r.dr).toLowerCase().includes(tableSearch.toLowerCase())) ||
      (r.status && r.status.toLowerCase().includes(tableSearch.toLowerCase()))
    );
  });

  const filteredRows = [...table1Rows, ...table2Rows];

  useEffect(() => {
    const tabs = settings?.customTabs || ["Authority Backlinks", "High DA Guest Posts"];
    if (tabs.length > 0 && !inventoryTab) {
      setInventoryTab(tabs[0]);
    }
  }, [settings, inventoryTab]);

  useEffect(() => {
    fetchUserData();
    if (activeTab === "order") {
      setIsNewOrderDropdownOpen(true);
    }
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUserData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (activeTab !== "profile") {
      setProfileName(user.name);
      setProfilePhone(user.phone);
      setProfileAvatar(user.avatar || "");
    }
  }, [user, activeTab]);

  useEffect(() => {
    setUserBankName(user.userBankName || "");
    setUserAccountTitle(user.userAccountTitle || "");
    setUserAccountNumber(user.userAccountNumber || "");
  }, [user.userBankName, user.userAccountTitle, user.userAccountNumber]);

  useEffect(() => {
    if (showInstantTopUpModal || showTopUpModal) {
      fetchUserData();
    }
  }, [showInstantTopUpModal, showTopUpModal]);

  const fetchUserData = async (silent: boolean = false) => {
    try {
      if (!silent) setLoadingTable(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      const [ordersRes, depositsRes, notifsRes, tableRes, meRes] = await Promise.all([
        fetch("/api/orders", { headers }),
        fetch("/api/deposits", { headers }),
        fetch("/api/notifications", { headers }),
        fetch("/api/dashboard-rows", { headers }),
        fetch("/api/auth/me", { headers }),
      ]);

      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (depositsRes.ok) setDeposits(await depositsRes.json());
      if (notifsRes.ok) setNotifications(await notifsRes.json());
      if (tableRes.ok) {
        const rows = await tableRes.json();
        setDashboardRows(rows);
        if (rows && rows.length > 0) {
          setCalcCategory(rows[0].category);
        }
      }
      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user) {
          onUpdateUser(meData.user);
        }
      }
    } catch (e) {
      console.error("Failed to load user data logs:", e);
    } finally {
      if (!silent) setLoadingTable(false);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");
    setOrderSuccess("");

    if (isInsufficient) {
      setOrderError("Insufficient Credit. Please Deposit First.");
      return;
    }

    // Input mode validations
    if (orderInputMode === "text" && !orderNotes.trim()) {
      setOrderError("Please enter your target URL and anchor text / campaign instructions.");
      return;
    }

    if (orderInputMode === "file" && !orderFile) {
      setOrderError("Please upload a sheet or text file containing your campaign data.");
      return;
    }

    // Minimum validations
    const highMinCategories = [
      "Web 2.0",
      "Web 2.0 Profile",
      "Web Directories",
      "Wiki Related Sites",
      "Social Bookmarking",
    ];

    if (highMinCategories.includes(orderCategory)) {
      if (orderQty < 100) {
        setOrderError(`Minimum quantity rules: This category requires at least 100 backlinks.`);
        return;
      }
    } else {
      if (orderQty < 50) {
        setOrderError(`Minimum overall order quantity rule: A minimum of 50 links is required.`);
        return;
      }
    }

    setOrderSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("category", orderCategory);
      formData.append("quantity", String(orderQty));
      
      if (orderInputMode === "text") {
        formData.append("notes", orderNotes);
      } else if (orderInputMode === "file" && orderFile) {
        formData.append("file", orderFile);
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Order submission failed.");
      }

      onUpdateUser({ ...user, balance: data.balance });
      setOrderNotes("");
      setOrderFile(null);
      
      // Open Congrats Modal with detailed message
      setCongratsType("order");
      setCongratsDetails(`Your premium SEO Backlink Campaign order for ${orderQty} × ${orderCategory} has been deployed successfully! ${settings.currency} ${subtotal.toLocaleString()} was deducted from your wallet credit balance.`);
      setShowCongratsModal(true);

      // Soft refresh in the background so they see updated counts instantly
      fetchUserData();

      // Automatically hide the congrats modal after 3 seconds and return to dashboard hub
      setTimeout(() => {
        setShowCongratsModal(false);
        setActiveTab("dashboard");
      }, 3000);
    } catch (err: any) {
      setOrderError(err.message);
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError("");
    setDepositSuccess("");

    const parsedAmount = parseFloat(depositAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setDepositError("Please enter a valid deposit amount.");
      return;
    }

    setDepositSubmitting(true);

    const formData = new FormData();
    formData.append("amount", depositAmount);
    formData.append("paymentMethod", depositMethod);
    formData.append("transactionId", depositTxn || "N/A");
    if (depositFile) {
      formData.append("screenshot", depositFile);
    }

    try {
      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        const isHtml = text.trim().startsWith("<");
        const cleanMessage = isHtml ? `Server error (Status ${res.status}): Please make sure all details and screenshots are correct.` : text;
        throw new Error(cleanMessage || `Request failed with status code ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Deposit request failed.");
      }

      setDepositAmount("");
      setDepositTxn("");
      setDepositFile(null);
      
      // Close top up modal if it was open
      setShowTopUpModal(false);

      // Open Congrats Modal with detailed message
      setCongratsType("deposit");
      const txnDisplay = depositTxn ? `Txn ID: ${depositTxn}` : "No TID provided";
      setCongratsDetails(`Your wallet deposit request for ${settings.currency} ${parseFloat(depositAmount || "0").toLocaleString()} (${txnDisplay}) has been logged successfully! The finance auditing team will inspect your payment details and add credits to your wallet instantly.`);
      setShowCongratsModal(true);

      // Soft refresh in the background so they see updated status instantly
      fetchUserData();

      // Automatically hide the congrats modal after 3 seconds and return to dashboard hub
      setTimeout(() => {
        setShowCongratsModal(false);
        setActiveTab("dashboard");
      }, 3000);
    } catch (err: any) {
      setDepositError(err.message);
    } finally {
      setDepositSubmitting(false);
    }
  };

  const handleInstantTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInstantError("");

    const parsedAmount = parseFloat(instantAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setInstantError("Please enter a valid deposit amount.");
      return;
    }

    const approvedLimit = user.approvedTopUpAmount || 0;
    if (parsedAmount > approvedLimit) {
      setWrongAmountError(`You have entered an incorrect amount. Your approved top up limit is ${settings.currency} ${approvedLimit.toLocaleString()}.`);
      setShowWrongAmountModal(true);
      return;
    }

    setInstantSubmitting(true);

    try {
      const res = await fetch("/api/users/instant-topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: instantAmount }),
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Instant top up failed.");
      }

      setInstantAmount("");
      
      // Close instant top up modal
      setShowInstantTopUpModal(false);

      // Open Congrats Modal with detailed message
      setCongratsType("deposit");
      setCongratsDetails(`Your wallet has been topped up successfully with ${settings.currency} ${parsedAmount.toLocaleString()}!`);
      setShowCongratsModal(true);

      // Call onUpdateUser to update user balance in state
      if (data.user) {
        onUpdateUser(data.user);
      }

      // Soft refresh in the background
      fetchUserData();

      // Automatically hide the congrats modal after 3 seconds and return to dashboard hub
      setTimeout(() => {
        setShowCongratsModal(false);
        setActiveTab("dashboard");
      }, 3000);
    } catch (err: any) {
      setInstantError(err.message);
    } finally {
      setInstantSubmitting(false);
    }
  };

  // Export any list to CSV/Excel compatible sheet
  const exportToExcel = (data: any[], headers: string[], keys: string[], filename: string) => {
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...data.map(row => keys.map(key => {
        let val = row[key];
        if (val === undefined || val === null) return '""';
        if (key.toLowerCase().includes("date") || key.toLowerCase().includes("createdat")) {
          try {
            val = new Date(val).toLocaleString();
          } catch(e) {}
        }
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      }).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename + ".csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] uppercase font-bold tracking-tighter"><Clock size={11} /> Pending</span>;
      case "in_progress":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] uppercase font-bold tracking-tighter"><TrendingUp size={11} /> In Progress</span>;
      case "completed":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] uppercase font-bold tracking-tighter"><CheckCircle size={11} /> Completed</span>;
      case "cancelled":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] uppercase font-bold tracking-tighter"><XCircle size={11} /> Cancelled</span>;
      case "approved":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] uppercase font-bold tracking-tighter"><CheckCircle size={11} /> Approved</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] uppercase font-bold tracking-tighter"><XCircle size={11} /> Rejected</span>;
      default:
        return <span className="text-[10px] text-slate-500 font-mono uppercase">{status}</span>;
    }
  };

  const pendingCount = orders.filter(o => o.status === "pending" || o.status === "in_progress").length;
  const completedCount = orders.filter(o => o.status === "completed").length;
  const totalSpent = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + o.totalCost, 0);

  // Today's orders
  const todayStr = new Date().toDateString();
  const todaysOrders = orders.filter(o => {
    try {
      return new Date(o.createdAt).toDateString() === todayStr;
    } catch(e) {
      return false;
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-700 font-sans">
      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden md:flex md:w-[240px] bg-white border-r border-slate-200 flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-center items-center h-20">
          <WeBacklinksLogo className="h-10 object-contain" />
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6 space-y-3 bg-slate-50/40">
          <div className="bg-slate-100 p-2 rounded-2xl border border-slate-200/60 space-y-1.5">
            <button
              id="nav-user-main-dash"
              onClick={() => setActiveTab("main_dashboard")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "main_dashboard"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
              }`}
            >
              <Table size={13} />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-user-dash"
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
              }`}
            >
              <Layers size={13} />
              <span>Overview</span>
            </button>
            
            {/* New Order Parent Button */}
            <button
              id="nav-user-order-parent"
              onClick={() => setIsNewOrderDropdownOpen(!isNewOrderDropdownOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "order"
                  ? "bg-blue-50/70 text-blue-700 border-blue-200"
                  : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PlusCircle size={13} className={activeTab === "order" ? "text-blue-600" : ""} />
                <span>New Order</span>
              </div>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${
                  isNewOrderDropdownOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                }`}
              />
            </button>

            {/* Sub Category - Category Backlinks */}
            {isNewOrderDropdownOpen && (
              <div className="pl-2.5 pr-1 py-1 space-y-1 bg-slate-100/30 rounded-lg border border-slate-200/40 animate-slide-down">
                <button
                  id="nav-user-order-sub"
                  onClick={() => setActiveTab("order")}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                    activeTab === "order"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200/50 hover:bg-slate-100"
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full shrink-0 ${activeTab === "order" ? "bg-white animate-pulse" : "bg-blue-500"}`} />
                  <span>Categories</span>
                </button>
              </div>
            )}

            <button
              id="nav-user-history"
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "history"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
              }`}
            >
              <History size={13} />
              <span>Order History</span>
            </button>

            <button
              id="nav-user-profile"
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "profile"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
              }`}
            >
              <UserIcon size={13} />
              <span>My Profile</span>
            </button>


          </div>
        </nav>

        {/* Support & Credits at bottom of Desktop Sidebar */}
        <div className="mt-auto border-t border-slate-100 flex flex-col">
          <div className="mx-4 my-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/50 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Direct Support Desk</p>
            <a
              href={`mailto:${settings.contactEmail}`}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 break-all transition-colors block underline decoration-blue-500/20"
            >
              {settings.contactEmail}
            </a>
          </div>
          <div className="p-4 pt-1 pb-4 flex flex-col gap-2 items-center justify-center">
            <a
              href="https://wa.me/923235854582"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all w-full text-center shadow-xs shadow-emerald-500/10 cursor-pointer"
            >
              <Phone size={11} />
              <span>Support on WhatsApp</span>
            </a>
            <div className="text-[10px] text-slate-400 select-none">
              Designed by{" "}
              <a
                href="https://ondigix.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-extrabold uppercase tracking-wider transition-colors hover:underline"
              >
                Ondigix
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-white border-b border-slate-200 text-slate-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <WeBacklinksLogo className="h-7 object-contain" />
        <div className="flex items-center gap-2">
          <div className="text-right mr-2">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Balance</div>
            <div className="text-xs font-bold text-slate-900">
              {settings.currency} {user.balance.toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[61px] bg-white z-40 flex flex-col p-6 animate-fade-in text-slate-700 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <WeBacklinksLogo className="h-7 object-contain" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Client Portal</span>
          </div>
          {/* Go to Main Website Link */}
          <a
            href="https://webacklinks.com/"
            className="w-full flex items-center justify-center gap-2 p-3 mb-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all"
          >
            <ExternalLink size={14} />
            <span>Go to Main Website</span>
          </a>

          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl mb-3">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 border border-blue-500 flex items-center justify-center text-white font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-xs font-semibold text-slate-900">{user.name}</div>
              <div className="text-[10px] text-slate-500">{user.email}</div>
            </div>
          </div>

          {/* Quick Action Buttons for Bank Details and Top Up on Mobile */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => { setShowBankModal(true); setMobileMenuOpen(false); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-xs border ${
                hasBankDetails
                  ? "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                  : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 animate-pulse"
              }`}
            >
              <Landmark size={14} className={hasBankDetails ? "text-slate-600" : "text-red-600"} />
              <span>Add Fund</span>
            </button>
            <button
              onClick={() => { setShowInstantTopUpModal(true); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-xs"
            >
              <PlusCircle size={14} className="text-blue-600 animate-pulse" />
              <span>Top Up Wallet</span>
            </button>
          </div>

          <nav className="flex-1 space-y-3 bg-slate-50/40 p-1">
            <div className="bg-slate-100 p-2 rounded-2xl border border-slate-200/60 space-y-1.5">
              <button
                onClick={() => { setActiveTab("main_dashboard"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  activeTab === "main_dashboard"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
                }`}
              >
                <Table size={13} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
                }`}
              >
                <Layers size={13} />
                <span>Overview</span>
              </button>
              {/* New Order Parent Button for Mobile */}
              <button
                onClick={() => setIsNewOrderDropdownOpen(!isNewOrderDropdownOpen)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  activeTab === "order"
                    ? "bg-blue-50/70 text-blue-700 border-blue-200"
                    : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PlusCircle size={13} className={activeTab === "order" ? "text-blue-600" : ""} />
                  <span>New Order</span>
                </div>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${
                    isNewOrderDropdownOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                  }`}
                />
              </button>

              {/* Sub Category for Mobile */}
              {isNewOrderDropdownOpen && (
                <div className="pl-2.5 pr-1 py-1 space-y-1 bg-slate-100/30 rounded-lg border border-slate-200/40 animate-slide-down">
                  <button
                    onClick={() => { setActiveTab("order"); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                      activeTab === "order"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200/50 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`w-1 h-1 rounded-full shrink-0 ${activeTab === "order" ? "bg-white animate-pulse" : "bg-blue-500"}`} />
                    <span>Category Backlinks</span>
                  </button>
                </div>
              )}
              <button
                onClick={() => { setActiveTab("history"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
                }`}
              >
                <History size={13} />
                <span>Order History</span>
              </button>
              <button
                onClick={() => { setActiveTab("profile"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
                }`}
              >
                <UserIcon size={13} />
                <span>My Profile</span>
              </button>

            </div>
          </nav>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-3 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold uppercase tracking-widest mt-auto mb-4"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>

          {/* Mobile Drawer Support & Credits */}
          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Support: <a href={`mailto:${settings.contactEmail}`} className="text-blue-600 hover:underline break-all">{settings.contactEmail}</a></p>
            <div className="flex flex-col items-center gap-2 justify-center">
              <a
                href="https://wa.me/923235854582"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-xs"
              >
                <Phone size={11} />
                <span>Support on WhatsApp</span>
              </a>
              <p className="text-[10px] text-slate-400">
                Designed by{" "}
                <a
                  href="https://ondigix.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-extrabold uppercase tracking-wider transition-colors hover:underline"
                >
                  Ondigix
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP CONTENT COLUMN */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* DESKTOP TOP HEADER BAR */}
        <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-200 px-6 lg:px-8 py-4 sticky top-0 z-30 shadow-xs">
          {/* Main Top Bar Actions - Left Aligned */}
          <div className="flex-1 flex flex-wrap items-center gap-4 lg:gap-6">
            {/* 1. Add Fund */}
            <button
              onClick={() => setShowBankModal(true)}
              className={`flex items-center gap-2 transition-all font-semibold text-xs cursor-pointer group shrink-0 ${
                hasBankDetails
                  ? "text-slate-800 hover:text-blue-600"
                  : "text-red-600 hover:text-red-700 font-bold animate-pulse"
              }`}
            >
              <Landmark
                size={16}
                className={
                  hasBankDetails
                    ? "text-slate-800 group-hover:text-blue-600 transition-colors"
                    : "text-red-600"
                }
              />
              <span className={`underline ${
                hasBankDetails
                  ? "decoration-slate-300 group-hover:decoration-blue-600"
                  : "decoration-red-400 group-hover:decoration-red-600"
              }`}>
                Add Fund
              </span>
            </button>

            {/* Vertical Divider */}
            <div className="w-px h-4 bg-slate-200 shrink-0" />

            {/* 3. Balance */}
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 shrink-0">
              <Wallet size={16} className="text-blue-600" />
              <span>
                Balance:{" "}
                <span className="font-bold text-slate-900">
                  {user.balance.toLocaleString()} <span className="text-red-600 font-extrabold">Cr</span>
                </span>
              </span>
            </div>

            {/* Vertical Divider */}
            <div className="w-px h-4 bg-slate-200 shrink-0" />

            {/* 4. Today's Orders Dropdown Trigger */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowTodayOrdersDropdown(!showTodayOrdersDropdown)}
                className="flex items-center gap-2 px-3 lg:px-4 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <Clock size={15} className="text-slate-800" />
                <span className="hidden lg:inline">Today's Orders ({todaysOrders.length})</span>
                <span className="inline lg:hidden">Orders ({todaysOrders.length})</span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${showTodayOrdersDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* Today's Orders Popover Dropdown */}
              {showTodayOrdersDropdown && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-fade-in text-slate-700">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Today's Orders</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-bold">{todaysOrders.length} placed</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 px-2 mt-1">
                    {todaysOrders.length === 0 ? (
                      <div className="p-4 text-center text-[11px] text-slate-400 italic">No orders submitted today.</div>
                    ) : (
                      todaysOrders.map(o => (
                        <div key={o.id} className="p-2 hover:bg-slate-50 rounded-lg text-left text-xs transition-colors">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span className="truncate max-w-[120px]">{o.category}</span>
                            <span className="text-blue-600 font-mono font-bold">{settings.currency} {o.totalCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>Qty: {o.quantity}</span>
                            <span className="uppercase text-[9px] font-bold">{o.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-3 pt-2 mt-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setActiveTab("history");
                        setShowTodayOrdersDropdown(false);
                      }}
                      className="w-full py-1.5 text-center text-[10px] uppercase tracking-wider text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                    >
                      View All Logs &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-none flex items-center gap-2 lg:gap-3 justify-end ml-4">
            {/* Go to Main Website Button */}
            <a
              href="https://webacklinks.com/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all uppercase tracking-wider shrink-0"
              title="Go to Main Website"
            >
              <ExternalLink size={14} />
              <span className="hidden xl:inline">Go to Main Website</span>
              <span className="inline xl:hidden">Website</span>
            </a>

            {/* User Profile Trigger */}
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                activeTab === "profile"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden lg:inline max-w-[100px] truncate">{user.name}</span>
            </button>

            {/* Logout Trigger */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut size={12} />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* MAIN VIEWPORT PANEL */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
          {/* MOBILE ONLY TOP BAR SHORTCUTS */}
          <div className="md:hidden flex flex-wrap items-center justify-around gap-4 p-4 bg-white border border-slate-200 rounded-2xl mb-6 shadow-xs">
            <button
              onClick={() => setShowBankModal(true)}
              className={`flex items-center gap-1.5 font-semibold text-[11px] cursor-pointer ${
                hasBankDetails
                  ? "text-slate-800 hover:text-blue-600"
                  : "text-red-600 hover:text-red-700 font-bold"
              }`}
            >
              <Landmark size={15} className={hasBankDetails ? "text-slate-800" : "text-red-600 animate-pulse"} />
              <span className={`underline ${hasBankDetails ? "" : "decoration-red-500 font-bold"}`}>Add Fund</span>
            </button>



            <div className="flex items-center gap-1.5 font-semibold text-[11px] text-slate-800">
              <Wallet size={15} className="text-blue-600" />
              <span>Bal: <span className="font-bold text-slate-900">{user.balance.toLocaleString()} <span className="text-red-600 font-extrabold">Cr</span></span></span>
            </div>
          </div>
        {/* --- TAB: DASHBOARD TABLE --- */}
        {activeTab === "main_dashboard" && (
          <div className="space-y-6 animate-fade-in">
            {/* Quick Action Bar (Smaller Buttons in One Row) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2.5 pl-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">Campaign Tools</span>
              </div>
              
              <div className="grid grid-cols-3 sm:flex sm:flex-row items-center gap-1.5 w-full sm:w-auto">
                {/* New Order */}
                <button
                  onClick={() => setActiveTab("order")}
                  className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[9px] xs:text-[10px] md:text-xs font-extrabold uppercase tracking-widest shadow-xs transition-all cursor-pointer active:scale-95 text-center truncate"
                >
                  <PlusCircle size={12} className="shrink-0" />
                  <span>New Order</span>
                </button>

                {/* Export Button */}
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center justify-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[9px] xs:text-[10px] md:text-xs font-extrabold uppercase tracking-widest shadow-xs transition-all cursor-pointer active:scale-95 text-center truncate"
                >
                  <Download size={12} className="shrink-0" />
                  <span>Export</span>
                </button>

                {/* Sheet Link Button */}
                <button
                  onClick={() => {
                    const sheetLink = settings?.domainListUrl || `${window.location.origin}/api/dashboard-rows`;
                    handleCopyToClipboard(sheetLink, "inventory_copied");
                  }}
                  className="inline-flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-[9px] xs:text-[10px] md:text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer active:scale-95 text-center truncate"
                >
                  {copiedField === "inventory_copied" ? (
                    <>
                      <Check size={12} className="text-emerald-500 animate-bounce shrink-0" />
                      <span className="text-emerald-600 font-extrabold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Link2 size={12} className="text-slate-500 shrink-0" />
                      <span>Sheet Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {loadingTable ? (
              <div className="py-24 bg-white rounded-3xl border border-slate-200/80 shadow-md flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading inventory data...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                {/* --- TABLE 1: AUTHORITY BACKLINKS INVENTORY --- */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="p-1 rounded-lg bg-blue-50 text-blue-600"><Table size={13} /></span>
                        Authority Backlinks
                      </h2>
                      <p className="text-[10px] text-slate-400 mt-0.5">High power links to supercharge domain authority and search visibility</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-extrabold shrink-0">
                      {table1Rows.length} Active
                    </span>
                  </div>

                  {table1Rows.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50/20">
                      <p className="text-xs text-slate-400 font-semibold">No standard backlinks available matching your search.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop view */}
                      <div className="hidden md:block w-full overflow-hidden p-3 bg-slate-50/20">
                        <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-2xs table-fixed">
                          <thead>
                            <tr className="bg-gradient-to-r from-slate-800 to-slate-900 text-slate-200 text-[10px] font-extrabold uppercase tracking-wider">
                              <th className="px-2 py-2.5 text-center w-[6%]">#</th>
                              <th className="px-2 py-2.5 w-[41%]">Category Name</th>
                              <th className="px-2 py-2.5 text-center w-[9%]">DA</th>
                              <th className="px-2 py-2.5 text-center w-[18%]">Price</th>
                              <th className="px-2 py-2.5 text-center w-[10%]">Total</th>
                              <th className="px-2 py-2.5 text-center w-[16%]">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {table1Rows.map((row, idx) => (
                              <tr key={row.id} className="hover:bg-slate-50/85 transition-colors text-[11px] md:text-xs font-semibold text-slate-700 animate-fade-in">
                                <td className="px-2 py-2.5 text-center font-mono text-slate-400 bg-slate-50/10 border-r border-slate-100 truncate">{idx + 1}</td>
                                <td className="px-2 py-2.5 font-bold text-slate-900 truncate" title={row.category}>{row.category}</td>
                                <td className="px-1 py-2.5 text-center">
                                  <span className="inline-block px-1.5 py-0.5 font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] md:text-xs">
                                    {row.da}
                                  </span>
                                </td>
                                <td className="px-1 py-2.5 text-center font-black text-slate-900 font-mono text-[10px] md:text-xs truncate">
                                  {row.price && String(row.price).trim() !== "" ? (
                                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 inline-block truncate max-w-full">
                                      {row.price} <span className="text-[9px] font-extrabold text-red-600">Cr</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-normal italic">-</span>
                                  )}
                                </td>
                                <td className="px-1 py-2.5 text-center font-bold text-slate-500 font-mono text-[10px] md:text-[11px] truncate">
                                  {row.total && String(row.total).trim() !== "" ? row.total : <span className="text-slate-400 font-normal italic">-</span>}
                                </td>
                                <td className="px-1 py-2.5 text-center">
                                  <div className="flex items-center justify-center">
                                    {String(row.status).toLowerCase().includes("coming soon") ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[9px] md:text-[10px] border border-amber-100 uppercase tracking-wide truncate max-w-full" title={row.status}>
                                        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                        <span className="truncate">{row.status}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[9px] md:text-[10px] border border-emerald-100 uppercase tracking-wide truncate max-w-full" title={row.status}>
                                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                        <span className="truncate">{row.status}</span>
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile view (Sleek cards layout) */}
                      <div className="md:hidden p-4 bg-slate-50/30 space-y-3">
                        {table1Rows.map((row, idx) => (
                          <div key={row.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">#{idx + 1}</span>
                                <h4 className="text-xs font-extrabold text-slate-900 leading-snug">{row.category}</h4>
                              </div>
                              {String(row.status).toLowerCase().includes("coming soon") ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-bold text-[9px] border border-amber-100 uppercase tracking-wider shrink-0">
                                  {row.status}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[9px] border border-emerald-100 uppercase tracking-wider shrink-0">
                                  {row.status}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-[11px]">
                              <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50/50 rounded-lg">
                                <span className="text-[10px] text-slate-400 font-bold">DA</span>
                                <span className="font-mono font-black text-indigo-700">{row.da}</span>
                              </div>
                              <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50/50 rounded-lg">
                                <span className="text-[10px] text-slate-400 font-bold">Price</span>
                                <span className="font-mono font-black text-emerald-700">{row.price} <span className="text-red-600 font-extrabold">Cr</span></span>
                              </div>
                            </div>
                            
                            {row.total && String(row.total).trim() !== "" && (
                              <div className="text-[10px] text-slate-400 font-bold flex justify-between items-center bg-slate-50/30 p-2 rounded-lg">
                                <span>Total Domains</span>
                                <span className="text-slate-700 font-mono">{row.total}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* --- TABLE 2: HIGH-DA GUEST POSTS & PREMIUM BLOGS --- */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="p-1 rounded-lg bg-violet-50 text-violet-600"><Layers size={13} /></span>
                        High DA Guest Posts
                      </h2>
                      <p className="text-[10px] text-slate-400 mt-0.5">High authority editorial guest posts and targeted contextual placements</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-extrabold shrink-0">
                      {table2Rows.length} Active
                    </span>
                  </div>

                  {table2Rows.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50/20">
                      <p className="text-xs text-slate-400 font-semibold">No guest posts available matching your search.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop view */}
                      <div className="hidden md:block w-full overflow-hidden p-3 bg-slate-50/20">
                        <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-2xs table-fixed">
                          <thead>
                            <tr className="bg-gradient-to-r from-slate-800 to-slate-900 text-slate-200 text-[10px] font-extrabold uppercase tracking-wider">
                              <th className="px-2 py-2.5 text-center w-[6%]">#</th>
                              <th className="px-2 py-2.5 w-[41%]">Category Name / Blog Topic</th>
                              <th className="px-2 py-2.5 text-center w-[9%]">DA</th>
                              <th className="px-2 py-2.5 text-center w-[18%]">Price</th>
                              <th className="px-2 py-2.5 text-center w-[10%]">Total</th>
                              <th className="px-2 py-2.5 text-center w-[16%]">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {table2Rows.map((row, idx) => (
                              <tr key={row.id} className="hover:bg-slate-50/85 transition-colors text-[11px] md:text-xs font-semibold text-slate-700 animate-fade-in">
                                <td className="px-2 py-2.5 text-center font-mono text-slate-400 bg-slate-50/10 border-r border-slate-100 truncate">{idx + 1}</td>
                                <td className="px-2 py-2.5 font-bold text-slate-900 truncate" title={row.category}>{row.category}</td>
                                <td className="px-1 py-2.5 text-center">
                                  <span className="inline-block px-1.5 py-0.5 font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] md:text-xs">
                                    {row.da}
                                  </span>
                                </td>
                                <td className="px-1 py-2.5 text-center font-black text-slate-900 font-mono text-[10px] md:text-xs truncate">
                                  {row.price && String(row.price).trim() !== "" ? (
                                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 inline-block truncate max-w-full">
                                      {row.price} <span className="text-[9px] font-extrabold text-red-600">Cr</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-normal italic">-</span>
                                  )}
                                </td>
                                <td className="px-1 py-2.5 text-center font-bold text-slate-500 font-mono text-[10px] md:text-[11px] truncate">
                                  {row.total && String(row.total).trim() !== "" ? row.total : <span className="text-slate-400 font-normal italic">-</span>}
                                </td>
                                <td className="px-1 py-2.5 text-center">
                                  <div className="flex items-center justify-center">
                                    {String(row.status).toLowerCase().includes("coming soon") ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[9px] md:text-[10px] border border-amber-100 uppercase tracking-wide truncate max-w-full" title={row.status}>
                                        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                        <span className="truncate">{row.status}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[9px] md:text-[10px] border border-emerald-100 uppercase tracking-wide truncate max-w-full" title={row.status}>
                                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                        <span className="truncate">{row.status}</span>
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile view (Sleek cards layout) */}
                      <div className="md:hidden p-4 bg-slate-50/30 space-y-3">
                        {table2Rows.map((row, idx) => (
                          <div key={row.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">#{idx + 1}</span>
                                <h4 className="text-xs font-extrabold text-slate-900 leading-snug">{row.category}</h4>
                              </div>
                              {String(row.status).toLowerCase().includes("coming soon") ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-bold text-[9px] border border-amber-100 uppercase tracking-wider shrink-0">
                                  {row.status}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[9px] border border-emerald-100 uppercase tracking-wider shrink-0">
                                  {row.status}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 text-[11px]">
                              <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50/50 rounded-lg">
                                <span className="text-[10px] text-slate-400 font-bold">DA</span>
                                <span className="font-mono font-black text-indigo-700">{row.da}</span>
                              </div>
                              <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50/50 rounded-lg">
                                <span className="text-[10px] text-slate-400 font-bold">Price</span>
                                <span className="font-mono font-black text-emerald-700">{row.price} <span className="text-red-600 font-extrabold">Cr</span></span>
                              </div>
                            </div>
                            
                            {row.total && String(row.total).trim() !== "" && (
                              <div className="text-[10px] text-slate-400 font-bold flex justify-between items-center bg-slate-50/30 p-2 rounded-lg">
                                <span>Total Domains</span>
                                <span className="text-slate-700 font-mono">{row.total}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: DASHBOARD HUB --- */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in">


            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Spent Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-200/80 flex flex-col justify-between shadow-xs transition-all hover:scale-[1.01]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-blue-700/80 font-bold font-sans">Total Spent</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <TrendingUp size={14} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-slate-900 font-sans">
                    {settings.currency} {totalSpent.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-2 font-medium">Spent on completed orders</div>
                </div>
              </div>

              {/* Pending Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200/80 flex flex-col justify-between shadow-xs transition-all hover:scale-[1.01]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-amber-700/80 font-bold font-sans">Pending Orders</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                    <Clock size={14} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-slate-900 font-sans">
                    {pendingCount}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-2 font-medium">Active campaigns</div>
                </div>
              </div>

              {/* Completed Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 flex flex-col justify-between shadow-xs transition-all hover:scale-[1.01]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-emerald-700/80 font-bold font-sans">Completed</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                    <CheckCircle size={14} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-slate-900 font-sans">
                    {completedCount}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wide mt-2 font-medium">Delivered reports</div>
                </div>
              </div>

              {/* Spent Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col justify-center items-center group cursor-pointer hover:brightness-105 transition-all shadow-md hover:scale-[1.01] border-transparent" onClick={() => setActiveTab("order")}>
                <span className="text-xs uppercase tracking-widest font-bold text-white mb-1">+ New Order</span>
                <span className="text-[10px] text-blue-100/80 text-center font-sans">Deploy automated premium campaign</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Recent Orders & Reports */}
              <div className="lg:col-span-8 space-y-8">
                {/* PDF Reports Card */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-4">
                    <FileText size={14} className="text-blue-500" />
                    Latest PDF Backlink Reports
                  </h3>
                  {orders.filter(o => o.status === "completed" && o.pdfReport).length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Your completed orders will deliver secure PDF reports here.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                      {orders
                        .filter(o => o.status === "completed" && o.pdfReport)
                        .map((o) => (
                          <div key={o.id} className="py-3 flex items-center justify-between text-xs group">
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 truncate block">
                                {o.quantity} × {o.category}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">ID: #{o.id} • Completed {o.completionDate ? new Date(o.completionDate).toLocaleDateString() : ""}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {o.pdfReport ? (
                                <a
                                  href={`/api/orders/${o.id}/download-pdf?token=${token}`}
                                  className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-[10px] uppercase tracking-wider font-bold transition-colors"
                                  download
                                >
                                  <Download size={12} /> Download Report
                                </a>
                              ) : o.deliveryLink ? (
                                <a
                                  href={o.deliveryLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-[10px] uppercase tracking-wider font-bold transition-colors"
                                  title="View Public Sheet"
                                >
                                  <ExternalLink size={12} /> View Sheet Link
                                </a>
                              ) : null}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Recent Orders Table */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col shadow-xs">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Recent Submissions</h3>
                    <button 
                      onClick={() => setActiveTab("history")}
                      className="text-[10px] uppercase tracking-wider text-blue-600 hover:text-blue-800 font-bold transition-colors"
                    >
                      View All History
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">No orders placed yet. Get started by placing your first backlinks order!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                            <th className="pb-3 font-semibold">Order ID</th>
                            <th className="pb-3 font-semibold">Category</th>
                            <th className="pb-3 font-semibold">Qty</th>
                            <th className="pb-3 font-semibold">Cost</th>
                            <th className="pb-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {orders.slice(0, 5).map((o) => (
                            <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 font-mono text-[11px] text-slate-600">#{o.id}</td>
                              <td className="py-3.5 font-semibold text-slate-800">{o.category}</td>
                              <td className="py-3.5">{o.quantity.toLocaleString()}</td>
                              <td className="py-3.5 text-slate-900 font-bold font-mono">{settings.currency} {o.totalCost.toLocaleString()}</td>
                              <td className="py-3.5">{getStatusBadge(o.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Alerts and Notifications */}
              <div className="lg:col-span-4 space-y-8">
                {/* Notification Feed */}
                <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col h-full max-h-[460px] shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
                      <Bell size={14} className="text-blue-500" />
                      Notifications
                      {notifications.filter(n => !n.read).length > 0 && (
                        <span className="w-4 h-4 bg-red-500 rounded text-[9px] text-white flex items-center justify-center font-bold">
                          {notifications.filter(n => !n.read).length}
                        </span>
                      )}
                    </h3>
                    {notifications.filter(n => !n.read).length > 0 && (
                      <button
                        onClick={markNotificationsAsRead}
                        className="text-[10px] uppercase tracking-wider text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="p-8 text-center my-auto">
                      <p className="text-[10px] uppercase tracking-wider text-slate-600">No system notifications received yet.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3 rounded-lg border transition-colors ${
                            n.read 
                              ? "bg-slate-50 border-slate-200 text-slate-400" 
                              : "bg-blue-50 border-blue-100 text-slate-800"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`font-bold text-xs ${n.read ? "text-slate-500" : "text-slate-800"}`}>{n.title}</span>
                            <span className="text-[9px] text-slate-400 font-mono shrink-0">{new Date(n.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className={`text-xs mt-1.5 leading-relaxed ${n.read ? "text-slate-400" : "text-slate-600"}`}>{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assistance Info Card */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white flex flex-col justify-between relative overflow-hidden shadow-xl border border-blue-500/20">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
                  <div className="relative z-10">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-2">
                      Need Assistance?
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      If you have specific niche instructions or bulk requests (&gt;10k backlinks), please contact our operations desk.
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-800/80 relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Direct Support Desk</span>
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold tracking-wide transition-all shadow-md shadow-blue-600/20 w-full justify-center group"
                    >
                      <Mail size={16} className="text-blue-200 group-hover:scale-110 transition-transform" />
                      <span>{settings.contactEmail}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: PLACE BACKLINKS ORDER --- */}
        {activeTab === "order" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
              <h1 className="font-sans text-2xl font-bold text-slate-800 tracking-tight">
                Submit New Backlinks Campaign
              </h1>
              <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">Order high-quality backlink packages immediately using your pre-funded wallet balance.</p>
            </div>

            {orderSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs tracking-wide leading-relaxed" id="order-success-msg">
                {orderSuccess}
              </div>
            )}

            {orderError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs tracking-wide leading-relaxed" id="order-error-msg">
                {orderError}
              </div>
            )}

            {user.balance <= 0 ? (
              <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider">Insufficient Credit. Please Deposit First.</h4>
                    <p className="text-xs mt-1 text-slate-600">
                      Your current wallet balance is {settings.currency} {user.balance.toLocaleString()}. You cannot submit any order.
                    </p>
                    <button
                      onClick={() => setActiveTab("deposit")}
                      className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] uppercase font-bold tracking-widest transition-colors cursor-pointer"
                    >
                      Go to Deposit Request
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-3 p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <form onSubmit={handleOrderSubmit} className="space-y-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-900 font-bold mb-2">
                        Backlink Category Package
                      </label>
                      <select
                        id="order-category"
                        value={orderCategory}
                        onChange={(e) => {
                          setOrderCategory(e.target.value);
                          // Set standard minimums automatically from configuration
                          const chosenCat = (settings.categories || []).find(c => c.name === e.target.value);
                          if (chosenCat) {
                            setOrderQty(Math.max(chosenCat.minLimit, orderQty));
                          } else {
                            const highMin = [
                              "Web 2.0",
                              "Web 2.0 Profile",
                              "Web Directories",
                              "Wiki Related Sites",
                              "Social Bookmarking",
                            ];
                            if (highMin.includes(e.target.value)) {
                              setOrderQty(Math.max(100, orderQty));
                            } else {
                              setOrderQty(Math.max(50, orderQty));
                            }
                          }
                        }}
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 font-medium text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      >
                        {((settings.categories && settings.categories.length > 0)
                          ? settings.categories
                          : BACKLINK_CATEGORIES.map(name => ({
                              name,
                              price: settings.prices[name] || 10,
                              minLimit: ["Web 2.0", "Web 2.0 Profile", "Web Directories", "Wiki Related Sites", "Social Bookmarking"].includes(name) ? 100 : 50,
                              maxLimit: 10000
                            }))
                        ).map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.name} ({settings.currency} {cat.price} each)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-900 font-bold mb-2">
                        Order Quantity
                      </label>
                      <input
                        id="order-quantity"
                        type="number"
                        required
                        value={orderQty}
                        onChange={(e) => setOrderQty(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                      <div className="mt-2">
                        {activeCatItem ? (
                          <p className="text-[10px] text-blue-600 uppercase font-semibold flex items-center gap-1">
                            <HelpCircle size={11} /> Min limit: {activeCatItem.minLimit.toLocaleString()} links • Max limit: {activeCatItem.maxLimit.toLocaleString()} links
                          </p>
                        ) : [
                          "Web 2.0",
                          "Web 2.0 Profile",
                          "Web Directories",
                          "Wiki Related Sites",
                          "Social Bookmarking"
                        ].includes(orderCategory) ? (
                          <p className="text-[10px] text-amber-600 uppercase font-semibold flex items-center gap-1">
                            <AlertTriangle size={11} /> Minimum selectable for this package is 100 links.
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <HelpCircle size={11} /> Minimum overall quantity rule is 50 links.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-900 font-bold mb-3">
                        Campaign Details Submission Mode
                      </label>
                      <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/60 mb-4">
                        <button
                          type="button"
                          onClick={() => setOrderInputMode("text")}
                          className={`py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                            orderInputMode === "text"
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:text-slate-800"
                          }`}
                        >
                          <span>✍️ Type Manually</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOrderInputMode("file")}
                          className={`py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                            orderInputMode === "file"
                              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:text-slate-800"
                          }`}
                        >
                          <span>📁 Upload Campaign File</span>
                        </button>
                      </div>

                      {orderInputMode === "text" ? (
                        <div className="animate-fade-in">
                          <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                            Target URL & Anchor Texts / Notes
                          </label>
                          <textarea
                            id="order-notes"
                            required
                            rows={4}
                            placeholder="Format example:&#10;URL: https://mywebsite.com&#10;Keywords: buy backpacks, hiking gears"
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors placeholder-slate-400"
                          ></textarea>
                        </div>
                      ) : (
                        <div className="space-y-2 animate-fade-in">
                          <label className="block text-[10px] uppercase tracking-widest text-slate-900 font-bold mb-2">
                            Upload Sheet/Text Campaign File
                          </label>
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                setOrderFile(e.dataTransfer.files[0]);
                              }
                            }}
                            className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/10 rounded-2xl p-6 text-center transition-all cursor-pointer relative"
                            onClick={() => document.getElementById("campaign-file-input")?.click()}
                          >
                            <input
                              id="campaign-file-input"
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setOrderFile(e.target.files[0]);
                                }
                              }}
                            />
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                                <PlusCircle size={18} />
                              </div>
                              {orderFile ? (
                                <div>
                                  <p className="text-xs font-bold text-slate-800 break-all">{orderFile.name}</p>
                                  <p className="text-[10px] text-slate-700 font-mono mt-0.5">{(orderFile.size / 1024).toFixed(1)} KB • Click or Drag to replace</p>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-xs font-bold text-slate-600">Drag & drop your campaign file here</p>
                                  <p className="text-[10px] text-slate-800 mt-1 uppercase tracking-wider font-bold">or click to browse any format file from your device</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      id="order-submit-btn"
                      type="submit"
                      disabled={orderSubmitting || isInsufficient}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {orderSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send size={14} />
                          <span>Submit Order Campaign</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Calculation Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Summary Card */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl">
                    {/* Visual top accent bar */}
                    <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 absolute top-0 left-0 right-0" />
                    
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText size={16} />
                        </div>
                        <h3 className="text-xs uppercase tracking-widest text-slate-500 font-extrabold">
                          Cost Breakdown
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        Invoice Draft
                      </span>
                    </div>

                    {/* Order Details Segment */}
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3 mb-4">
                      <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Order Details</div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Quantity</span>
                        <span className="font-mono text-xs font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-100 shadow-2xs">
                          {orderQty.toLocaleString()} Links
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Price Per Link</span>
                        <span className="font-mono text-xs font-extrabold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-100 shadow-2xs">
                          {settings.currency} {priceEach.toLocaleString()}
                        </span>
                      </div>

                      <div className="border-t border-dashed border-slate-200 my-2 pt-2 flex justify-between items-center">
                        <span className="text-xs text-slate-700 font-bold">Order Subtotal</span>
                        <span className="font-mono text-sm font-extrabold text-indigo-600 bg-indigo-50/70 px-3 py-1 rounded-lg border border-indigo-100/60">
                          {settings.currency} {subtotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Financial Summary Segment */}
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
                      <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Financial Status</div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Current Wallet Balance</span>
                        <span className="font-mono font-bold text-slate-800">
                          {settings.currency} {user.balance.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">Order Cost Deduction</span>
                        <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100/50 text-[11px]">
                          - {settings.currency} {subtotal.toLocaleString()}
                        </span>
                      </div>

                      {/* Visual Balance Usage Progress Meter */}
                      {user.balance > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Wallet Usage</span>
                            <span>{Math.min(100, Math.round((subtotal / user.balance) * 100))}%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isInsufficient 
                                  ? "bg-red-500 w-full animate-pulse" 
                                  : "bg-gradient-to-r from-blue-500 to-indigo-600"
                              }`}
                              style={{ width: `${Math.min(100, (subtotal / user.balance) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="border-t border-dashed border-slate-200 pt-3 mt-1">
                        <div className={`p-3 rounded-xl flex justify-between items-center ${
                          remainingBalance < 0 
                            ? "bg-red-50 border border-red-100 text-red-900" 
                            : "bg-emerald-50/80 border border-emerald-100/60 text-emerald-900"
                        }`}>
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {remainingBalance < 0 ? "Shortfall Amount" : "Post-Order Balance"}
                          </span>
                          <span className={`font-mono text-sm font-black ${
                            remainingBalance < 0 ? "text-red-600" : "text-emerald-600"
                          }`}>
                            {settings.currency} {remainingBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isInsufficient && (
                      <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-rose-50 to-red-50 border border-red-200/60 text-[10px] text-red-700 font-extrabold uppercase tracking-widest text-center flex items-center justify-center gap-2 shadow-inner">
                        <AlertTriangle size={12} className="text-red-600 shrink-0 animate-bounce" />
                        <span>Insufficient Wallet Credit. Deposit Required.</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing Help Grid (Popup Modal style) */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-xs text-center">
                    <p className="text-[10px] text-blue-500 uppercase tracking-widest font-bold mb-2">Need to Check Pricing?</p>
                    <button
                      type="button"
                      onClick={() => setShowPackageRates(true)}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-blue-200 text-blue-700 font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>📋 View Pricing & Limits Matrix</span>
                    </button>
                  </div>

                  {showPackageRates && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in" id="package-rates-modal">
                      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-zoom-in">
                        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📋</span>
                            <div>
                              <h3 className="font-sans font-bold text-sm leading-none text-white">WeBacklinks Pricing Matrix</h3>
                              <p className="text-[9px] text-blue-100/75 uppercase tracking-widest font-mono mt-1">Official packages & quantity boundaries</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPackageRates(false)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <div className="p-6 max-h-[400px] overflow-y-auto space-y-3">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[9px] font-bold">
                                  <th className="pb-2">Package Category</th>
                                  <th className="pb-2 text-center">Price Per Link</th>
                                  <th className="pb-2 text-center">Min Qty</th>
                                  <th className="pb-2 text-center">Max Qty</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {((settings.categories && settings.categories.length > 0)
                                  ? settings.categories
                                  : BACKLINK_CATEGORIES.map(cat => ({ name: cat, price: settings.prices[cat] || 10, minLimit: 50, maxLimit: 5000 }))
                                ).map((cat: any) => (
                                  <tr key={cat.name} className="hover:bg-slate-50">
                                    <td className="py-2.5 font-bold text-slate-800">{cat.name}</td>
                                    <td className="py-2.5 text-center font-bold text-blue-600 font-mono">{cat.price} <span className="text-red-600 font-extrabold">Cr</span></td>
                                    <td className="py-2.5 text-center font-mono text-slate-500">{(cat.minLimit || 50).toLocaleString()}</td>
                                    <td className="py-2.5 text-center font-mono text-slate-500">{(cat.maxLimit || 5000).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                          <button
                            type="button"
                            onClick={() => setShowPackageRates(false)}
                            className="py-2 px-6 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                          >
                            Got it, Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB: REQUEST DEPOSIT --- */}
        {activeTab === "deposit" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
              <h1 className="font-sans text-2xl font-bold text-slate-800 tracking-tight">
                Request Wallet Deposit
              </h1>
              <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">Follow the payment transfer instructions below and log your deposit transaction to update your credits.</p>
            </div>

            {depositSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs tracking-wide leading-relaxed" id="deposit-success-msg">
                {depositSuccess}
              </div>
            )}

            {depositError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs tracking-wide leading-relaxed" id="deposit-error-msg">
                {depositError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Payment Instructions Column */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-slate-50 via-slate-100/40 to-blue-50/20 border border-slate-200/80 shadow-md flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      <span>Transfer Instructions</span>
                    </h3>
                    <div className="text-[11px] text-slate-600 leading-relaxed bg-gradient-to-r from-blue-500/5 to-indigo-500/5 p-4 rounded-2xl border border-blue-100/50 space-y-2.5 font-medium shadow-2xs">
                      <p>1. Transfer the exact deposit amount to any of the verified bank accounts listed below.</p>
                      <p>2. Save or screenshot the transaction confirmation / transfer receipt.</p>
                      <p>3. Submit the deposit request form with your account name, transaction ID, and upload the receipt proof.</p>
                      <p>4. Our accounts team will instantly audit the receipt and credit your wallet balance.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-4 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      <span>Verified Bank Accounts</span>
                    </h3>
                    {(!settings.bankAccounts || settings.bankAccounts.length === 0) ? (
                      <p className="text-[11px] text-slate-400 italic">No bank accounts configured by administrator yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {settings.bankAccounts.map((acc, index) => {
                          const themes = [
                            {
                              border: "border-amber-200/80 hover:border-amber-400 bg-gradient-to-br from-amber-50/10 to-white",
                              headerBg: "bg-gradient-to-r from-amber-50/70 to-orange-50/30 border-b border-amber-200/50",
                              iconBg: "bg-amber-500/10 text-amber-600",
                              badge: "text-amber-600 bg-amber-50 border-amber-100/50"
                            },
                            {
                              border: "border-blue-200/80 hover:border-blue-400 bg-gradient-to-br from-blue-50/10 to-white",
                              headerBg: "bg-gradient-to-r from-blue-50/70 to-indigo-50/30 border-b border-blue-200/50",
                              iconBg: "bg-blue-500/10 text-blue-600",
                              badge: "text-blue-600 bg-blue-50 border-blue-100/50"
                            },
                            {
                              border: "border-emerald-200/80 hover:border-emerald-400 bg-gradient-to-br from-emerald-50/10 to-white",
                              headerBg: "bg-gradient-to-r from-emerald-50/70 to-teal-50/30 border-b border-emerald-200/50",
                              iconBg: "bg-emerald-500/10 text-emerald-600",
                              badge: "text-emerald-600 bg-emerald-50 border-emerald-100/50"
                            },
                            {
                              border: "border-purple-200/80 hover:border-purple-400 bg-gradient-to-br from-purple-50/10 to-white",
                              headerBg: "bg-gradient-to-r from-purple-50/70 to-violet-50/30 border-b border-purple-200/50",
                              iconBg: "bg-purple-500/10 text-purple-600",
                              badge: "text-purple-600 bg-purple-50 border-purple-100/50"
                            },
                            {
                              border: "border-rose-200/80 hover:border-rose-400 bg-gradient-to-br from-rose-50/10 to-white",
                              headerBg: "bg-gradient-to-r from-rose-50/70 to-pink-50/30 border-b border-rose-200/50",
                              iconBg: "bg-rose-500/10 text-rose-600",
                              badge: "text-rose-600 bg-rose-50 border-rose-100/50"
                            }
                          ];
                          const theme = themes[index % themes.length];
                          return (
                            <div key={acc.id || index} className={`p-0 rounded-2xl border ${theme.border} shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden text-left font-sans`}>
                              {/* Header banner of the card */}
                              <div className={`${theme.headerBg} px-4 py-3 flex justify-between items-center`}>
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 ${theme.iconBg} rounded-lg`}>
                                    <Landmark size={14} className="animate-pulse" />
                                  </div>
                                  <span className="text-xs font-extrabold text-slate-800 tracking-tight uppercase font-sans">{acc.bankName}</span>
                                </div>
                                <span className={`text-[9px] font-extrabold ${theme.badge} px-2.5 py-0.5 rounded-full uppercase`}>Account {index + 1}</span>
                              </div>
                            
                            {/* Rows list of bank details */}
                            <div className="p-4 space-y-3 bg-gradient-to-b from-white to-slate-50/40">
                              {/* Account Name Row */}
                              <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-100/80 shadow-2xs hover:bg-slate-50/30 transition-colors">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Account Title</span>
                                  <span className="text-xs font-bold text-slate-800 font-sans leading-tight truncate">{acc.accountName}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyToClipboard(acc.accountName, `${acc.id}-name`)}
                                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer active:scale-95 ${
                                    copiedField === `${acc.id}-name`
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                      : "bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200 hover:border-blue-200"
                                  }`}
                                >
                                  {copiedField === `${acc.id}-name` ? (
                                    <>
                                      <Check size={11} className="text-emerald-500 animate-bounce" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Account Number Row */}
                              <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-100/80 shadow-2xs hover:bg-slate-50/30 transition-colors">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Account Number</span>
                                  <span className="text-xs font-black text-slate-800 font-mono tracking-wide leading-tight select-all truncate">{acc.accountNumber}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyToClipboard(acc.accountNumber, `${acc.id}-number`)}
                                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer active:scale-95 ${
                                    copiedField === `${acc.id}-number`
                                      ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                      : "bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200 hover:border-blue-200"
                                  }`}
                                >
                                  {copiedField === `${acc.id}-number` ? (
                                    <>
                                      <Check size={11} className="text-emerald-500 animate-bounce" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* IBAN Row if present */}
                              {acc.iban && (
                                <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-100/80 shadow-2xs hover:bg-slate-50/30 transition-colors">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">IBAN</span>
                                    <span className="text-xs font-bold text-slate-800 font-mono tracking-tight leading-tight select-all truncate max-w-[150px]">{acc.iban}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToClipboard(acc.iban, `${acc.id}-iban`)}
                                    className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer active:scale-95 ${
                                      copiedField === `${acc.id}-iban`
                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                        : "bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200 hover:border-blue-200"
                                    }`}
                                  >
                                    {copiedField === `${acc.id}-iban` ? (
                                      <>
                                        <Check size={11} className="text-emerald-500 animate-bounce" />
                                        <span>Copied</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={11} />
                                        <span>Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 text-[10px] uppercase tracking-wider text-slate-500 leading-relaxed">
                  <span className="font-bold text-amber-600 block mb-1">Manual Credit Auditing:</span>
                  Deposit requests are checked against bank ledger sheets manually. Crediting usually resolves in 15–60 minutes.
                </div>
              </div>

              {/* Deposit Form Column */}
              <div className="lg:col-span-3 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-white via-slate-50/50 to-blue-50/10 border border-slate-200/80 shadow-md">
                <form onSubmit={handleDepositSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user.name}
                        className="w-full px-4 py-3 rounded-xl bg-slate-100/70 border border-slate-200 text-slate-500 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-2">
                        Your Email
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="w-full px-4 py-3 rounded-xl bg-slate-100/70 border border-slate-200 text-slate-500 text-xs font-semibold focus:outline-none break-all"
                      />
                    </div>
                  </div>

                   {/* Your Registered Bank Details card */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span>Your Registered Bank Account Details</span>
                    </span>
                    {user.userBankName ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="bg-amber-50 border border-amber-100/70 p-3 rounded-xl">
                          <span className="block text-[8px] text-amber-600 uppercase font-black tracking-wider mb-0.5">Bank Name</span>
                          <span className="font-bold text-amber-950 text-xs block truncate" title={user.userBankName}>{user.userBankName}</span>
                        </div>
                        <div className="bg-blue-50 border border-blue-100/70 p-3 rounded-xl">
                          <span className="block text-[8px] text-blue-600 uppercase font-black tracking-wider mb-0.5">Account Title</span>
                          <span className="font-bold text-blue-950 text-xs block truncate" title={user.userAccountTitle}>{user.userAccountTitle}</span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100/70 p-3 rounded-xl">
                          <span className="block text-[8px] text-emerald-600 uppercase font-black tracking-wider mb-0.5">Account Number</span>
                          <span className="font-mono font-bold text-emerald-950 text-xs block break-all">{user.userAccountNumber}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-700 font-bold leading-relaxed flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                        <div>
                          You haven't added your bank details yet. Go to the{" "}
                          <button
                            type="button"
                            onClick={() => setActiveTab("profile")}
                            className="underline text-blue-600 hover:text-blue-800 cursor-pointer font-extrabold"
                          >
                            Profile tab
                          </button>{" "}
                          to add them so admin can verify your deposit.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-2">
                        Deposit Amount ({settings.currency}) <span className="text-red-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="deposit-amount"
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 15000"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-semibold shadow-2xs"
                        />
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold font-mono">
                          {settings.currency === "PKR" ? "₨" : settings.currency}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-2">
                        Transaction ID (Txn ID) <span className="text-slate-400 font-mono font-normal">(optional)</span>
                      </label>
                      <input
                        id="deposit-txn"
                        type="text"
                        placeholder="e.g. 5001298457"
                        value={depositTxn}
                        onChange={(e) => setDepositTxn(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono font-bold uppercase tracking-wider shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-2">
                      Payment Screenshot Receipt <span className="text-slate-400 font-mono font-normal">(optional)</span>
                    </label>
                    <div 
                      onClick={() => document.getElementById('deposit-screenshot')?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-500/60 rounded-2xl p-6 bg-white/60 hover:bg-white text-center cursor-pointer transition-all group shadow-2xs flex flex-col items-center justify-center gap-1.5"
                    >
                      <input
                        id="deposit-screenshot"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setDepositFile(e.target.files[0]);
                          }
                        }}
                      />
                      <UploadCloud size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors animate-pulse" />
                      <span className="text-[11px] font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
                        {depositFile ? depositFile.name : "Choose receipt screenshot or drag here"}
                      </span>
                      <span className="text-[9px] text-slate-400">PNG, JPG or JPEG up to 5MB</span>
                    </div>
                  </div>

                  <button
                    id="deposit-submit-btn"
                    type="submit"
                    disabled={depositSubmitting}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-slate-100 disabled:to-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-widest rounded-lg transition-all shadow-md shadow-blue-500/5 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {depositSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Wallet size={14} />
                        <span>Submit Deposit Request</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: ORDER LOGS --- */}
        {activeTab === "history" && (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="font-sans text-2xl font-bold text-slate-800 tracking-tight">
                  Deposit & Order Logs
                </h1>
                <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">Audit complete historic logs. Orders placed, deposit status, and delivery assets are saved here indefinitely.</p>
              </div>
              {orders.length > 0 && (
                <button
                  onClick={() => exportToExcel(
                    orders,
                    ["Order ID", "Date", "Category", "Quantity", "Total Cost", "Status", "Delivery Sheet Link"],
                    ["id", "createdAt", "category", "quantity", "totalCost", "status", "deliveryLink"],
                    "WeBacklinks_My_Orders"
                  )}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <Download size={14} />
                  <span>Export to Excel</span>
                </button>
              )}
            </div>

            {/* Orders Log */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 mb-4">Backlink Orders History</h3>
              {orders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">No orders placed yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-3 font-medium">Order ID</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Category</th>
                        <th className="pb-3 font-medium">Quantity</th>
                        <th className="pb-3 font-medium">Cost</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Deliverables</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 font-mono text-[11px] text-slate-500">#{o.id}</td>
                          <td className="py-3.5 text-slate-400 font-mono text-[11px]">{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 font-bold text-slate-800">{o.category}</td>
                          <td className="py-3.5 font-medium text-slate-700">{o.quantity.toLocaleString()}</td>
                          <td className="py-3.5 font-bold text-slate-900 font-mono">{settings.currency} {o.totalCost.toLocaleString()}</td>
                          <td className="py-3.5">{getStatusBadge(o.status)}</td>
                          <td className="py-3.5">
                            {o.status === "completed" ? (
                              <div className="flex items-center gap-2">
                                {o.pdfReport ? (
                                  <a
                                    href={`/api/orders/${o.id}/download-pdf?token=${token}`}
                                    className="p-1.5 rounded bg-blue-50 border border-blue-200 text-blue-600 hover:text-blue-900 hover:bg-blue-100 transition-colors flex items-center gap-1 text-[10px] font-semibold"
                                    title="Download Report Excel/PDF"
                                    download
                                  >
                                    <Download size={12} />
                                    <span>Download Report</span>
                                  </a>
                                ) : o.deliveryLink ? (
                                  <a
                                    href={o.deliveryLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded bg-blue-50 border border-blue-200 text-blue-600 hover:text-blue-900 hover:bg-blue-100 transition-colors flex items-center gap-1 text-[10px] font-semibold"
                                    title="View Delivery Sheet"
                                  >
                                    <ExternalLink size={12} />
                                    <span>View Sheet Link</span>
                                  </a>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Processing...</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Deposits Log */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">Recharge Deposits History</h3>
                {deposits.length > 0 && (
                  <button
                    onClick={() => exportToExcel(
                      deposits,
                      ["Deposit ID", "Date", "Payment Method", "Transaction ID", "Amount", "Status"],
                      ["id", "createdAt", "paymentMethod", "transactionId", "amount", "status"],
                      "WeBacklinks_My_Deposits"
                    )}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Download size={11} />
                    <span>Export Deposits to Excel</span>
                  </button>
                )}
              </div>
              {deposits.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">No deposit requests submitted yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-3 font-medium">Deposit ID</th>
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Method</th>
                        <th className="pb-3 font-medium">Transaction ID</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {deposits.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 font-mono text-[11px] text-slate-500">#{d.id}</td>
                          <td className="py-3.5 text-slate-400 font-mono text-[11px]">{new Date(d.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 text-slate-800 font-semibold">{d.paymentMethod}</td>
                          <td className="py-3.5 font-mono text-slate-500 text-[11px]">{d.transactionId}</td>
                          <td className="py-3.5 font-bold text-slate-950 font-mono">{settings.currency} {d.amount.toLocaleString()}</td>
                          <td className="py-3.5">{getStatusBadge(d.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}



        {/* --- TAB: PROFILE SETTINGS --- */}
        {activeTab === "profile" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
              <h1 className="font-sans text-2xl font-bold text-slate-800 tracking-tight">
                My Profile Settings
              </h1>
              <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">Manage your identity, secure credentials, and update your personal display avatar.</p>
            </div>

            {profileSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs tracking-wide leading-relaxed">
                {profileSuccess}
              </div>
            )}

            {profileError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs tracking-wide leading-relaxed">
                {profileError}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Card & Avatar Selection Column */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center justify-between text-center space-y-6">
                <div className="space-y-4 w-full">
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold text-left">Your Current Avatar</h3>
                  <div className="flex justify-center py-4">
                    {profileAvatar ? (
                      <img src={profileAvatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 ring-4 ring-blue-500/10" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 border-2 border-white flex items-center justify-center text-white font-medium text-3xl shadow-md">
                        {profileName ? profileName.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{profileName || "User Account"}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                  </div>
                </div>

                <div className="w-full space-y-4">
                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3 text-left">Preset Avatars</h4>
                    <div className="flex flex-wrap gap-2 justify-start">
                      {[
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
                        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80"
                      ].map((presetUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProfileAvatar(presetUrl)}
                          className={`w-10 h-10 rounded-full overflow-hidden border transition-all hover:scale-105 cursor-pointer ${
                            profileAvatar === presetUrl ? "border-blue-500 ring-2 ring-blue-500/30" : "border-slate-200"
                          }`}
                        >
                          <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setProfileAvatar("")}
                        className={`w-10 h-10 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center justify-center ${
                          !profileAvatar ? "border-blue-500 ring-2 ring-blue-500/30" : "border-slate-200"
                        }`}
                        title="Initials avatar"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 text-left">Upload Custom Avatar</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded file:border file:border-slate-200 file:text-[10px] file:uppercase file:font-bold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Account Information Form Column */}
              <div className="lg:col-span-2 p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-3">Update Personal Details</h3>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-900 font-bold mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-900 font-bold mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Security Credentials</h4>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-900 font-bold mb-2">
                        New Security Password <span className="text-slate-700 font-mono font-normal">(Leave blank to keep current)</span>
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                      <p className="text-[10px] text-slate-500 mt-2 font-mono">Password must be at least 6 characters in length.</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileSubmitting}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {profileSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Payment Bank Details Section in Profile */}
            <div id="bank-details-section" className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>
              
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                  <Landmark size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-tight">Payment Bank Account Details</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure your primary bank account. Administrators will verify incoming manual deposits against these details to authorize your credits.
                  </p>
                </div>
              </div>

              {bankSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-bounce-subtle">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black shrink-0">✓</div>
                  <span>{bankSuccess}</span>
                </div>
              )}

              {bankError && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-800 text-xs font-bold flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center font-black shrink-0">!</div>
                  <span>{bankError}</span>
                </div>
              )}

              {hasBankDetails && !isEditingBank ? (
                /* Premium, High-Contrast Multi-Colored Cards with Custom Action Buttons */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Card 1: Bank Name - Amber/Orange theme */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-2xl border border-amber-100/80 p-5 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all duration-300">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                          <Landmark size={14} className="animate-pulse" />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-amber-600 font-extrabold">
                          Bank Name
                        </span>
                      </div>
                      <div className="text-sm font-bold text-amber-900 tracking-wide font-sans line-clamp-2">
                        {user.userBankName}
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Account Title - Indigo/Blue theme */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50/40 rounded-2xl border border-blue-100/80 p-5 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all duration-300">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-blue-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                          <UserIcon size={14} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-blue-600 font-extrabold">
                          Account Title
                        </span>
                      </div>
                      <div className="text-sm font-bold text-blue-900 tracking-wide font-sans line-clamp-2">
                        {user.userAccountTitle}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Account Number - Emerald/Teal theme */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50/40 rounded-2xl border border-emerald-100/80 p-5 shadow-2xs flex flex-col justify-between group hover:shadow-xs transition-all duration-300">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform"></div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <Briefcase size={14} />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-extrabold">
                          Account Number / IBAN
                        </span>
                      </div>
                      <div className="text-sm font-black text-emerald-900 tracking-wider font-mono select-all">
                        {user.userAccountNumber}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons span all or placed nicely */}
                  <div className="md:col-span-3 flex justify-end gap-2.5 mt-2">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserBankName(user.userBankName || "");
                        setUserAccountTitle(user.userAccountTitle || "");
                        setUserAccountNumber(user.userAccountNumber || "");
                        setIsEditingBank(true);
                      }}
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-3xs cursor-pointer flex items-center gap-2 hover:border-indigo-150 active:scale-98"
                    >
                      <Pencil size={12} />
                      <span>Edit Bank Account</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-3xs cursor-pointer flex items-center gap-2 active:scale-98"
                    >
                      <Trash2 size={12} />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Input Form for adding/editing details with spacious fonts */
                <form onSubmit={handleBankDetailsSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-1.5">
                      Your Bank Name <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Meezan Bank, HBL, Allied Bank"
                      value={userBankName}
                      onChange={(e) => setUserBankName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold tracking-wide focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-1.5">
                      Account Holder Name / Title <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Muhammad Ali"
                      value={userAccountTitle}
                      onChange={(e) => setUserAccountTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold tracking-wide focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-extrabold mb-1.5">
                      Account Number or IBAN <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PK73MEZN0023419203847"
                      value={userAccountNumber}
                      onChange={(e) => setUserAccountNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold tracking-widest focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="md:col-span-3 pt-2 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={bankSubmitting}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-slate-100 disabled:to-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-500/5 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {bankSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Landmark size={14} />
                          <span>Save Account Details</span>
                        </>
                      )}
                    </button>

                    {isEditingBank && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserBankName(user.userBankName || "");
                          setUserAccountTitle(user.userAccountTitle || "");
                          setUserAccountNumber(user.userAccountNumber || "");
                          setIsEditingBank(false);
                        }}
                        className="px-6 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- DELETE BANK DETAILS CONFIRMATION MODAL --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in" id="delete-bank-confirm-modal">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-zoom-in p-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 size={32} className="animate-pulse" />
            </div>
            <div className="space-y-3">
              <h3 className="font-sans font-extrabold text-lg text-slate-900 tracking-wide leading-tight">
                Delete Bank Account Details
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed tracking-wide max-w-sm mx-auto">
                Are you sure you want to delete your saved payment bank account details? This will clear your bank name, account title, and account number.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 px-4 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={bankDeleting}
                onClick={handleBankDetailsDelete}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-500/10 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {bankDeleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Details</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BANK DETAILS MODAL --- */}
      {showBankModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in" id="bank-details-modal">
          {!user.userBankName || !user.userAccountTitle || !user.userAccountNumber ? (
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-zoom-in p-6 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 text-red-500 flex items-center justify-center mx-auto shadow-2xs">
                <AlertTriangle size={32} className="animate-pulse" />
              </div>
              <div className="space-y-3">
                <h3 className="font-sans font-extrabold text-lg text-slate-900 tracking-wide leading-tight">
                  Add Sender Bank Account Details
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed tracking-wide max-w-sm mx-auto">
                  Please configure your sender bank details in your profile first. The administrators require your bank account name, title, and number to verify and audit your deposit payments securely.
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleConfigureBankClick}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-500/10 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <UserIcon size={14} />
                  <span>Configure My Bank Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="w-full py-2 px-4 text-slate-500 hover:text-slate-800 font-bold text-xs tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-zoom-in">
              <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                <Landmark size={20} className="text-white" />
                <div>
                  <h3 className="font-sans font-bold text-sm leading-none text-white">Add Fund</h3>
                  <p className="text-[9px] text-blue-100/75 uppercase tracking-widest font-mono mt-1">Official bank channels for deposits</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBankModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 max-h-[420px] overflow-y-auto space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Please transfer your desired credits deposit amount to any of the verified bank accounts listed below. Click the copy buttons to copy titles, account numbers, or IBANs instantly.
              </p>

              {(!settings.bankAccounts || settings.bankAccounts.length === 0) ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No bank accounts configured by administrator yet.</p>
              ) : (
                <div className="space-y-4">
                  {settings.bankAccounts.map((acc, index) => {
                    const themes = [
                      {
                        border: "border-amber-200/80 hover:border-amber-400 bg-gradient-to-br from-amber-50/10 to-white",
                        headerBg: "bg-gradient-to-r from-amber-50/70 to-orange-50/30 border-b border-amber-200/50",
                        iconBg: "bg-amber-500/10 text-amber-600",
                        badge: "text-amber-600 bg-amber-50 border-amber-100/50"
                      },
                      {
                        border: "border-blue-200/80 hover:border-blue-400 bg-gradient-to-br from-blue-50/10 to-white",
                        headerBg: "bg-gradient-to-r from-blue-50/70 to-indigo-50/30 border-b border-blue-200/50",
                        iconBg: "bg-blue-500/10 text-blue-600",
                        badge: "text-blue-600 bg-blue-50 border-blue-100/50"
                      },
                      {
                        border: "border-emerald-200/80 hover:border-emerald-400 bg-gradient-to-br from-emerald-50/10 to-white",
                        headerBg: "bg-gradient-to-r from-emerald-50/70 to-teal-50/30 border-b border-emerald-200/50",
                        iconBg: "bg-emerald-500/10 text-emerald-600",
                        badge: "text-emerald-600 bg-emerald-50 border-emerald-100/50"
                      },
                      {
                        border: "border-purple-200/80 hover:border-purple-400 bg-gradient-to-br from-purple-50/10 to-white",
                        headerBg: "bg-gradient-to-r from-purple-50/70 to-violet-50/30 border-b border-purple-200/50",
                        iconBg: "bg-purple-500/10 text-purple-600",
                        badge: "text-purple-600 bg-purple-50 border-purple-100/50"
                      },
                      {
                        border: "border-rose-200/80 hover:border-rose-400 bg-gradient-to-br from-rose-50/10 to-white",
                        headerBg: "bg-gradient-to-r from-rose-50/70 to-pink-50/30 border-b border-rose-200/50",
                        iconBg: "bg-rose-500/10 text-rose-600",
                        badge: "text-rose-600 bg-rose-50 border-rose-100/50"
                      }
                    ];
                    const theme = themes[index % themes.length];
                    return (
                      <div key={acc.id || index} className={`p-0 rounded-2xl border ${theme.border} shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden text-left font-sans`}>
                        {/* Header banner of the card */}
                        <div className={`${theme.headerBg} px-4 py-3 flex justify-between items-center`}>
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 ${theme.iconBg} rounded-lg`}>
                              <Landmark size={14} className="animate-pulse" />
                            </div>
                            <span className="text-xs font-extrabold text-slate-800 tracking-tight uppercase font-sans">{acc.bankName}</span>
                          </div>
                          <span className={`text-[9px] font-extrabold ${theme.badge} px-2.5 py-0.5 rounded-full uppercase`}>Account {index + 1}</span>
                        </div>
                      
                      {/* Rows list of bank details */}
                      <div className="p-4 space-y-3 bg-gradient-to-b from-white to-slate-50/40">
                        {/* Account Name Row */}
                        <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-100/80 shadow-2xs hover:bg-slate-50/30 transition-colors">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Account Title</span>
                            <span className="text-xs font-bold text-slate-800 font-sans leading-tight truncate">{acc.accountName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyToClipboard(acc.accountName, `${acc.id}-modal-name`)}
                            className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer active:scale-95 ${
                              copiedField === `${acc.id}-modal-name`
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200 hover:border-blue-200"
                            }`}
                          >
                            {copiedField === `${acc.id}-modal-name` ? (
                              <>
                                <Check size={11} className="text-emerald-500 animate-bounce" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Account Number Row */}
                        <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-100/80 shadow-2xs hover:bg-slate-50/30 transition-colors">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Account Number</span>
                            <span className="text-xs font-black text-slate-800 font-mono tracking-wide leading-tight select-all truncate">{acc.accountNumber}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyToClipboard(acc.accountNumber, `${acc.id}-modal-number`)}
                            className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer active:scale-95 ${
                              copiedField === `${acc.id}-modal-number`
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200 hover:border-blue-200"
                            }`}
                          >
                            {copiedField === `${acc.id}-modal-number` ? (
                              <>
                                <Check size={11} className="text-emerald-500 animate-bounce" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* IBAN Row if present */}
                        {acc.iban && (
                          <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-100/80 shadow-2xs hover:bg-slate-50/30 transition-colors">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">IBAN</span>
                              <span className="text-xs font-bold text-slate-800 font-mono tracking-tight leading-tight select-all truncate max-w-[150px]">{acc.iban}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyToClipboard(acc.iban, `${acc.id}-modal-iban`)}
                              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 border rounded-lg text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer active:scale-95 ${
                                copiedField === `${acc.id}-modal-iban`
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                  : "bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200 hover:border-blue-200"
                              }`}
                            >
                              {copiedField === `${acc.id}-modal-iban` ? (
                                <>
                                  <Check size={11} className="text-emerald-500 animate-bounce" />
                                  <span>Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={11} />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBankModal(false)}
                className="py-2 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBankModal(false);
                  setShowTopUpModal(true);
                }}
                className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle size={13} />
                <span>Proceed to Top Up</span>
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* --- MANUAL DEPOSIT LOG MODAL --- */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in" id="topup-request-modal">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl overflow-hidden animate-zoom-in">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PlusCircle size={22} className="text-blue-100" />
                <div>
                  <h3 className="font-sans font-bold text-base leading-none text-white">Log Deposit Top Up</h3>
                  <p className="text-[10px] text-blue-100/85 uppercase tracking-widest font-mono mt-1">Submit transaction details for credit approval</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleDepositSubmit} className="p-6 space-y-5 max-h-[520px] overflow-y-auto text-left bg-gradient-to-b from-white to-slate-50/60">

              {depositError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-shake">
                  <div className="font-bold mb-0.5">Submission Error</div>
                  <div className="font-mono text-[11px] leading-relaxed break-words">{depositError}</div>
                </div>
              )}

              {/* Read-only user info shown in a beautiful slate metadata card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-xs">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">
                    Depositor Name
                  </label>
                  <div className="text-xs font-bold text-slate-700">{user.name}</div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">
                    Depositor Email
                  </label>
                  <div className="text-xs font-bold text-slate-700 break-all">{user.email}</div>
                </div>
              </div>

              {/* Your Registered Bank Details card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-extrabold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span>Your Registered Bank Account Details</span>
                </span>
                {user.userBankName ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-amber-50 border border-amber-100/70 p-3 rounded-xl">
                      <span className="block text-[8px] text-amber-600 uppercase font-black tracking-wider mb-0.5">Bank Name</span>
                      <span className="font-bold text-amber-950 text-xs block truncate" title={user.userBankName}>{user.userBankName}</span>
                    </div>
                    <div className="bg-blue-50 border border-blue-100/70 p-3 rounded-xl">
                      <span className="block text-[8px] text-blue-600 uppercase font-black tracking-wider mb-0.5">Account Title</span>
                      <span className="font-bold text-blue-950 text-xs block truncate" title={user.userAccountTitle}>{user.userAccountTitle}</span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-100/70 p-3 rounded-xl">
                      <span className="block text-[8px] text-emerald-600 uppercase font-black tracking-wider mb-0.5">Account Number</span>
                      <span className="font-mono font-bold text-emerald-950 text-xs block break-all">{user.userAccountNumber}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-700 font-bold leading-relaxed flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                    <div>
                      You haven't added your bank details yet. Please configure them in your{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setShowTopUpModal(false);
                          setActiveTab("profile");
                        }}
                        className="underline text-blue-600 hover:text-blue-800 cursor-pointer font-extrabold"
                      >
                        Profile
                      </button>{" "}
                      tab first.
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-600 font-bold mb-1.5 flex items-center gap-1">
                    <span>Deposit Amount</span>
                    <span className="text-[9px] text-slate-400 font-semibold">({settings.currency})</span>
                  </label>
                  <div className="relative flex items-stretch rounded-xl overflow-hidden border border-slate-200 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all shadow-xs bg-white">
                    <span className="flex items-center justify-center px-3.5 bg-slate-50 border-r border-slate-200 text-slate-500 text-xs font-bold font-mono">
                      {settings.currency === "PKR" ? "₨" : settings.currency}
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 5000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-3 py-3 bg-transparent text-slate-800 text-xs focus:outline-none font-semibold font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-600 font-bold mb-1.5">
                    Transaction Ref / ID <span className="text-slate-400 font-mono font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter unique bank txn ID"
                    value={depositTxn}
                    onChange={(e) => setDepositTxn(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono font-bold uppercase tracking-wider shadow-xs"
                  />
                </div>
              </div>

              {/* Custom Screenshot upload drag-and-drop zone */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-600 font-bold mb-1.5">
                  Upload Screenshot Proof / Receipt
                </label>
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setDepositFile(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => document.getElementById('deposit-screenshot-input')?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-500 bg-white/60 hover:bg-white rounded-2xl p-6 text-center cursor-pointer transition-all group shadow-xs hover:shadow-md flex flex-col items-center justify-center gap-2"
                >
                  <input
                    id="deposit-screenshot-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setDepositFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs group-hover:scale-105 transition-transform">
                    <UploadCloud size={18} />
                  </div>
                  {depositFile ? (
                    <div className="space-y-1 animate-fade-in">
                      <p className="text-xs font-bold text-slate-800 break-all">{depositFile.name}</p>
                      <p className="text-[10px] text-emerald-600 font-bold font-mono">{(depositFile.size / 1024).toFixed(1)} KB • Click or Drag to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-700">Choose receipt screenshot or drag here</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">JPG, PNG format allowed. Max file size 5MB.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowTopUpModal(false);
                    setShowBankModal(true);
                  }}
                  className="text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  &larr; View Verified Bank Accounts
                </button>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowTopUpModal(false)}
                    className="py-2.5 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={depositSubmitting}
                    className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-100 disabled:to-slate-200 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {depositSubmitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Submit Log</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- INSTANT TOP UP MODAL --- */}
      {showInstantTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-fade-in" id="instant-topup-modal">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl overflow-hidden animate-zoom-in">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PlusCircle size={22} className="text-blue-100" />
                <div>
                  <h3 className="font-sans font-bold text-base leading-none text-white">Instant Wallet Top Up</h3>
                  <p className="text-[10px] text-blue-100/85 uppercase tracking-widest font-mono mt-1">Add approved credits to your wallet balance instantly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstantTopUpModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleInstantTopUpSubmit} className="p-6 space-y-5 max-h-[520px] overflow-y-auto text-left bg-gradient-to-b from-white to-slate-50/60">

              {instantError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-shake">
                  <div className="font-bold mb-0.5">Submission Error</div>
                  <div className="font-mono text-[11px] leading-relaxed break-words">{instantError}</div>
                </div>
              )}

              {user.approvedTopUpAmount > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <span className="flex h-3 w-3 mt-1 shrink-0 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider mb-0.5">Approved Limit Ready! 🟢</h4>
                    <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                      Your requested funds have been approved by the admin. You can now type the approved amount of <span className="font-bold">{settings.currency} {user.approvedTopUpAmount.toLocaleString()}</span> (or any amount up to this limit) below to instantly transfer it to your active wallet balance.
                    </p>
                  </div>
                </div>
              )}

              {/* Read-only user info shown in a beautiful slate metadata card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 shadow-xs space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">Client Name:</span>
                  <span className="font-bold text-slate-700">{user.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
                  <span className="text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">Approved Top Up Limit:</span>
                  <span className="font-extrabold text-blue-600 font-mono text-sm bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">
                    {settings.currency} {(user.approvedTopUpAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Deposit amount and payment method gateway */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-600 font-bold mb-1.5 flex items-center gap-1">
                  <span>Enter Amount to Top Up</span>
                  <span className="text-[9px] text-slate-400 font-semibold">({settings.currency})</span>
                </label>
                <div className="relative flex items-stretch rounded-xl overflow-hidden border border-slate-200 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all shadow-xs bg-white">
                  <span className="flex items-center justify-center px-3.5 bg-slate-50 border-r border-slate-200 text-slate-500 text-xs font-bold font-mono">
                    {settings.currency === "PKR" ? "₨" : settings.currency}
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={instantAmount}
                    onChange={(e) => setInstantAmount(e.target.value)}
                    className="w-full px-3 py-3 bg-transparent text-slate-800 text-xs focus:outline-none font-semibold font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Note: You cannot top up more than your approved limit of <span className="font-bold text-slate-600">{settings.currency} {(user.approvedTopUpAmount || 0).toLocaleString()}</span> set by the admin.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 flex gap-3 items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowInstantTopUpModal(false)}
                  className="py-2.5 px-4 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={instantSubmitting}
                  className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-100 disabled:to-slate-200 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {instantSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <PlusCircle size={13} />
                      <span>Top Up</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- BEAUTIFUL CONGRATS SUCCESS POPUP MODAL --- */}
      {showCongratsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-[10000] p-4 animate-fade-in" id="congrats-modal">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden p-8 text-center animate-slide-in-left relative">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 overflow-hidden">
              <div className="h-full bg-emerald-500 animate-[fill-progress_3s_linear_forwards]" style={{ animation: "fill-progress 3000ms linear forwards" }}></div>
            </div>

            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
              <CheckCircle size={32} className="animate-pulse" />
            </div>

            <h3 className="font-display font-bold text-2xl text-slate-900 tracking-tight mb-2">
              Congratulations! 🎉
            </h3>
            
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 mb-4 bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-100">
              {congratsType === "order" ? "Campaign Live" : "Deposit Logged"}
            </p>

            <p className="text-slate-800 text-sm leading-relaxed mb-4 font-semibold">
              {congratsDetails}
            </p>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold animate-pulse">
                Processing details & updating your dashboard...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- WRONG AMOUNT ERROR POPUP MODAL --- */}
      {showWrongAmountModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[10000] p-4 animate-fade-in" id="wrong-amount-modal">
          <div className="bg-white rounded-3xl shadow-2xl border border-red-100 max-w-md w-full overflow-hidden p-8 text-center animate-zoom-in relative">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-sm">
              <AlertTriangle size={32} className="animate-bounce" />
            </div>

            <h3 className="font-sans font-black text-2xl text-slate-900 tracking-tight mb-2 uppercase">
              Wrong Amount! ⚠️
            </h3>
            
            <p className="text-[11px] font-bold uppercase tracking-widest text-red-600 mb-4 bg-red-50 inline-block px-3 py-1 rounded-full border border-red-100">
              Limit Exceeded
            </p>

            <p className="text-slate-800 text-sm leading-relaxed mb-6 font-semibold bg-slate-50 p-4 rounded-2xl border border-slate-100 font-mono">
              {wrongAmountError}
            </p>

            <button
              onClick={() => setShowWrongAmountModal(false)}
              className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Okay, I understand
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

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
  Landmark,
  UploadCloud,
  Mail,
  Phone
} from "lucide-react";
import { User, Order, DepositRequest, Notification, AppSettings, BACKLINK_CATEGORIES } from "../types.js";
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "order" | "deposit" | "history" | "profile">("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States
  const [orders, setOrders] = useState<Order[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
  const [showTodayOrdersDropdown, setShowTodayOrdersDropdown] = useState<boolean>(false);

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

  // Auto calculate order costs
  const activeCatItem = (settings.categories || []).find(c => c.name === orderCategory);
  const priceEach = activeCatItem ? activeCatItem.price : (settings.prices[orderCategory] || 10);
  const subtotal = orderQty * priceEach;
  const remainingBalance = user.balance - subtotal;
  const isInsufficient = user.balance < subtotal;

  useEffect(() => {
    fetchUserData();
  }, [activeTab]);

  const fetchUserData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [ordersRes, depositsRes, notifsRes] = await Promise.all([
        fetch("/api/orders", { headers }),
        fetch("/api/deposits", { headers }),
        fetch("/api/notifications", { headers }),
      ]);

      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (depositsRes.ok) setDeposits(await depositsRes.json());
      if (notifsRes.ok) setNotifications(await notifsRes.json());
    } catch (e) {
      console.error("Failed to load user data logs:", e);
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

    if (!depositTxn.trim()) {
      setDepositError("Transaction ID is required to audit the payment manually.");
      return;
    }

    setDepositSubmitting(true);

    const formData = new FormData();
    formData.append("amount", depositAmount);
    formData.append("paymentMethod", depositMethod);
    formData.append("transactionId", depositTxn);
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

      const data = await res.json();
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
      setCongratsDetails(`Your wallet deposit request for ${settings.currency} ${parseFloat(depositAmount || "0").toLocaleString()} (Txn ID: ${depositTxn}) has been logged successfully! The finance auditing team will inspect your receipt proof and add credits to your wallet instantly.`);
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
          <div className="bg-slate-100 p-2.5 rounded-2xl border border-slate-200/60 space-y-2">
            <button
              id="nav-user-dash"
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                  : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
              }`}
            >
              <Layers size={14} />
              <span>Dashboard Hub</span>
            </button>
            
            <button
              id="nav-user-order"
              onClick={() => setActiveTab("order")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "order"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                  : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
              }`}
            >
              <PlusCircle size={14} />
              <span>New Order</span>
            </button>

            <button
              id="nav-user-history"
              onClick={() => setActiveTab("history")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "history"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                  : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
              }`}
            >
              <History size={14} />
              <span>Order History</span>
            </button>

            <button
              id="nav-user-profile"
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === "profile"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                  : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
              }`}
            >
              <UserIcon size={14} />
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
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-xs"
            >
              <Landmark size={14} className="text-slate-600" />
              <span>Bank Details</span>
            </button>
            <button
              onClick={() => { setShowTopUpModal(true); setMobileMenuOpen(false); }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-xs"
            >
              <PlusCircle size={14} className="text-blue-600 animate-pulse" />
              <span>Top Up Wallet</span>
            </button>
          </div>

          <nav className="flex-1 space-y-3 bg-slate-50/40 p-1">
            <div className="bg-slate-100 p-2.5 rounded-2xl border border-slate-200/60 space-y-2">
              <button
                onClick={() => { setActiveTab("dashboard"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                    : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
                }`}
              >
                <Layers size={14} />
                <span>Dashboard Hub</span>
              </button>
              <button
                onClick={() => { setActiveTab("order"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  activeTab === "order"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                    : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
                }`}
              >
                <PlusCircle size={14} />
                <span>New Order</span>
              </button>
              <button
                onClick={() => { setActiveTab("history"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  activeTab === "history"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                    : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
                }`}
              >
                <History size={14} />
                <span>Order History</span>
              </button>
              <button
                onClick={() => { setActiveTab("profile"); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/10"
                    : "bg-white text-slate-800 border-slate-200/60 hover:bg-slate-100"
                }`}
              >
                <UserIcon size={14} />
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
        <header className="hidden md:flex items-center justify-between bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-30 shadow-xs">
          <div className="flex-none min-w-[180px]">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold font-mono">
              {activeTab === "dashboard" && "🚀 Client Dashboard"}
              {activeTab === "order" && "✨ Place New Backlink Order"}
              {activeTab === "deposit" && "💳 Deposit Wallet Credits"}
              {activeTab === "history" && "📝 Order & Credit History"}
              {activeTab === "profile" && "👤 My Profile & Account"}
            </span>
          </div>

          {/* Centered Top Bar matching screenshot exactly */}
          <div className="flex-1 flex items-center justify-center gap-6 lg:gap-8 border-x border-slate-100 px-6 mx-6">
            {/* 1. Bank Details */}
            <button
              onClick={() => setShowBankModal(true)}
              className="flex items-center gap-2 text-slate-800 hover:text-blue-600 transition-all font-semibold text-xs cursor-pointer group"
            >
              <Landmark size={18} className="text-slate-800 group-hover:text-blue-600 transition-colors" />
              <span className="underline decoration-slate-300 group-hover:decoration-blue-600">Bank Details</span>
            </button>

            {/* 2. Top Up */}
            <button
              onClick={() => setShowTopUpModal(true)}
              className="flex items-center gap-2 text-slate-800 hover:text-blue-600 transition-all font-semibold text-xs cursor-pointer group"
            >
              <PlusCircle size={18} className="text-blue-600 group-hover:scale-105 transition-transform" />
              <span className="underline decoration-slate-300 group-hover:decoration-blue-600 font-semibold text-blue-600">Top Up</span>
            </button>

            {/* 3. Balance */}
            <div className="flex items-center gap-2 font-semibold text-xs text-slate-800">
              <Wallet size={18} className="text-blue-600" />
              <span>
                Balance:{" "}
                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="font-bold text-blue-600 hover:text-blue-800 underline decoration-blue-400 cursor-pointer"
                >
                  {user.balance.toLocaleString()} Cr
                </button>
              </span>
            </div>

            {/* 4. Today's Orders Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowTodayOrdersDropdown(!showTodayOrdersDropdown)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <Clock size={16} className="text-slate-800" />
                <span>Today's Orders ({todaysOrders.length})</span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${showTodayOrdersDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* Today's Orders Popover Dropdown */}
              {showTodayOrdersDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-fade-in text-slate-700">
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

          <div className="flex-none flex items-center gap-4 min-w-[280px] justify-end">
            {/* Go to Main Website Button */}
            <a
              href="https://webacklinks.com/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all uppercase tracking-wider"
            >
              <ExternalLink size={14} />
              <span>Go to Main Website</span>
            </a>

            {/* User Profile Trigger */}
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
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
              <span>{user.name}</span>
            </button>

            {/* Logout Trigger */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={12} />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* MAIN VIEWPORT PANEL */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
          {/* MOBILE ONLY TOP BAR SHORTCUTS */}
          <div className="md:hidden flex flex-wrap items-center justify-around gap-4 p-4 bg-white border border-slate-200 rounded-2xl mb-6 shadow-xs">
            <button
              onClick={() => setShowBankModal(true)}
              className="flex items-center gap-1.5 text-slate-800 hover:text-blue-600 font-semibold text-[11px] cursor-pointer"
            >
              <Landmark size={15} className="text-slate-800" />
              <span className="underline">Bank Details</span>
            </button>

            <button
              onClick={() => setShowTopUpModal(true)}
              className="flex items-center gap-1.5 text-slate-800 hover:text-blue-600 font-semibold text-[11px] cursor-pointer"
            >
              <PlusCircle size={15} className="text-blue-600" />
              <span className="underline font-semibold text-blue-600">Top Up</span>
            </button>

            <div className="flex items-center gap-1.5 font-semibold text-[11px] text-slate-800">
              <Wallet size={15} className="text-blue-600" />
              <span>Bal: <button onClick={() => setShowTopUpModal(true)} className="font-bold text-blue-600 underline">{user.balance.toLocaleString()} Cr</button></span>
            </div>
          </div>
        {/* --- TAB: DASHBOARD HUB --- */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
              <div className="flex items-center gap-4">
                <h1 className="font-sans text-xl font-light text-slate-500">
                  Welcome back, <span className="text-slate-950 font-bold">{user.name}</span>
                </h1>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] rounded uppercase font-bold tracking-tighter border border-emerald-200">Account Active</span>
              </div>
              <button
                id="dash-new-order-btn"
                onClick={() => setActiveTab("order")}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-md transition-colors cursor-pointer"
              >
                <PlusCircle size={14} />
                + Place New Order
              </button>
            </div>

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
                <span className="text-xs uppercase tracking-widest font-bold text-white mb-1">+ Place New Order</span>
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
                      className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-md relative overflow-hidden">
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-6">
                      Cost Breakdowns
                    </h3>

                    <div className="space-y-4 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-semibold">Quantity</span>
                        <span className="font-bold text-slate-800">{orderQty.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 uppercase font-semibold">Price Per Link</span>
                        <span className="font-bold text-slate-800">{settings.currency} {priceEach.toLocaleString()}</span>
                      </div>
                      <div className="border-t border-slate-100 pt-4 flex justify-between text-sm">
                        <span className="text-slate-500 uppercase font-bold">Subtotal</span>
                        <span className="font-bold text-slate-900">{settings.currency} {subtotal.toLocaleString()}</span>
                      </div>

                      <div className="border-t border-slate-100 pt-4 space-y-2.5 text-slate-500">
                        <div className="flex justify-between">
                          <span>Wallet Balance</span>
                          <span>{settings.currency} {user.balance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-600 font-semibold">
                          <span>Deduction</span>
                          <span>- {settings.currency} {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-slate-100 pt-2 text-slate-800">
                          <span>Remaining Balance</span>
                          <span className={remainingBalance < 0 ? "text-red-600 font-bold" : "text-emerald-600 font-bold"}>
                            {settings.currency} {remainingBalance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isInsufficient && (
                      <div className="mt-6 p-3 rounded bg-red-50 border border-red-200 text-[10px] text-red-700 font-bold uppercase tracking-wider text-center">
                        ⚠️ Insufficient Credit. Please Deposit First.
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
                                  <th className="pb-2 text-right">Price Per Link</th>
                                  <th className="pb-2 text-right">Min Qty</th>
                                  <th className="pb-2 text-right">Max Qty</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                {((settings.categories && settings.categories.length > 0)
                                  ? settings.categories
                                  : BACKLINK_CATEGORIES.map(cat => ({ name: cat, price: settings.prices[cat] || 10, minLimit: 50, maxLimit: 5000 }))
                                ).map((cat: any) => (
                                  <tr key={cat.name} className="hover:bg-slate-50">
                                    <td className="py-2.5 font-bold text-slate-800">{cat.name}</td>
                                    <td className="py-2.5 text-right font-bold text-blue-600 font-mono">{settings.currency} {cat.price}</td>
                                    <td className="py-2.5 text-right font-mono text-slate-500">{(cat.minLimit || 50).toLocaleString()}</td>
                                    <td className="py-2.5 text-right font-mono text-slate-500">{(cat.maxLimit || 5000).toLocaleString()}</td>
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
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">
                      Transfer Instructions
                    </h3>
                    <div className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-medium">
                      <p>1. Transfer the exact deposit amount to any of the verified bank accounts listed below.</p>
                      <p>2. Save or screenshot the transaction confirmation / transfer receipt.</p>
                      <p>3. Submit the deposit request form with your account name, transaction ID, and upload the receipt proof.</p>
                      <p>4. Our accounts team will instantly audit the receipt and credit your wallet balance.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">
                      Selectable Bank Accounts (Click to Copy)
                    </h3>
                    {(!settings.bankAccounts || settings.bankAccounts.length === 0) ? (
                      <p className="text-[11px] text-slate-400 italic">No bank accounts configured by administrator yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {settings.bankAccounts.map((acc, index) => (
                          <div key={acc.id || index} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 relative hover:border-slate-300 transition-colors">
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                              <span className="text-xs font-bold text-slate-800 tracking-tight">{acc.bankName}</span>
                              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Account {index + 1}</span>
                            </div>
                            
                            <div className="space-y-1.5 text-xs text-slate-600">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-slate-400">Title:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-800">{acc.accountName}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToClipboard(acc.accountName, `${acc.id}-name`)}
                                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex items-center justify-center"
                                    title="Copy Account Title"
                                  >
                                    {copiedField === `${acc.id}-name` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                  </button>
                                  {copiedField === `${acc.id}-name` && (
                                    <span className="text-[9px] text-emerald-600 font-semibold animate-pulse">Copied!</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-slate-400">A/C #:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-slate-800 select-all">{acc.accountNumber}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToClipboard(acc.accountNumber, `${acc.id}-number`)}
                                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex items-center justify-center"
                                    title="Copy Account Number"
                                  >
                                    {copiedField === `${acc.id}-number` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                  </button>
                                  {copiedField === `${acc.id}-number` && (
                                    <span className="text-[9px] text-emerald-600 font-semibold animate-pulse">Copied!</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-slate-400">IBAN:</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-slate-800 select-all text-[11px] truncate max-w-[130px]">{acc.iban}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyToClipboard(acc.iban, `${acc.id}-iban`)}
                                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex items-center justify-center"
                                    title="Copy IBAN"
                                  >
                                    {copiedField === `${acc.id}-iban` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                  </button>
                                  {copiedField === `${acc.id}-iban` && (
                                    <span className="text-[9px] text-emerald-600 font-semibold animate-pulse">Copied!</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
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
              <div className="lg:col-span-3 p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <form onSubmit={handleDepositSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                        Your Name
                      </label>
                      <input
                        type="text"
                        disabled
                        value={user.name}
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 text-xs focus:outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                        Your Email
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 text-xs focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                      Deposit Amount ({settings.currency})
                    </label>
                    <input
                      id="deposit-amount"
                      type="number"
                      required
                      placeholder="e.g. 15000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                        Payment Method
                      </label>
                      <select
                        id="deposit-method"
                        value={depositMethod}
                        onChange={(e) => setDepositMethod(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      >
                        <option value="Easypaisa">Easypaisa</option>
                        <option value="JazzCash">JazzCash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="USDT (TRC20)">USDT (TRC20)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                        Transaction ID (Txn ID)
                      </label>
                      <input
                        id="deposit-txn"
                        type="text"
                        required
                        placeholder="e.g. 5001298457"
                        value={depositTxn}
                        onChange={(e) => setDepositTxn(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                      Payment Screenshot Receipt <span className="text-slate-500 font-mono font-normal">(optional)</span>
                    </label>
                    <input
                      id="deposit-screenshot"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setDepositFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border file:border-slate-200 file:text-[10px] file:uppercase file:font-bold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                    />
                  </div>

                  <button
                    id="deposit-submit-btn"
                    type="submit"
                    disabled={depositSubmitting}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
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
          </div>
        )}
      </main>

      {/* --- BANK DETAILS MODAL --- */}
      {showBankModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in" id="bank-details-modal">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-zoom-in">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark size={20} className="text-white" />
                <div>
                  <h3 className="font-sans font-bold text-sm leading-none text-white">WeBacklinks Bank Accounts</h3>
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
                  {settings.bankAccounts.map((acc, index) => (
                    <div key={acc.id || index} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 relative hover:border-slate-300 transition-colors text-left font-sans">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="text-xs font-bold text-slate-800 tracking-tight">{acc.bankName}</span>
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Account {index + 1}</span>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">Title:</span>
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className="font-semibold text-slate-800">{acc.accountName}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyToClipboard(acc.accountName, `${acc.id}-modal-name`)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex items-center justify-center"
                              title="Copy Account Title"
                            >
                              {copiedField === `${acc.id}-modal-name` ? <Check size={11} className="text-blue-600" /> : <Copy size={11} />}
                            </button>
                            {copiedField === `${acc.id}-modal-name` && (
                              <span className="text-[9px] text-blue-600 font-semibold animate-pulse">Copied!</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">A/C #:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-800 select-all font-bold">{acc.accountNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyToClipboard(acc.accountNumber, `${acc.id}-modal-number`)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex items-center justify-center"
                              title="Copy Account Number"
                            >
                              {copiedField === `${acc.id}-modal-number` ? <Check size={11} className="text-blue-600" /> : <Copy size={11} />}
                            </button>
                            {copiedField === `${acc.id}-modal-number` && (
                              <span className="text-[9px] text-blue-600 font-semibold animate-pulse">Copied!</span>
                            )}
                          </div>
                        </div>

                        {acc.iban && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400">IBAN:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-800 select-all text-[11px] truncate max-w-[150px]">{acc.iban}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyToClipboard(acc.iban, `${acc.id}-modal-iban`)}
                                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex items-center justify-center"
                                title="Copy IBAN"
                              >
                                {copiedField === `${acc.id}-modal-iban` ? <Check size={11} className="text-blue-600" /> : <Copy size={11} />}
                              </button>
                              {copiedField === `${acc.id}-modal-iban` && (
                                <span className="text-[9px] text-blue-600 font-semibold animate-pulse">Copied!</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
        </div>
      )}

      {/* --- TOP UP DEPOSIT MODAL --- */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in" id="topup-request-modal">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-zoom-in">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle size={20} className="text-white" />
                <div>
                  <h3 className="font-sans font-bold text-sm leading-none text-white">Log Deposit Top Up</h3>
                  <p className="text-[9px] text-blue-100/75 uppercase tracking-widest font-mono mt-1">Submit your transaction details for credit approval</p>
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
            <form onSubmit={handleDepositSubmit} className="p-6 space-y-5 max-h-[490px] overflow-y-auto text-left">

              {depositError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {depositError}
                </div>
              )}

              {/* Read-only user info shown in a beautiful slate metadata card */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Depositor Name
                  </label>
                  <div className="text-xs font-semibold text-slate-800">{user.name}</div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">
                    Depositor Email
                  </label>
                  <div className="text-xs font-semibold text-slate-800 break-all">{user.email}</div>
                </div>
              </div>

              {/* Deposit amount and payment method gateway */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                    <span>Deposit Amount</span>
                    <span className="text-[9px] text-slate-400 font-normal">({settings.currency})</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="e.g. 5000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-semibold"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold font-mono">
                      {settings.currency === "PKR" ? "₨" : settings.currency}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-700 font-bold mb-1.5">
                    Payment Gateway Channel
                  </label>
                  <div className="relative">
                    <select
                      value={depositMethod}
                      onChange={(e) => setDepositMethod(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 appearance-none transition-all font-semibold cursor-pointer"
                    >
                      <option value="Easypaisa">Easypaisa Mobile Wallet</option>
                      <option value="JazzCash">JazzCash Mobile Wallet</option>
                      <option value="Nayapay">Nayapay</option>
                      <option value="Sadapay">Sadapay</option>
                      <option value="HBL Bank">HBL Bank Ltd</option>
                      <option value="Faisal Bank">Faisal Bank</option>
                      <option value="Meezan Bank">Meezan Bank</option>
                      <option value="UBL Bank">UBL Bank</option>
                      <option value="Other Bank Transfer">Other Bank Transfer</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-700 font-bold mb-1.5">
                  Transaction Ref / ID <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter the unique bank transaction ID"
                  value={depositTxn}
                  onChange={(e) => setDepositTxn(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono font-bold uppercase tracking-wider"
                />
              </div>

              {/* Custom Screenshot upload drag-and-drop zone */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-700 font-bold mb-1.5">
                  Upload Screenshot Proof / Receipt
                </label>
                <div 
                  onClick={() => document.getElementById('deposit-screenshot-input')?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-6 bg-slate-50/50 hover:bg-slate-50 text-center cursor-pointer transition-all group"
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
                  {depositFile ? (
                    <div className="space-y-1 animate-fade-in">
                      <p className="text-xs font-bold text-slate-800 break-all">{depositFile.name}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold font-mono">{(depositFile.size / 1024).toFixed(1)} KB • Click or Drag to replace</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <UploadCloud size={24} className="text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all mb-2" />
                      <p className="text-xs font-bold text-slate-700">Choose receipt screenshot or drag here</p>
                      <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">JPG, PNG format allowed. Max file size 5MB.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
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
                <div className="flex gap-2">
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
                    className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:bg-slate-200 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
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
    </div>
  </div>
  );
}

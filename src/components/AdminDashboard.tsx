/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Wallet, 
  Layers, 
  Settings as SettingsIcon, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Edit3, 
  Upload, 
  ExternalLink,
  Save,
  Menu,
  X,
  XCircle,
  User as UserIcon,
  LogOut,
  Sliders,
  DollarSign,
  TrendingUp,
  Briefcase,
  Download,
  HelpCircle,
  Phone,
  Table,
  CloudLightning,
  Bell
} from "lucide-react";
import { User, Order, DepositRequest, Notification, AppSettings, BACKLINK_CATEGORIES, DashboardRow } from "../types.js";
import WeBacklinksLogo, { WeBacklinksSiteIcon } from "./WeBacklinksLogo.js";

interface AdminDashboardProps {
  user: User;
  token: string;
  settings: AppSettings;
  onLogout: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onUpdateUser: (updatedUser: User) => void;
}

export default function AdminDashboard({ user, token, settings, onLogout, onUpdateSettings, onUpdateUser }: AdminDashboardProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "deposits" | "orders" | "settings" | "profile" | "dashboard_data" | "notifications">("stats");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Raw Database states
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const playTone = (delay: number, pitch: number, duration: number, volume: number = 0.5) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(pitch, ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };

      // Crisp cash-register retro coin sound
      playTone(0, 987.77, 0.08, 0.35); // B5
      playTone(0.08, 1318.51, 0.35, 0.45); // E6
      playTone(0.08, 2637.02, 0.20, 0.12); // E7 (high overtone metallic sheen)
    } catch (err) {
      console.error("Audio error:", err);
    }
  };

  // Dashboard Rows States
  const [dashboardRows, setDashboardRows] = useState<DashboardRow[]>([]);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(true);
  const [inventoryTab, setInventoryTab] = useState<"backlinks" | "guest_posts" | "premium">("backlinks");
  const [showRowModal, setShowRowModal] = useState<boolean>(false);
  const [selectedRow, setSelectedRow] = useState<DashboardRow | null>(null);
  const [rowForm, setRowForm] = useState<{ category: string; da: string; dr: string; price: string | number; status: string; total: string; tab: string }>({ category: "", da: "30", dr: "30", price: "50", status: "Available", total: "", tab: "" });
  const [rowError, setRowError] = useState("");
  const [rowSubmitting, setRowSubmitting] = useState(false);

  // Search & Filters
  const [userSearch, setUserSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>("all");

  // Edit / Action Modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", phone: "", status: "active" as "active" | "inactive", role: "user" as "user" | "admin", approvedTopUpAmount: 0 });
  
  // Balance Add / Remove
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditAction, setCreditAction] = useState<"add" | "remove">("add");

  // Custom Confirmation Modal States
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmTitle, setConfirmTitle] = useState<string>("");
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmIsDanger, setConfirmIsDanger] = useState<boolean>(true);
  const [confirmButtonText, setConfirmButtonText] = useState<string>("Confirm");

  const triggerConfirm = (title: string, message: string, action: () => void, isDanger = true, btnText = "Confirm") => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setConfirmIsDanger(isDanger);
    setConfirmButtonText(btnText);
    setShowConfirmModal(true);
  };

  // User Deletion Verification Code States
  const [showDeleteVerificationModal, setShowDeleteVerificationModal] = useState(false);
  const [deleteVerificationCode, setDeleteVerificationCode] = useState("");
  const [userIdToDelete, setUserIdToDelete] = useState("");
  const [deleteCodeSending, setDeleteCodeSending] = useState(false);
  const [deleteCodeError, setDeleteCodeError] = useState("");
  const [deleteCodeSuccess, setDeleteCodeSuccess] = useState("");

  const handleConfirmDeleteWithCode = async () => {
    if (!deleteVerificationCode.trim()) {
      setDeleteCodeError("Please enter the verification code.");
      return;
    }
    setDeleteCodeSending(true);
    setDeleteCodeError("");
    try {
      const res = await fetch(`/api/admin/users/${userIdToDelete}?code=${deleteVerificationCode.trim()}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDeleteCodeSending(false);
      if (res.ok) {
        setShowDeleteVerificationModal(false);
        fetchAdminData();
      } else {
        setDeleteCodeError(data.error || "Failed to delete user profile.");
      }
    } catch (err: any) {
      setDeleteCodeSending(false);
      setDeleteCodeError("Network error completing deletion.");
    }
  };

  // Complete Order
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeNotes, setCompleteNotes] = useState("");
  const [completeLink, setCompleteLink] = useState("");
  const [completeFile, setCompleteFile] = useState<File | null>(null);
  const [completeError, setCompleteError] = useState("");
  const [completeSubmitting, setCompleteSubmitting] = useState(false);

  // Campaign details modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  // Deposit edit & approve modal
  const [showApproveDepositModal, setShowApproveDepositModal] = useState<boolean>(false);
  const [selectedDepositForApproval, setSelectedDepositForApproval] = useState<DepositRequest | null>(null);
  const [approvalAmount, setApprovalAmount] = useState<string>("");

  const renderCsvTable = (csvText: string) => {
    const lines = csvText.split("\n").filter(l => l.trim() !== "");
    const rows = lines.map(line => {
      return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(field => field.replace(/^"|"$/g, "").trim());
    });
    
    if (rows.length === 0) return <p className="text-slate-400 text-xs italic">Empty sheet file</p>;
    
    return (
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-[11px] text-slate-600 border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
              {rows[0].map((header, idx) => (
                <th key={idx} className="p-2 font-bold font-mono border-r border-slate-200 last:border-r-0">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.slice(1, 15).map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="p-2 border-r border-slate-200 last:border-r-0 font-mono break-all">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 15 && (
          <p className="text-[10px] text-slate-400 p-2 text-center border-t border-slate-100 font-mono">Showing first 15 rows • Download the full sheet to view all entries.</p>
        )}
      </div>
    );
  };

  // Settings Forms
  const [settingsForm, setSettingsForm] = useState<AppSettings>({ ...settings });
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<"general" | "banks" | "categories" | "custom_tabs" | "mega">("general");

  // Admin Profile Form States
  const [profileName, setProfileName] = useState<string>(user.name);
  const [profilePhone, setProfilePhone] = useState<string>(user.phone);
  const [profileAvatar, setProfileAvatar] = useState<string>(user.avatar || "");
  const [profilePassword, setProfilePassword] = useState<string>("");
  const [profileSuccess, setProfileSuccess] = useState<string>("");
  const [profileError, setProfileError] = useState<string>("");
  const [profileSubmitting, setProfileSubmitting] = useState<boolean>(false);

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

  // Fetch all databases
  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAdminData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    setSettingsForm({ ...settings });
    const tabs = settings?.customTabs || ["Authority Backlinks", "High DA Guest Posts"];
    if (tabs.length > 0) {
      setInventoryTab(tabs[0]);
    }
  }, [settings]);

  useEffect(() => {
    if (showDetailsModal && selectedOrderDetails?.attachedFile) {
      const fileName = (selectedOrderDetails.attachedFileName || "").toLowerCase();
      const isTxt = fileName.endsWith(".txt");
      const isCsv = fileName.endsWith(".csv");
      if (isTxt || isCsv) {
        setPreviewLoading(true);
        setPreviewContent("");
        fetch(selectedOrderDetails.attachedFile, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(r => r.text())
          .then(text => {
            setPreviewContent(text);
            setPreviewLoading(false);
          })
          .catch(err => {
            console.error(err);
            setPreviewContent("Error loading preview data.");
            setPreviewLoading(false);
          });
      }
    } else {
      setPreviewContent("");
    }
  }, [showDetailsModal, selectedOrderDetails, token]);

  const fetchAdminData = async (silent: boolean = false) => {
    try {
      if (!silent) setLoadingDashboard(true);
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, ordersRes, depositsRes, rowsRes, notifsRes] = await Promise.all([
        fetch("/api/admin/users", { headers }),
        fetch("/api/orders", { headers }),
        fetch("/api/deposits", { headers }),
        fetch("/api/dashboard-rows", { headers }),
        fetch("/api/notifications", { headers }),
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (depositsRes.ok) setDeposits(await depositsRes.json());
      if (rowsRes.ok) setDashboardRows(await rowsRes.json());
      if (notifsRes.ok) {
        const newNotifs = await notifsRes.json();
        setNotifications(prev => {
          const prevUnreadCount = prev.filter(n => !n.read).length;
          const newUnreadCount = newNotifs.filter(n => !n.read).length;
          if (newUnreadCount > prevUnreadCount && prev.length > 0) {
            playNotificationSound();
          }
          return newNotifs;
        });
      }
    } catch (e) {
      console.error("Failed to load admin databases:", e);
    } finally {
      if (!silent) setLoadingDashboard(false);
    }
  };

  // --- DASHBOARD ROWS HANDLERS ---
  const handleOpenRowModal = (row: DashboardRow | null = null) => {
    setSelectedRow(row);
    if (row) {
      setRowForm({
        category: row.category,
        da: String(row.da),
        dr: String(row.dr),
        price: String(row.price || ""),
        status: row.status || "",
        total: row.total || "",
        tab: row.tab || "Authority Backlinks"
      });
    } else {
      setRowForm({
        category: "",
        da: "30",
        dr: "30",
        price: "50",
        status: "Available",
        total: "100",
        tab: "Authority Backlinks"
      });
    }
    setRowError("");
    setShowRowModal(true);
  };

  const handleRowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rowForm.category.trim()) {
      setRowError("Please enter a category or niche name.");
      return;
    }
    setRowSubmitting(true);
    setRowError("");

    try {
      const method = selectedRow ? "PUT" : "POST";
      const url = selectedRow 
        ? `/api/admin/dashboard-rows/${selectedRow.id}` 
        : "/api/admin/dashboard-rows";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: rowForm.category.trim(),
          da: String(rowForm.da).trim(),
          dr: String(rowForm.dr).trim(),
          price: isNaN(Number(rowForm.price)) ? String(rowForm.price).trim() : (rowForm.price === "" ? "" : Number(rowForm.price)),
          status: rowForm.status.trim(),
          total: String(rowForm.total).trim(),
          tab: rowForm.tab.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save dashboard row");
      }

      setShowRowModal(false);
      fetchAdminData();
    } catch (err: any) {
      setRowError(err.message || "An error occurred saving data.");
    } finally {
      setRowSubmitting(false);
    }
  };

  const handleDeleteRow = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/dashboard-rows/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete row.");
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // --- USER HANDLERS ---
  const handleEditUser = (u: User) => {
    setSelectedUser(u);
    setUserForm({
      name: u.name,
      phone: u.phone,
      status: u.status,
      role: u.role,
      approvedTopUpAmount: u.approvedTopUpAmount || 0,
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update user.");
      }

      setShowUserModal(false);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === "usr_admin") {
      alert("You cannot delete the primary administrator account.");
      return;
    }
    const target = users.find(u => u.id === id);
    if (target && target.role === "admin") {
      alert("You cannot delete administrator accounts.");
      return;
    }

    setUserIdToDelete(id);
    setDeleteVerificationCode("");
    setDeleteCodeError("");
    setDeleteCodeSuccess("");
    setDeleteCodeSending(true);
    setShowDeleteVerificationModal(true);

    try {
      const res = await fetch("/api/admin/send-delete-code", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDeleteCodeSending(false);
      if (res.ok) {
        setDeleteCodeSuccess(data.message || "Verification code sent to your email.");
      } else {
        setDeleteCodeError(data.error || "Failed to dispatch verification code.");
      }
    } catch (err: any) {
      setDeleteCodeSending(false);
      setDeleteCodeError("Network error sending deletion code.");
    }
  };

  const handleCreditAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid credit amount.");
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/credit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          action: creditAction,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to adjust balance.");
      }

      setShowCreditModal(false);
      setCreditAmount("");
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- DEPOSIT REVIEW HANDLERS ---
  const handleReviewDeposit = async (id: string, status: "approved" | "rejected") => {
    if (status === "approved") {
      const dep = deposits.find(d => d.id === id);
      if (dep) {
        setSelectedDepositForApproval(dep);
        setApprovalAmount(String(dep.amount));
        setShowApproveDepositModal(true);
      }
      return;
    }

    triggerConfirm(
      "Reject Deposit Request",
      `Are you sure you want to REJECT this deposit request? No funds will be credited to the user's wallet.`,
      async () => {
        try {
          const res = await fetch(`/api/deposits/${id}/review`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "rejected" }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to reject deposit.");
          }

          fetchAdminData();
        } catch (err: any) {
          alert(err.message);
        }
      },
      true, // red warning icon for rejections
      `Yes, Reject`
    );
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepositForApproval) return;
    const finalAmount = parseFloat(approvalAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      alert("Please enter a valid approved deposit amount.");
      return;
    }

    try {
      const res = await fetch(`/api/deposits/${selectedDepositForApproval.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "approved",
          amount: finalAmount
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve deposit.");
      }

      setShowApproveDepositModal(false);
      setSelectedDepositForApproval(null);
      setApprovalAmount("");
      fetchAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- ORDER REVIEW HANDLERS ---
  const handleCompleteOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    if (!completeFile && !completeLink) {
      setCompleteError("Please upload a Report File OR provide a Spreadsheet Link to complete delivery.");
      return;
    }

    triggerConfirm(
      "Complete Order & Deliver Report",
      "Are you sure you want to mark this campaign as completed and deliver the uploaded files and links to the client?",
      async () => {
        setCompleteError("");
        setCompleteSubmitting(true);

        const formData = new FormData();
        formData.append("deliveryLink", completeLink);
        formData.append("notes", completeNotes);
        if (completeFile) {
          formData.append("report", completeFile);
        }

        try {
          const res = await fetch(`/api/orders/${selectedOrder.id}/complete`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to submit delivery report.");
          }

          setShowCompleteModal(false);
          setCompleteNotes("");
          setCompleteLink("");
          setCompleteFile(null);
          fetchAdminData();
        } catch (err: any) {
          setCompleteError(err.message);
        } finally {
          setCompleteSubmitting(false);
        }
      },
      false,
      "Deliver Campaign"
    );
  };

  const exportToExcel = (data: any[], headers: string[], keys: string[], filename: string) => {
    // Generate CSV formatting with UTF-8 BOM so Excel opens it with perfect columns
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

  const handleCancelOrder = async (id: string) => {
    triggerConfirm(
      "Cancel & Refund Campaign",
      "Are you sure you want to cancel this campaign? The client will be automatically and fully refunded back to their wallet balance instantly.",
      async () => {
        try {
          const res = await fetch(`/api/orders/${id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: "cancelled" }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to cancel order.");
          }

          fetchAdminData();
        } catch (err: any) {
          alert(err.message);
        }
      }
    );
  };

  const handleDeleteOrder = async (id: string) => {
    triggerConfirm(
      "Permanently Delete Order",
      "Are you sure you want to permanently delete this campaign? This action is completely irreversible and removes all database records for this order.",
      async () => {
        try {
          const res = await fetch(`/api/orders/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to delete order.");
          }

          fetchAdminData();
        } catch (err: any) {
          alert(err.message);
        }
      }
    );
  };

  const handleUpdateOrderStatusDirect = async (id: string, status: string) => {
    const targetOrder = orders.find(o => o.id === id);
    if (!targetOrder) return;

    if (status === "completed") {
      setSelectedOrder(targetOrder);
      setCompleteNotes(targetOrder.notes || "");
      setCompleteLink(targetOrder.deliveryLink || "");
      setCompleteFile(null);
      setCompleteError("");
      setShowCompleteModal(true);
      return;
    }

    triggerConfirm(
      "Update Campaign Status",
      `Are you sure you want to change the status of Campaign #${id} to '${status}'?`,
      async () => {
        try {
          const res = await fetch(`/api/orders/${id}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to update status.");
          }

          fetchAdminData();
        } catch (err: any) {
          alert(err.message);
        }
      },
      false, // Not danger
      "Update Status"
    );
  };

  // --- SETTINGS HANDLERS ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError("");
    setSettingsSuccess("");
    setSettingsSubmitting(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settingsForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update platform settings.");
      }

      setSettingsSuccess("✅ Global platform settings updated successfully!");
      onUpdateSettings(data.settings);
      
      setTimeout(() => {
        setSettingsSuccess("");
      }, 3000);
    } catch (err: any) {
      setSettingsError(err.message);
    } finally {
      setSettingsSubmitting(false);
    }
  };

  const updatePriceValue = (cat: string, value: string) => {
    const val = parseFloat(value) || 0;
    setSettingsForm({
      ...settingsForm,
      prices: {
        ...settingsForm.prices,
        [cat]: val
      }
    });
  };

  const handleAddCategory = () => {
    const currentCats = settingsForm.categories || [];
    const newCat = {
      name: `Custom Package ${currentCats.length + 1}`,
      price: 15,
      minLimit: 50,
      maxLimit: 10000
    };
    setSettingsForm({
      ...settingsForm,
      categories: [...currentCats, newCat]
    });
  };

  const handleRemoveCategory = (index: number) => {
    triggerConfirm(
      "Delete Custom Package",
      "Are you sure you want to delete this custom package? This will be applied locally in memory and saved permanently once you click 'Save Platform Configuration' at the bottom of the Settings page.",
      () => {
        const currentCats = settingsForm.categories || [];
        const updatedCats = currentCats.filter((_, i) => i !== index);
        setSettingsForm({
          ...settingsForm,
          categories: updatedCats
        });
      }
    );
  };

  const handleUpdateCategoryField = (index: number, field: string, value: any) => {
    const currentCats = settingsForm.categories || [];
    const updatedCats = currentCats.map((cat, i) => {
      if (i === index) {
        return {
          ...cat,
          [field]: field === "name" ? value : (parseFloat(value) || 0)
        };
      }
      return cat;
    });
    setSettingsForm({
      ...settingsForm,
      categories: updatedCats
    });
  };

  const handleAddBankAccount = () => {
    const currentAccounts = settingsForm.bankAccounts || [];
    const newAccount = {
      id: "bank_" + Math.random().toString(36).substring(2, 9),
      bankName: "Meezan Bank / Easypaisa",
      accountName: "SEO Backlink Hub",
      accountNumber: "000000000000",
      iban: "N/A"
    };
    setSettingsForm({
      ...settingsForm,
      bankAccounts: [...currentAccounts, newAccount]
    });
  };

  const handleUpdateBankAccountField = (id: string, field: string, value: string) => {
    const currentAccounts = settingsForm.bankAccounts || [];
    const updatedAccounts = currentAccounts.map((acc) => {
      if (acc.id === id) {
        return { ...acc, [field]: value };
      }
      return acc;
    });
    setSettingsForm({
      ...settingsForm,
      bankAccounts: updatedAccounts
    });
  };

  const handleRemoveBankAccount = (id: string) => {
    triggerConfirm(
      "Delete Bank Account",
      "Are you sure you want to delete this structured bank account? This will be applied locally in memory and saved permanently once you click 'Save Platform Configuration' at the bottom of the Settings page.",
      () => {
        const currentAccounts = settingsForm.bankAccounts || [];
        const updatedAccounts = currentAccounts.filter((acc) => acc.id !== id);
        setSettingsForm({
          ...settingsForm,
          bankAccounts: updatedAccounts
        });
      }
    );
  };

  // --- DYNAMIC TABS & FILE UPLOAD HANDLERS ---
  const [newTabNameInput, setNewTabNameInput] = useState("");

  const handleAddCustomTab = () => {
    if (!newTabNameInput.trim()) return;
    const currentTabs = settingsForm.customTabs || ["Authority Backlinks", "High DA Guest Posts"];
    if (currentTabs.includes(newTabNameInput.trim())) {
      alert("This tab name already exists!");
      return;
    }
    setSettingsForm({
      ...settingsForm,
      customTabs: [...currentTabs, newTabNameInput.trim()]
    });
    setNewTabNameInput("");
  };

  const handleRemoveCustomTab = (index: number) => {
    const currentTabs = settingsForm.customTabs || ["Authority Backlinks", "High DA Guest Posts"];
    if (currentTabs.length <= 1) {
      alert("You must keep at least one tab!");
      return;
    }
    triggerConfirm(
      "Delete Tab",
      "Are you sure you want to delete this tab? New/existing rows matching this tab will need their tab assignment updated.",
      () => {
        const updated = currentTabs.filter((_, i) => i !== index);
        setSettingsForm({
          ...settingsForm,
          customTabs: updated
        });
      }
    );
  };

  const handleUpdateCustomTabField = (index: number, value: string) => {
    const currentTabs = settingsForm.customTabs || ["Authority Backlinks", "High DA Guest Posts"];
    const updated = currentTabs.map((tab, i) => i === index ? value : tab);
    setSettingsForm({
      ...settingsForm,
      customTabs: updated
    });
  };

  const handleDomainListFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setSettingsForm({
            ...settingsForm,
            domainListFile: reader.result,
            domainListFileName: file.name
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveDomainListFile = () => {
    setSettingsForm({
      ...settingsForm,
      domainListFile: null,
      domainListFileName: null
    });
  };

  // --- NOTIFICATION BADGE MATHS ---
  // Count pending orders grouped by user
  const userPendingOrdersMap = orders
    .filter(o => o.status === "pending" || o.status === "in_progress")
    .reduce((map, order) => {
      map[order.userId] = (map[order.userId] || 0) + 1;
      return map;
    }, {} as Record<string, number>);

  // --- STATS MATHEMATICS ---
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === "active").length;
  const inactiveUsers = users.filter(u => u.status === "inactive").length;
  const totalCredits = users.reduce((sum, u) => sum + u.balance, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const revenueSummary = orders.filter(o => o.status === "completed").reduce((sum, o) => sum + o.totalCost, 0);

  // --- SEARCH FILTERS ---
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone.includes(userSearch)
  );

  const filteredOrders = orders.filter(o => {
    const matchSearch = 
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) || 
      o.userName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.userEmail.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.category.toLowerCase().includes(orderSearch.toLowerCase());
    
    const matchStatus = orderStatusFilter === "all" || o.status === orderStatusFilter;
    const matchUser = selectedUserFilter === "all" || o.userId === selectedUserFilter;

    return matchSearch && matchStatus && matchUser;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <aside className="hidden md:flex md:w-64 bg-white text-slate-700 flex-col border-r border-slate-200 shrink-0">
        <div className="p-5 border-b border-slate-100 flex justify-center items-center h-20">
          <WeBacklinksLogo className="h-10 object-contain" />
        </div>



        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            id="admin-nav-stats"
            onClick={() => setActiveTab("stats")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all cursor-pointer ${
              activeTab === "stats" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Sliders size={14} />
            <span>Dashboard Stats</span>
          </button>

          <button
            id="admin-nav-users"
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all cursor-pointer ${
              activeTab === "users" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Users size={14} />
            <span>User Accounts</span>
          </button>

          <button
            id="admin-nav-deposits"
            onClick={() => setActiveTab("deposits")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all cursor-pointer ${
              activeTab === "deposits" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-3">
              <Wallet size={14} />
              <span>Deposits Review</span>
            </span>
            {deposits.filter(d => d.status === "pending").length > 0 && (
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${activeTab === "deposits" ? "bg-white text-blue-600 font-bold" : "bg-amber-500 text-black font-bold"}`}>
                {deposits.filter(d => d.status === "pending").length}
              </span>
            )}
          </button>

          <button
            id="admin-nav-orders"
            onClick={() => setActiveTab("orders")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all cursor-pointer ${
              activeTab === "orders" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-3">
              <Layers size={14} />
              <span>Backlink Orders</span>
            </span>
            {orders.filter(o => o.status === "pending").length > 0 && (
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full animate-pulse ${activeTab === "orders" ? "bg-white text-blue-600 font-bold" : "bg-red-500 text-white font-bold"}`}>
                {orders.filter(o => o.status === "pending").length}
              </span>
            )}
          </button>

          <button
            id="admin-nav-dashboard-data"
            onClick={() => setActiveTab("dashboard_data")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all cursor-pointer ${
              activeTab === "dashboard_data" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Table size={14} />
            <span>Dashboard Data</span>
          </button>

           <button
            id="admin-nav-settings"
            onClick={() => {
              setActiveTab("settings");
              setSettingsForm({ ...settings });
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all cursor-pointer ${
              activeTab === "settings" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <SettingsIcon size={14} />
            <span>Platform Settings</span>
          </button>

          <button
            id="admin-nav-notifications"
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all cursor-pointer ${
              activeTab === "notifications" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <span className="flex items-center gap-3">
              <Bell size={14} />
              <span>Notifications</span>
            </span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${activeTab === "notifications" ? "bg-white text-blue-600 font-bold" : "bg-rose-500 text-white font-bold"}`}>
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          <button
            id="admin-nav-profile"
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs uppercase tracking-widest font-bold transition-all cursor-pointer ${
              activeTab === "profile" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <UserIcon size={14} />
            <span>My Admin Profile</span>
          </button>
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
        <div className="flex items-center gap-2">
          <WeBacklinksLogo className="h-7 object-contain" />
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-widest bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 cursor-pointer"
        >
          {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] bg-white z-40 flex flex-col p-6 text-slate-700 animate-fade-in border-t border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <WeBacklinksLogo className="h-7 object-contain" />
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-widest bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md">Admin</span>
          </div>
          {/* Go to Main Website Link */}
          <a
            href="https://webacklinks.com/"
            className="w-full flex items-center justify-center gap-2 p-3 mb-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition-all"
          >
            <ExternalLink size={14} />
            <span>Go to Main Website</span>
          </a>

          <nav className="space-y-2 flex-1">
            <button
              onClick={() => { setActiveTab("stats"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-xs uppercase tracking-widest font-bold ${
                activeTab === "stats" ? "bg-blue-50 text-blue-600 border border-blue-100" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Sliders size={14} />
              <span>Dashboard Stats</span>
            </button>

            <button
              onClick={() => { setActiveTab("users"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-xs uppercase tracking-widest font-bold ${
                activeTab === "users" ? "bg-blue-50 text-blue-600 border border-blue-100" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Users size={14} />
              <span>User Accounts</span>
            </button>

            <button
              onClick={() => { setActiveTab("deposits"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-xs uppercase tracking-widest font-bold ${
                activeTab === "deposits" ? "bg-blue-50 text-blue-600 border border-blue-100" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Wallet size={14} />
              <span>Deposits Review ({deposits.filter(d => d.status === "pending").length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("orders"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-xs uppercase tracking-widest font-bold ${
                activeTab === "orders" ? "bg-blue-50 text-blue-600 border border-blue-100" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Layers size={14} />
              <span>Backlink Orders ({orders.filter(o => o.status === "pending").length})</span>
            </button>

            <button
              onClick={() => { setActiveTab("dashboard_data"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-xs uppercase tracking-widest font-bold ${
                activeTab === "dashboard_data" ? "bg-blue-50 text-blue-600 border border-blue-100" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Table size={14} />
              <span>Dashboard Data</span>
            </button>

            <button
              onClick={() => { setActiveTab("settings"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-xs uppercase tracking-widest font-bold ${
                activeTab === "settings" ? "bg-blue-50 text-blue-600 border border-blue-100" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <SettingsIcon size={14} />
              <span>Platform Settings</span>
            </button>

            <button
              onClick={() => { setActiveTab("notifications"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl text-xs uppercase tracking-widest font-bold ${
                activeTab === "notifications" ? "bg-blue-50 text-blue-600 border border-blue-100" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-3">
                <Bell size={14} />
                <span>Notifications</span>
              </span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="font-mono text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab("profile"); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl text-xs uppercase tracking-widest font-bold ${
                activeTab === "profile" ? "bg-blue-50 text-blue-600 border border-blue-100" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <UserIcon size={14} />
              <span>My Admin Profile</span>
            </button>
          </nav>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-3.5 border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer mt-auto mb-4"
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
        <header className="hidden md:flex items-center justify-end bg-white border-b border-slate-200 px-6 lg:px-8 py-4 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2 lg:gap-3">
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
              <span className="hidden lg:inline max-w-[100px] truncate">{user.name} (Admin)</span>
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

        {/* VIEWPORT CANVAS */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10 bg-slate-50 text-slate-700">
        {/* --- TAB: DASHBOARD DATA MANAGEMENT --- */}
        {activeTab === "dashboard_data" && (() => {
          const table1Rows = (dashboardRows || []).filter(r => {
            const catLower = r.category.toLowerCase();
            const isGuestOrPremium = 
              (r.tab && (r.tab.toLowerCase().includes("guest") || r.tab.toLowerCase().includes("premium"))) ||
              catLower.includes("guest") || 
              catLower.includes("premium");

            if (isGuestOrPremium) return false;

            return (
              r.category.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
              (r.da && String(r.da).toLowerCase().includes(dashboardSearch.toLowerCase()))
            );
          });

          const table2Rows = (dashboardRows || []).filter(r => {
            const catLower = r.category.toLowerCase();
            const isGuestOrPremium = 
              (r.tab && (r.tab.toLowerCase().includes("guest") || r.tab.toLowerCase().includes("premium"))) ||
              catLower.includes("guest") || 
              catLower.includes("premium");

            if (!isGuestOrPremium) return false;

            return (
              r.category.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
              (r.da && String(r.da).toLowerCase().includes(dashboardSearch.toLowerCase()))
            );
          });

          return (
            <div className="space-y-8 animate-fade-in">
              {/* Header */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Dashboard Inventory Manager</h1>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Control the live domain inventory displayed on both Authority Backlinks and High DA Guest Posts tables.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenRowModal(null)}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <Plus size={12} />
                  <span>Add New Domain Niche</span>
                </button>
              </div>

              {/* Filters & Search */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                    Live Record Pools ({table1Rows.length + table2Rows.length} total)
                  </span>
                </div>
                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search by category name or DA..."
                    value={dashboardSearch}
                    onChange={(e) => setDashboardSearch(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/80 transition-all shadow-2xs"
                  />
                </div>
              </div>

              {loadingDashboard ? (
                <div className="py-20 bg-white rounded-3xl border border-slate-200/80 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Loading dashboard rows...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* TABLE 1: AUTHORITY BACKLINKS */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        Authority Backlinks
                      </h2>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                        {table1Rows.length} Items
                      </span>
                    </div>

                    {table1Rows.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 italic text-xs">
                        No backlinks niches found matching search criteria.
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/20 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                              <th className="px-3 py-2.5 text-center w-[6%]">#</th>
                              <th className="px-3 py-2.5 w-[42%]">Domain Category</th>
                              <th className="px-3 py-2.5 text-center w-[12%]">DA</th>
                              <th className="px-3 py-2.5 text-center w-[18%]">Price</th>
                              <th className="px-3 py-2.5 text-center w-[10%]">Total</th>
                              <th className="px-3 py-2.5 text-center w-[12%]">Status</th>
                              <th className="px-3 py-2.5 text-center w-[10%]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {table1Rows.map((row, idx) => (
                              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors text-xs font-medium text-slate-700">
                                <td className="px-3 py-2 font-mono text-slate-400 text-center truncate">{idx + 1}</td>
                                <td className="px-3 py-2 font-bold text-slate-900 truncate" title={row.category}>{row.category}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold font-mono text-[10px] md:text-[11px] border border-indigo-100/50">
                                    {row.da}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center font-black text-slate-900 font-mono text-xs truncate">
                                  {row.price && String(row.price).trim() !== "" ? (
                                    <span className="inline-block truncate">
                                      {row.price} <span className="text-red-600 font-extrabold">Cr</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-normal italic">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center font-bold text-slate-800 font-mono text-[11px] truncate">
                                  {row.total && String(row.total).trim() !== "" ? row.total : <span className="text-slate-400 font-normal italic">-</span>}
                                </td>
                                <td className="px-3 py-2 text-center font-bold">
                                  {row.status ? (
                                    String(row.status).toLowerCase().includes("coming soon") ? (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] border border-amber-100 uppercase tracking-wide truncate max-w-full" title={row.status}>
                                        {row.status}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-100/50 uppercase tracking-wide truncate max-w-full" title={row.status}>
                                        {row.status}
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px] border border-slate-200/50 italic truncate max-w-full">
                                      Hidden
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex justify-center items-center gap-1">
                                    <button
                                      onClick={() => handleOpenRowModal(row)}
                                      className="p-1 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-100 hover:border-blue-600 rounded-md transition-all cursor-pointer"
                                      title="Edit Row"
                                    >
                                      <Edit3 size={11} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        triggerConfirm(
                                          "Delete Domain Record",
                                          `Are you sure you want to permanently delete "${row.category}"?`,
                                          () => handleDeleteRow(row.id),
                                          true,
                                          "Delete Record"
                                        );
                                      }}
                                      className="p-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 hover:border-red-600 rounded-md transition-all cursor-pointer"
                                      title="Delete Row"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* TABLE 2: HIGH DA GUEST POSTS */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        High DA Guest Posts
                      </h2>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                        {table2Rows.length} Items
                      </span>
                    </div>

                    {table2Rows.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 italic text-xs">
                        No guest posts niches found matching search criteria.
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/20 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                              <th className="px-3 py-2.5 text-center w-[6%]">#</th>
                              <th className="px-3 py-2.5 w-[42%]">Domain Category / Blog Topic</th>
                              <th className="px-3 py-2.5 text-center w-[12%]">DA</th>
                              <th className="px-3 py-2.5 text-center w-[18%]">Price</th>
                              <th className="px-3 py-2.5 text-center w-[10%]">Total</th>
                              <th className="px-3 py-2.5 text-center w-[12%]">Status</th>
                              <th className="px-3 py-2.5 text-center w-[10%]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {table2Rows.map((row, idx) => (
                              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors text-xs font-medium text-slate-700">
                                <td className="px-3 py-2 font-mono text-slate-400 text-center truncate">{idx + 1}</td>
                                <td className="px-3 py-2 font-bold text-slate-900 truncate" title={row.category}>{row.category}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className="inline-block px-1.5 py-0.5 font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md text-[10px]">
                                    {row.da}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center font-black text-slate-900 font-mono text-xs truncate">
                                  {row.price && String(row.price).trim() !== "" ? (
                                    <span className="inline-block truncate">
                                      {row.price} <span className="text-red-600 font-extrabold">Cr</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-normal italic">-</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center font-bold text-slate-800 font-mono text-[11px] truncate">
                                  {row.total && String(row.total).trim() !== "" ? row.total : <span className="text-slate-400 font-normal italic">-</span>}
                                </td>
                                <td className="px-3 py-2 text-center font-bold">
                                  {row.status ? (
                                    String(row.status).toLowerCase().includes("coming soon") ? (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] border border-amber-100 uppercase tracking-wide truncate max-w-full" title={row.status}>
                                        {row.status}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-100/50 uppercase tracking-wide truncate max-w-full" title={row.status}>
                                        {row.status}
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px] border border-slate-200/50 italic truncate max-w-full">
                                      Hidden
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <div className="flex justify-center items-center gap-1">
                                    <button
                                      onClick={() => handleOpenRowModal(row)}
                                      className="p-1 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-100 hover:border-blue-600 rounded-md transition-all cursor-pointer"
                                      title="Edit Row"
                                    >
                                      <Edit3 size={11} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        triggerConfirm(
                                          "Delete Domain Record",
                                          `Are you sure you want to permanently delete "${row.category}"?`,
                                          () => handleDeleteRow(row.id),
                                          true,
                                          "Delete Record"
                                        );
                                      }}
                                      className="p-1 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-100 hover:border-red-600 rounded-md transition-all cursor-pointer"
                                      title="Delete Row"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* --- TAB: STATS OVERVIEW --- */}
        {activeTab === "stats" && (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
              <h1 className="font-sans text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                Platform Statistics Overview
              </h1>
              <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">General overview of registered client accounts, transaction histories, credit ledgers, and revenue totals.</p>
            </div>

            {/* Stats Bento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Users */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Client Profiles</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                    <Users size={14} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold font-sans text-slate-800 tracking-tight">{totalUsers}</div>
                  <div className="text-[10px] font-mono uppercase text-slate-500 mt-2 flex gap-3">
                    <span className="text-emerald-600 font-semibold">{activeUsers} Active</span>
                    <span className="text-red-600 font-semibold">{inactiveUsers} Blocked</span>
                  </div>
                </div>
              </div>

              {/* Total Credits */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Outstanding Balances</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                    <Wallet size={14} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold font-sans text-slate-800 tracking-tight">
                    {settings.currency} {totalCredits.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono uppercase text-slate-500 mt-2">Circulating client wallet funds</div>
                </div>
              </div>

              {/* Pending Orders */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pending Backlinks</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                    <Clock size={14} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold font-sans text-slate-800 tracking-tight">{pendingOrders}</div>
                  <div className="text-[10px] font-mono uppercase text-slate-500 mt-2">Active campaigns awaiting completion</div>
                </div>
              </div>

              {/* Revenue */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Revenue Summary</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center">
                    <DollarSign size={14} />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold font-sans text-slate-800 tracking-tight">
                    {settings.currency} {revenueSummary.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-mono uppercase text-emerald-600 mt-2 font-semibold">
                    {completedOrders} completed campaigns
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts Table Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Pending Workloads */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 mb-4">Pending Backlink Workloads</h3>
                {orders.filter(o => o.status === "pending" || o.status === "in_progress").length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">All campaigns are completed and delivered! No pending workload.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                          <th className="pb-3 font-bold">User</th>
                          <th className="pb-3 font-bold">Category</th>
                          <th className="pb-3 font-bold">Quantity</th>
                          <th className="pb-3 font-bold">Date</th>
                          <th className="pb-3 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders
                          .filter(o => o.status === "pending" || o.status === "in_progress")
                          .slice(0, 6)
                          .map((o) => (
                            <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3.5">
                                <span className="font-bold text-slate-800 block">{o.userName}</span>
                                <span className="text-[10px] text-slate-500">{o.userEmail}</span>
                              </td>
                              <td className="py-3.5 font-medium text-slate-800">{o.category}</td>
                              <td className="py-3.5 text-slate-600 font-mono">{o.quantity.toLocaleString()}</td>
                              <td className="py-3.5 text-slate-500 font-mono">{new Date(o.createdAt).toLocaleDateString()}</td>
                              <td className="py-3.5 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedOrder(o);
                                    setShowCompleteModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                                >
                                  Complete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pending Action Badges */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-500" />
                  Workload Badge Monitor
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Pending campaigns grouped by client account. Review active backlog instantly to distribute task workloads.
                </p>
                {Object.keys(userPendingOrdersMap).length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-500 uppercase tracking-wider">No client accounts have pending tasks.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users
                      .filter(u => userPendingOrdersMap[u.id] > 0)
                      .map((u) => (
                        <div 
                          key={u.id}
                          onClick={() => {
                            setSelectedUserFilter(u.id);
                            setOrderStatusFilter("pending");
                            setActiveTab("orders");
                          }}
                          className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer group"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-800 truncate block group-hover:text-slate-950 transition-colors">{u.name}</span>
                            <span className="text-[10px] text-slate-500 block truncate font-mono">{u.email}</span>
                          </div>
                          <span className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                            {userPendingOrdersMap[u.id]} Pending
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: USER MANAGEMENT --- */}
        {activeTab === "users" && (
          <div className="space-y-8 animate-fade-in animate-fade-in-down">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="font-sans text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                  Registered User Accounts
                </h1>
                <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">Activate, block, edit, view profile ledger, and adjust client wallet credits manually.</p>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const currentMonth = new Date().getMonth();
                    const currentYear = new Date().getFullYear();
                    const usersWithOrderCount = filteredUsers.map(u => {
                      const monthlyOrdersCount = orders.filter(o => {
                        if (o.userId !== u.id) return false;
                        const orderDate = new Date(o.createdAt);
                        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
                      }).length;
                      return {
                        ...u,
                        monthlyOrdersCount
                      };
                    });
                    exportToExcel(
                      usersWithOrderCount,
                      ["User ID", "Name", "Email", "Phone", "Role", "Balance", "Status", "Orders This Month", "Registered Date"],
                      ["id", "name", "email", "phone", "role", "balance", "status", "monthlyOrdersCount", "createdAt"],
                      "WeBacklinks_Registered_Users"
                    );
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  title="Export User Accounts to Excel"
                >
                  <Download size={14} />
                  <span>Export Excel</span>
                </button>

                <div className="relative w-full md:w-64">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
                    <Search size={14} />
                  </span>
                  <input
                    id="user-search-input"
                    type="text"
                    placeholder="Search name, email, or phone..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="pb-3 font-bold">Client Info</th>
                      <th className="pb-3 font-bold">Role</th>
                      <th className="pb-3 font-bold">Balance</th>
                      <th className="pb-3 font-bold">Approved Topup Limit</th>
                      <th className="pb-3 font-bold">Status</th>
                      <th className="pb-3 font-bold text-center">Orders This Month</th>
                      <th className="pb-3 font-bold">Registered Date</th>
                      <th className="pb-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const now = new Date();
                      const currentMonth = now.getMonth();
                      const currentYear = now.getFullYear();
                      const monthlyOrdersCount = orders.filter((o) => {
                        if (o.userId !== u.id) return false;
                        const orderDate = new Date(o.createdAt);
                        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
                      }).length;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg inline-block border border-slate-200/60 shadow-xs mb-1">{u.name}</span>
                            <span className="text-xs text-slate-500 block font-mono">{u.email}</span>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{u.phone}</span>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                              u.role === "admin" ? "bg-violet-50 text-violet-700 border border-violet-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 font-bold text-slate-800 font-mono">
                            {u.role === "admin" ? (
                              <span className="text-slate-400 font-normal text-xs italic">N/A (Admin)</span>
                            ) : (
                              `${settings.currency} ${u.balance.toLocaleString()}`
                            )}
                          </td>
                          <td className="py-3.5 font-bold text-slate-700 font-mono">
                            {u.role === "admin" ? (
                              <span className="text-slate-400 font-normal text-xs italic">-</span>
                            ) : (
                              `${settings.currency} ${(u.approvedTopUpAmount || 0).toLocaleString()}`
                            )}
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                              u.status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-center font-mono">
                            <span className="inline-flex items-center justify-center font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px]">
                              {monthlyOrdersCount}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500 font-mono">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.role !== "admin" && (
                              <button
                                id={`adjust-credit-${u.id}`}
                                onClick={() => {
                                  setSelectedUser(u);
                                  setShowCreditModal(true);
                                }}
                                className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Add / Remove Balance"
                              >
                                <Wallet size={12} />
                              </button>
                            )}
                            <button
                              id={`edit-user-${u.id}`}
                              onClick={() => handleEditUser(u)}
                              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit User Profile"
                            >
                              <Edit3 size={12} />
                            </button>
                            {u.role !== "admin" && (
                              <button
                                id={`delete-user-${u.id}`}
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                                title="Delete Account"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB: DEPOSITS REVIEW --- */}
        {activeTab === "deposits" && (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
              <h1 className="font-sans text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                Deposit Requests Manual Audits
              </h1>
              <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">Audit bank / mobile ledger transaction screenshots, confirm transfers, and manually activate wallet credits.</p>
            </div>

            {/* Deposits Table */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              {deposits.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">No deposit requests have been logged yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-3 font-bold">User Profile</th>
                        <th className="pb-3 font-bold">Client Bank Details</th>
                        <th className="pb-3 font-bold">Txn ID (TID)</th>
                        <th className="pb-3 font-bold">Amount</th>
                        <th className="pb-3 font-bold">File Attached</th>
                        <th className="pb-3 font-bold">Status</th>
                        <th className="pb-3 font-bold text-right">Manual Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[...deposits]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-semibold text-xs text-indigo-700 bg-linear-to-r from-indigo-50 to-blue-50 px-2.5 py-1 rounded-lg inline-block border border-indigo-100/80 shadow-xs self-start tracking-wide uppercase">
                                {d.userName}
                              </span>
                              <span className="text-xs text-slate-500 font-mono pl-0.5">{d.userEmail}</span>
                            </div>
                          </td>
                          <td className="py-3.5">
                            {d.userBankName ? (
                              <div className="bg-slate-50 border border-slate-200/50 p-2.5 rounded-xl space-y-1.5 max-w-[200px] shadow-2xs">
                                <div className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50/80 border border-emerald-100 px-1.5 py-0.5 rounded uppercase tracking-wider self-start inline-block">
                                  {d.userBankName}
                                </div>
                                <div className="text-[11px] font-bold text-slate-800 leading-tight">
                                  {d.userAccountTitle}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 font-medium break-all select-all hover:text-blue-600 transition-colors cursor-pointer" title="Click to copy account number">
                                  {d.userAccountNumber}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold italic">No bank profile configured</span>
                            )}
                          </td>
                          <td className="py-3.5 font-mono text-[11px] text-slate-500">
                            {d.transactionId && d.transactionId !== "N/A" && d.transactionId.trim() !== "" ? (
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 font-mono text-[11px]">{d.transactionId}</span>
                            ) : (
                              <span className="text-slate-400 font-bold">-</span>
                            )}
                          </td>
                          <td className="py-3.5 font-bold text-slate-800 font-mono">
                            {settings.currency} {d.amount.toLocaleString()}
                          </td>
                          <td className="py-3.5 text-xs">
                            {d.screenshot ? (
                              <a
                                href={d.screenshot ? `${d.screenshot}?token=${token}` : "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-semibold cursor-pointer bg-slate-100 border border-slate-200 px-2.5 py-1 rounded hover:bg-slate-200 transition-colors"
                              >
                                View Receipt <ExternalLink size={10} />
                              </a>
                            ) : (
                              <span className="text-slate-400 font-bold">-</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                              d.status === "approved" 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                : d.status === "rejected" 
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            {d.status === "pending" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  id={`approve-deposit-${d.id}`}
                                  onClick={() => handleReviewDeposit(d.id, "approved")}
                                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  id={`reject-deposit-${d.id}`}
                                  onClick={() => handleReviewDeposit(d.id, "rejected")}
                                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Audited</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: ORDER MANAGEMENT --- */}
        {activeTab === "orders" && (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h1 className="font-sans text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                  Backlink Order Campaigns
                </h1>
                <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">Change statuses, review notes, cancel orders to auto-refund, and upload final PDF delivery reports.</p>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => exportToExcel(
                    filteredOrders,
                    ["Order ID", "Client Name", "Client Email", "Category", "Quantity", "Total Cost", "Status", "Created At", "Sheet Link"],
                    ["id", "userName", "userEmail", "category", "quantity", "totalCost", "status", "createdAt", "deliveryLink"],
                    "WeBacklinks_All_Orders"
                  )}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Export Filtered Campaigns to Excel"
                >
                  <Download size={13} />
                  <span>Export Excel</span>
                </button>

                <select
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Clients</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 rounded-xl focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <div className="relative w-full sm:w-60">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search Order ID or keywords..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 rounded-xl focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">No campaigns match your search filter criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-3 font-bold w-16">ID</th>
                        <th className="pb-3 font-bold w-44">Client Info</th>
                        <th className="pb-3 font-bold w-40">Category</th>
                        <th className="pb-3 font-bold">Campaign Details</th>
                        <th className="pb-3 font-bold w-16 text-center">Qty</th>
                        <th className="pb-3 font-bold w-24 text-center">Cost</th>
                        <th className="pb-3 font-bold w-32 text-center">Status</th>
                        <th className="pb-3 font-bold text-right w-52">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 font-mono text-xs font-bold text-slate-600 w-16">#{o.id}</td>
                          <td className="py-3.5 w-44">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg inline-block border border-slate-200/60 shadow-xs mb-1">{o.userName}</span>
                            <span className="text-[10px] text-slate-500 block font-mono leading-none">{o.userEmail}</span>
                          </td>
                          <td className="py-3.5 w-40 font-semibold text-slate-800 font-sans text-xs">
                            <span className="bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg inline-block text-[11px] font-bold text-slate-700">
                              {o.category}
                            </span>
                          </td>
                          <td className="py-3.5 font-sans">
                            {o.notes || o.attachedFile ? (
                              <button
                                onClick={() => {
                                  setSelectedOrderDetails(o);
                                  setShowDetailsModal(true);
                                }}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 hover:border-blue-300 text-blue-600 hover:text-blue-800 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs"
                              >
                                <span>🔍 View Details</span>
                                {o.attachedFile && (
                                  <span className="inline-block px-1.5 py-0.5 bg-blue-600 text-white rounded text-[8px] font-bold leading-none font-mono">FILE</span>
                                )}
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs italic">No info</span>
                            )}
                          </td>
                          <td className="py-3.5 text-slate-600 font-mono text-center w-16 text-xs">{o.quantity.toLocaleString()}</td>
                          <td className="py-3.5 font-bold text-slate-800 font-mono text-center w-24 text-xs">
                            {settings.currency} {o.totalCost.toLocaleString()}
                          </td>
                          <td className="py-3.5 w-32 text-center">
                            <select
                              id={`status-select-${o.id}`}
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatusDirect(o.id, e.target.value)}
                              className={`px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider transition-colors focus:outline-none shadow-xs cursor-pointer ${
                                o.status === "pending"
                                  ? "bg-red-600 text-white border-red-700 focus:ring-red-500"
                                  : o.status === "in_progress"
                                  ? "bg-amber-500 text-white border-amber-600 focus:ring-amber-500"
                                  : o.status === "completed"
                                  ? "bg-emerald-600 text-white border-emerald-700 focus:ring-emerald-500"
                                  : "bg-slate-600 text-white border-slate-700 focus:ring-slate-500"
                              }`}
                            >
                              <option value="pending" className="bg-white text-slate-800 font-semibold">Pending</option>
                              <option value="in_progress" className="bg-white text-slate-800 font-semibold">In Progress</option>
                              <option value="completed" className="bg-white text-slate-800 font-semibold">Completed</option>
                              <option value="cancelled" className="bg-white text-slate-800 font-semibold">Cancelled</option>
                            </select>
                          </td>
                          <td className="py-3.5 text-right w-52">
                            <div className="flex items-center justify-end gap-1.5">
                              {o.status !== "completed" && (
                                <button
                                  id={`complete-order-${o.id}`}
                                  onClick={() => {
                                    setSelectedOrder(o);
                                    setCompleteNotes(o.notes || "");
                                    setShowCompleteModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all hover:scale-102 cursor-pointer inline-flex items-center gap-1"
                                  title="Deliver & Upload PDF"
                                >
                                  <span>Complete</span>
                                </button>
                              )}
                              {o.status !== "cancelled" && (
                                <button
                                  id={`cancel-order-${o.id}`}
                                  onClick={() => handleCancelOrder(o.id)}
                                  className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
                                  title="Cancel and Auto-Refund"
                                >
                                  <XCircle size={12} />
                                </button>
                              )}
                              <button
                                id={`delete-order-${o.id}`}
                                onClick={() => handleDeleteOrder(o.id)}
                                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 border border-red-300 text-red-700 transition-colors cursor-pointer"
                                title="Delete Order Permanently"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB: SETTINGS MANAGEMENT --- */}
        {activeTab === "settings" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
              <h1 className="font-sans text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                Global Platform Configurations
              </h1>
              <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">Configure pricing matrices, company branding, payment directions, and secure SMTP mail relays.</p>
            </div>

            {settingsSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono uppercase tracking-wider" id="settings-success-msg">
                {settingsSuccess}
              </div>
            )}

            {settingsError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono uppercase tracking-wider" id="settings-error-msg">
                {settingsError}
              </div>
            )}

            {/* Settings Sub-Tabs Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setActiveSettingsSubTab("general")}
                className={`py-2.5 px-5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeSettingsSubTab === "general"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                💼 Branding & Leads Email
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsSubTab("banks")}
                className={`py-2.5 px-5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeSettingsSubTab === "banks"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                🏦 Bank Deposit Accounts
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsSubTab("categories")}
                className={`py-2.5 px-5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeSettingsSubTab === "categories"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                📋 Custom Packages ({settingsForm.categories?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsSubTab("custom_tabs")}
                className={`py-2.5 px-5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeSettingsSubTab === "custom_tabs"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                📁 Dynamic Tabs & Domain List
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsSubTab("mega")}
                className={`py-2.5 px-5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeSettingsSubTab === "mega"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                ☁️ Mega.nz Storage
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-8">
              {activeSettingsSubTab === "general" && (
                /* Box: Brand and Directions */
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-3">Branding & Directives</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                        Website Name
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.websiteName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, websiteName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                        Logo Text / Brand Header
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.logo}
                        onChange={(e) => setSettingsForm({ ...settingsForm, logo: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                        Currency Code (e.g. PKR, USD, Rs)
                      </label>
                      <input
                        type="text"
                        required
                        value={settingsForm.currency}
                        onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">
                        Lead Notification & Order Recipient Email
                      </label>
                      <input
                        type="email"
                        required
                        value={settingsForm.contactEmail}
                        onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-blue-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors bg-blue-50/20"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 font-sans">
                        All user order placement details (Target URLs, anchor keywords and uploaded files) will be received at this email address.
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {activeSettingsSubTab === "banks" && (
                /* Box: Deposit Structured Bank Accounts */
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Deposit Structured Bank Accounts</h3>
                    <button
                      type="button"
                      onClick={handleAddBankAccount}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus size={12} /> Add Bank Account
                    </button>
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Add, edit, or delete structured bank accounts that clients can copy-paste from their deposit request screens. Include the bank name, account title, account number, and IBAN. All changes will be saved when you save the configuration.
                  </p>

                  {(!settingsForm.bankAccounts || settingsForm.bankAccounts.length === 0) ? (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">No bank accounts defined. Click the button above to add one.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {settingsForm.bankAccounts.map((acc) => (
                        <div key={acc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 min-w-0 w-full grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1.5 font-mono font-bold">Bank Name</label>
                              <input
                                type="text"
                                required
                                value={acc.bankName}
                                onChange={(e) => handleUpdateBankAccountField(acc.id, "bankName", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1.5 font-mono font-bold">Account Title</label>
                              <input
                                type="text"
                                required
                                value={acc.accountName}
                                onChange={(e) => handleUpdateBankAccountField(acc.id, "accountName", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1.5 font-mono font-bold">Account Number</label>
                              <input
                                type="text"
                                required
                                value={acc.accountNumber}
                                onChange={(e) => handleUpdateBankAccountField(acc.id, "accountNumber", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1.5 font-mono font-bold">IBAN</label>
                              <input
                                type="text"
                                required
                                value={acc.iban}
                                onChange={(e) => handleUpdateBankAccountField(acc.id, "iban", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            id={`delete-bank-account-${acc.id}`}
                            onClick={() => handleRemoveBankAccount(acc.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors cursor-pointer w-full md:w-auto flex justify-center items-center"
                            title="Delete Bank Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSettingsSubTab === "categories" && (
                /* Box: Dynamic Categories Manager */
                <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Custom Categories & Package Limits</h3>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus size={12} /> Add Custom Package
                    </button>
                  </div>

                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Define your customized backlink packages, set specific prices, and enforce minimum and maximum selectable quantities. These configurations dynamically restrict user orders on the client application in real-time.
                  </p>

                  {(!settingsForm.categories || settingsForm.categories.length === 0) ? (
                    <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">No custom packages defined. Click the button above to seed.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {settingsForm.categories.map((cat, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 min-w-0 w-full">
                            <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1.5 font-mono font-bold">Category Package Name</label>
                            <input
                              type="text"
                              required
                              value={cat.name}
                              onChange={(e) => handleUpdateCategoryField(idx, "name", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div className="w-full md:w-32">
                            <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1.5 font-mono font-bold">Price ({settings.currency})</label>
                            <input
                              type="number"
                              required
                              step="0.01"
                              value={cat.price}
                              onChange={(e) => handleUpdateCategoryField(idx, "price", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div className="w-full md:w-28">
                            <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1.5 font-mono font-bold">Min Limit</label>
                            <input
                              type="number"
                              required
                              value={cat.minLimit}
                              onChange={(e) => handleUpdateCategoryField(idx, "minLimit", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <div className="w-full md:w-28">
                            <label className="block text-[9px] uppercase tracking-widest text-slate-500 mb-1.5 font-mono font-bold">Max Limit</label>
                            <input
                              type="number"
                              required
                              value={cat.maxLimit}
                              onChange={(e) => handleUpdateCategoryField(idx, "maxLimit", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          <button
                            type="button"
                            id={`delete-custom-package-${idx}`}
                            onClick={() => handleRemoveCategory(idx)}
                            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors cursor-pointer w-full md:w-auto flex justify-center items-center"
                            title="Delete Custom Package"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSettingsSubTab === "custom_tabs" && (
                <div className="space-y-6">
                  {/* Card 1: Dynamic Tabs Manager */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Dynamic Inventory Tabs Manager</h3>
                      <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                        Configure the horizontal tabs that appear on the client dashboard. Users can click these to filter the active domains list.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add new tab name (e.g. Premium Guest Post, PBN, Educational)"
                        value={newTabNameInput}
                        onChange={(e) => setNewTabNameInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomTab}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Add Tab
                      </button>
                    </div>

                    {(!(settingsForm.customTabs) || settingsForm.customTabs.length === 0) ? (
                      <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
                        No custom tabs defined. Defaults will be loaded.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {settingsForm.customTabs.map((tab, idx) => (
                          <div key={idx} className="flex gap-3 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-bold font-mono text-slate-400 w-6">#{idx + 1}</span>
                            <input
                              type="text"
                              value={tab}
                              onChange={(e) => handleUpdateCustomTabField(idx, e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomTab(idx)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors cursor-pointer"
                              title="Delete Tab"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card 2: Export Domains File Upload & Link */}
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Export Domains List Attachment</h3>
                      <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                        Upload an official file (Excel/CSV/PDF) or provide an external Google Sheet link that users can download or open directly when clicking "Export Domains List".
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* File Upload */}
                      <div className="space-y-3">
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500">
                          Upload Inventory File
                        </label>
                        {settingsForm.domainListFileName ? (
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                              <span className="text-xs text-slate-700 font-semibold font-mono truncate">
                                {settingsForm.domainListFileName}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveDomainListFile}
                              className="text-[10px] font-bold text-red-600 hover:text-red-800 uppercase tracking-wider cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-4 transition-colors relative cursor-pointer group">
                            <input
                              type="file"
                              accept=".csv,.xlsx,.xls,.pdf,.txt"
                              onChange={handleDomainListFileChange}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-center space-y-1.5">
                              <div className="text-xs text-slate-600 font-bold group-hover:text-blue-600 transition-colors">
                                Click or drag file to attach
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Excel, CSV, PDF or Text files (Max 5MB)
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Google Sheet Link */}
                      <div className="space-y-3">
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500">
                          Google Sheet or External Link
                        </label>
                        <input
                          type="url"
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          value={settingsForm.domainListUrl || ""}
                          onChange={(e) => setSettingsForm({ ...settingsForm, domainListUrl: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        />
                        <p className="text-[10px] text-slate-400">
                          If provided, clients can click to open this link to view the complete live inventory list instantly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSettingsSubTab === "mega" && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
                    <div className="border-b border-slate-100 pb-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                        <CloudLightning size={16} />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Mega.nz Cloud Storage Configuration</h3>
                        <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                          Securely link your personal Mega.nz account. App files, transaction screenshots, and completed reports will be automatically uploaded directly to your Mega storage instead of local disk.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="block text-[10px] uppercase tracking-widest font-extrabold text-slate-500">
                          Mega.nz Account Email
                        </label>
                        <input
                          type="email"
                          placeholder="storage@example.com"
                          value={settingsForm.megaEmail || ""}
                          onChange={(e) => setSettingsForm({ ...settingsForm, megaEmail: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans font-semibold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] uppercase tracking-widest font-extrabold text-slate-500">
                          Mega.nz Password
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••••••"
                          value={settingsForm.megaPassword || ""}
                          onChange={(e) => setSettingsForm({ ...settingsForm, megaPassword: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans font-semibold"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl flex items-start gap-3 mt-4 text-xs text-blue-800 leading-relaxed font-sans">
                      <div className="text-blue-600 font-extrabold text-base leading-none">ℹ️</div>
                      <div>
                        <span className="font-extrabold">Seamless Redundancy:</span> If credentials are left blank or authentication fails, the application automatically falls back to local container disk storage to ensure 100% service uptime.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={settingsSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {settingsSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save size={12} />
                    <span>Save Platform Configuration</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* --- TAB: ADMIN PROFILE --- */}
        {activeTab === "profile" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
              <h1 className="font-sans text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                My Administrator Profile
              </h1>
              <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">Manage your administrative credentials, secure passwords, and upload public avatars.</p>
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
              <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-between text-center space-y-6 shadow-sm">
                <div className="space-y-4 w-full">
                  <h3 className="text-[10px] uppercase tracking-widest text-slate-500 text-left font-bold">Your Profile Avatar</h3>
                  <div className="flex justify-center py-4">
                    {profileAvatar ? (
                      <img src={profileAvatar} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 ring-4 ring-blue-500/10" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 border-2 border-slate-200 flex items-center justify-center text-white font-medium text-3xl shadow-md">
                        {profileName ? profileName.charAt(0).toUpperCase() : "A"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{profileName || "System Administrator"}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[9px] uppercase font-bold font-mono tracking-widest">
                      SYSTEM ADMIN
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-4">
                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 text-left font-bold">Preset Admin Avatars</h4>
                    <div className="flex flex-wrap gap-2 justify-start">
                      {[
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
                        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80",
                        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80",
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                      ].map((presetUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProfileAvatar(presetUrl)}
                          className={`w-10 h-10 rounded-full overflow-hidden border transition-all hover:scale-105 cursor-pointer ${
                            profileAvatar === presetUrl ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200"
                          }`}
                        >
                          <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setProfileAvatar("")}
                        className={`w-10 h-10 rounded-full bg-slate-50 text-slate-600 border text-xs font-bold transition-all hover:scale-105 cursor-pointer flex items-center justify-center ${
                          !profileAvatar ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200"
                        }`}
                        title="Initials avatar"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 text-left font-mono font-bold">Upload Custom Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-xl file:border file:border-slate-200 file:text-[10px] file:uppercase file:font-bold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Administrator Details Form Column */}
              <div className="lg:col-span-2 p-6 md:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 border-b border-slate-100 pb-3">Update Identity Details</h3>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-6 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Security Credentials</h4>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
                        New Administrator Password <span className="text-slate-400 font-mono">(Leave blank to keep current)</span>
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <p className="text-[10px] text-slate-400 mt-2 font-mono">Password must be at least 6 characters in length.</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileSubmitting}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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

        {/* --- TAB: ADMIN NOTIFICATIONS --- */}
        {activeTab === "notifications" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="font-sans text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                  Notifications
                </h1>
                <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">
                  View full logs of registration events, deposits, and backlink orders in real-time.
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={async () => {
                    if (!window.confirm("Are you sure you want to mark all notifications as read?")) return;
                    try {
                      await fetch("/api/notifications/read", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-blue-100 shadow-sm"
                >
                  Mark All Read
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm("Are you sure you want to clear all notifications? This action cannot be undone.")) return;
                    try {
                      await fetch("/api/notifications/clear", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` }
                      });
                      setNotifications([]);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border border-red-100 shadow-sm"
                >
                  Clear All Logs
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <Bell size={24} className="opacity-40" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-700">No Notifications</h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">Any system activities will be logged here.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100 animate-fade-in">
                {[...notifications]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-5 transition-all flex items-start gap-4 ${
                      notif.read ? "bg-white opacity-85" : "bg-blue-50/20 font-medium"
                    }`}
                  >
                    <div className="mt-1 flex-shrink-0">
                      <span className={`w-2.5 h-2.5 rounded-full block ${notif.read ? "bg-slate-300" : "bg-blue-500"}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-xs uppercase tracking-wider ${notif.read ? "text-slate-600" : "text-blue-900 font-bold"}`}>
                          {notif.title}
                        </h4>
                        <div className="text-right text-[10px] text-slate-400 font-mono flex-shrink-0 flex flex-col items-end leading-tight">
                          <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                          <span className="text-[9px] text-slate-500 font-semibold">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>

      {/* --- MODAL: EDIT USER --- */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in" id="edit-user-modal">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Edit User Details</h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Account Status
                  </label>
                  <select
                    id="edit-user-status"
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value as "active" | "inactive" })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    System Role
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as "user" | "admin" })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {userForm.role !== "admin" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Approved Top Up Limit ({settings.currency})
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="e.g. 5000"
                    value={userForm.approvedTopUpAmount}
                    onChange={(e) => setUserForm({ ...userForm, approvedTopUpAmount: Number(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}

              <button
                id="save-user-btn"
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: BALANCE ADJUSTMENT --- */}
      {showCreditModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in" id="balance-adjustment-modal">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Adjust Balance</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono font-bold">Adjusting balance for: {selectedUser.name}</p>
              </div>
              <button onClick={() => setShowCreditModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreditAdjustment} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Action Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreditAction("add")}
                    className={`py-2.5 rounded-xl border text-[10px] uppercase font-mono tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      creditAction === "add" 
                        ? "bg-blue-50 border-blue-200 text-blue-700 font-bold" 
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Plus size={12} /> Add Credits
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditAction("remove")}
                    className={`py-2.5 rounded-xl border text-[10px] uppercase font-mono tracking-wider font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      creditAction === "remove" 
                        ? "bg-red-50 border-red-200 text-red-700 font-bold" 
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Minus size={12} /> Deduct Credits
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Credit Amount ({settings.currency})
                </label>
                <input
                  id="credit-adjust-amount"
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <button
                id="adjust-credit-submit"
                type="submit"
                className={`w-full py-3 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm ${
                  creditAction === "add" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {creditAction === "add" ? "Deposit Credits" : "Deduct Credits"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: SECURITY AUTHORIZATION CODE FOR DELETION --- */}
      {showDeleteVerificationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in" id="security-verification-modal">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="animate-pulse" />
                <span className="font-sans font-bold text-xs uppercase tracking-widest">Security Authorization Required</span>
              </div>
              <button
                onClick={() => setShowDeleteVerificationModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Deleting a client profile permanently purges all order history, campaigns, and wallet credit logs. For extreme security, we have dispatched a <strong>6-digit security code</strong> to your admin email address.
              </p>

              {deleteCodeError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-mono">
                  {deleteCodeError}
                </div>
              )}

              {deleteCodeSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-mono font-semibold">
                  {deleteCodeSuccess}
                </div>
              )}

              {deleteCodeSending && (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching security credentials to {user.email}...</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="e.g. 123456"
                  value={deleteVerificationCode}
                  onChange={(e) => setDeleteVerificationCode(e.target.value)}
                  className="w-full text-center px-4 py-3 tracking-widest text-lg font-bold font-mono rounded-xl border border-slate-300 focus:border-red-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteVerificationModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteWithCode}
                  disabled={deleteCodeSending}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {deleteCodeSending ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={12} />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: COMPLETE DELIVERY REPORT --- */}
      {showCompleteModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in" id="complete-delivery-modal">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">Upload Delivery Assets</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono font-bold font-bold">Completing campaign order: #{selectedOrder.id}</p>
              </div>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {completeError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-mono">
                {completeError}
              </div>
            )}

            <form onSubmit={handleCompleteOrderSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Upload Delivery Report File <span className="text-slate-400 text-[10px] lowercase font-mono">(PDF, CSV, Excel - optional if link provided)</span>
                </label>
                <input
                  id="complete-report-file"
                  type="file"
                  accept=".pdf,.csv,.xls,.xlsx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCompleteFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-200 file:text-[10px] file:font-bold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100 file:uppercase file:tracking-wider cursor-pointer font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Delivery Spreadsheet Link <span className="text-slate-400 text-[10px] lowercase font-mono">(optional)</span>
                </label>
                <input
                  id="complete-delivery-link"
                  type="url"
                  placeholder="e.g. https://docs.google.com/spreadsheets/d/your-id"
                  value={completeLink}
                  onChange={(e) => setCompleteLink(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>



              <button
                id="complete-submit-btn"
                type="submit"
                disabled={completeSubmitting}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {completeSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Upload size={12} />
                    <span>Upload & Deliver Campaign</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[10000] p-4 animate-fade-in" id="confirmation-dialog-modal">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 md:p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`p-4 rounded-full ${confirmIsDanger ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                {confirmIsDanger ? <AlertTriangle size={28} /> : <HelpCircle size={28} />}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  {confirmTitle}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                  {confirmMessage}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="modal-confirm-btn"
                onClick={() => {
                  confirmAction();
                  setShowConfirmModal(false);
                }}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm ${
                  confirmIsDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmButtonText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CAMPAIGN ORDER DETAILS & PREVIEW --- */}
      {showDetailsModal && selectedOrderDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in" id="order-details-modal">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/95 flex items-center gap-2">
                  <span>📋 Campaign Order Details</span>
                  <span className="font-mono text-[10px] text-blue-400 bg-blue-950 border border-blue-800 px-2 py-0.5 rounded-lg">#{selectedOrderDetails.id}</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                  Client: {selectedOrderDetails.userName} • {selectedOrderDetails.userEmail}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Category, Qty & Cost Card */}
              <div className="grid grid-cols-3 gap-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Package</span>
                  <span className="font-bold text-slate-800 text-xs">{selectedOrderDetails.category}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Quantity</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">{selectedOrderDetails.quantity.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Total Cost</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">{settings.currency} {selectedOrderDetails.totalCost.toLocaleString()}</span>
                </div>
              </div>

              {/* Text notes */}
              {selectedOrderDetails.notes && (
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Manual Instructions / Notes</h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto shadow-2xs leading-relaxed">
                    {selectedOrderDetails.notes}
                  </div>
                </div>
              )}

              {/* File Attachment & Previews */}
              {selectedOrderDetails.attachedFile && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Attached Campaign File</h4>
                    <a
                      href={selectedOrderDetails.attachedFile ? `${selectedOrderDetails.attachedFile}&token=${token}` : "#"}
                      download={selectedOrderDetails.attachedFileName || "campaign_data.txt"}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold font-sans text-[10px] uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                    >
                      <Download size={11} />
                      <span>Download Campaign File</span>
                    </a>
                  </div>

                  {/* File Metadata Card */}
                  <div className="p-3 bg-blue-50/50 border border-blue-200/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs uppercase shadow-3xs border border-blue-100 font-mono">
                        {(selectedOrderDetails.attachedFileName || "").split(".").pop() || "TXT"}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 font-mono">{selectedOrderDetails.attachedFileName || "campaign_data.txt"}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Securely archived on platform storage</p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive preview section */}
                  {((selectedOrderDetails.attachedFileName || "").toLowerCase().endsWith(".txt") || 
                    (selectedOrderDetails.attachedFileName || "").toLowerCase().endsWith(".csv")) ? (
                    <div className="space-y-2">
                      <h5 className="text-[9px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1">
                        <span>🔍 Interactive File Data Preview</span>
                        <span className="px-1.5 bg-slate-100 text-slate-500 rounded text-[8px] font-bold">LATEST FILE ROW PREVIEW</span>
                      </h5>
                      
                      {previewLoading ? (
                        <div className="p-8 border border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 bg-slate-50/40">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">Streaming file data block...</span>
                        </div>
                      ) : previewContent ? (
                        (selectedOrderDetails.attachedFileName || "").toLowerCase().endsWith(".csv") ? (
                          renderCsvTable(previewContent)
                        ) : (
                          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 max-h-56 overflow-y-auto whitespace-pre-wrap shadow-2xl leading-relaxed">
                            {previewContent}
                          </div>
                        )
                      ) : (
                        <p className="text-slate-400 text-xs italic">Unable to stream preview data block.</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 border border-dashed border-slate-200 bg-slate-50 rounded-xl text-center">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Sheet / Document Interactive Preview Not Available</p>
                      <p className="text-[9px] text-slate-400 mt-1">Previews are only generated for plain text (.txt) and spreadsheets (.csv) files. Please download this file to inspect campaign sheets.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD / EDIT INVENTORY ROW --- */}
      {showRowModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-fade-in" id="add-edit-row-modal">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {selectedRow ? "Edit Domain record" : "Add New Domain record"}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono font-bold">
                  {selectedRow ? `Row ID: ${selectedRow.id}` : "Configure niche metrics & price"}
                </p>
              </div>
              <button 
                onClick={() => setShowRowModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRowSubmit}>
              <div className="p-6 space-y-4">
                {rowError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 font-mono rounded-lg">
                    {rowError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                    Domain Category / Niche Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Technology, Health, Fashion, Web 2.0"
                    value={rowForm.category}
                    onChange={(e) => setRowForm({ ...rowForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                      Domain Authority (DA)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 50 or custom text"
                      value={rowForm.da}
                      onChange={(e) => setRowForm({ ...rowForm, da: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs font-mono font-bold text-slate-800 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                      Domain Rating (DR)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 60 or custom text"
                      value={rowForm.dr}
                      onChange={(e) => setRowForm({ ...rowForm, dr: e.target.value })}
                      className="w-full px-4 py-2.5 text-xs font-mono font-bold text-slate-800 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                    Unit Price (Cr)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1500 or custom price"
                    value={rowForm.price}
                    onChange={(e) => setRowForm({ ...rowForm, price: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-mono font-bold text-slate-800 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                    Domain Status (e.g. Available / Custom text. Leave blank to hide from users)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Available, High Quality, or custom status text"
                    value={rowForm.status}
                    onChange={(e) => setRowForm({ ...rowForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                    Total (Any Text or Number)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100 or Unlimited"
                    value={rowForm.total}
                    onChange={(e) => setRowForm({ ...rowForm, total: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-mono font-bold text-slate-800 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
                    Destination Table / Category Tab
                  </label>
                  <select
                    value={rowForm.tab}
                    onChange={(e) => setRowForm({ ...rowForm, tab: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-semibold text-slate-800 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none transition-all cursor-pointer bg-white"
                  >
                    <option value="Authority Backlinks">Authority Backlinks (Table 1)</option>
                    <option value="High DA Guest Posts">High DA Guest Posts (Table 2)</option>
                  </select>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowRowModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rowSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {rowSubmitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={13} />
                      <span>{selectedRow ? "Save Changes" : "Create Record"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve and Edit Deposit Request Modal */}
      {showApproveDepositModal && selectedDepositForApproval && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Review & Approve Deposit
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Verify transfer and customize approved credit amount if needed.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowApproveDepositModal(false);
                  setSelectedDepositForApproval(null);
                }} 
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200/50"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit}>
              <div className="p-6 space-y-5">
                {/* Client Profile */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                  <h4 className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">
                    Client Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Name</span>
                      <span className="font-bold text-slate-800">{selectedDepositForApproval.userName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Email</span>
                      <span className="font-mono text-slate-600 break-all">{selectedDepositForApproval.userEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Bank Profile Verification */}
                <div className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-emerald-50/20">
                  <h4 className="text-[10px] uppercase tracking-widest font-extrabold text-emerald-600/80 flex items-center gap-1.5">
                    <span>Registered Bank Account (For Cross-Verification)</span>
                  </h4>
                  {selectedDepositForApproval.userBankName ? (
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Bank Name</span>
                        <span className="font-bold text-emerald-800 bg-emerald-100/50 border border-emerald-200/50 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider inline-block">
                          {selectedDepositForApproval.userBankName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Account Title</span>
                        <span className="font-semibold text-slate-800">{selectedDepositForApproval.userAccountTitle}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Account / IBAN Number</span>
                        <span className="font-mono text-xs font-bold text-slate-700 bg-white border border-slate-150 px-2 py-1 rounded-lg block select-all mt-1">
                          {selectedDepositForApproval.userAccountNumber}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No bank profile configured by client.</p>
                  )}
                </div>

                {/* Transaction Proof */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200/60 rounded-2xl p-4 space-y-2 bg-slate-50/50">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">TID (Transaction ID)</span>
                    <span className="font-mono text-xs font-bold text-slate-700 block">
                      {selectedDepositForApproval.transactionId && selectedDepositForApproval.transactionId !== "N/A" ? (
                        selectedDepositForApproval.transactionId
                      ) : (
                        <span className="text-slate-400 font-normal italic">None provided</span>
                      )}
                    </span>
                  </div>

                  <div className="border border-slate-200/60 rounded-2xl p-4 space-y-2 bg-slate-50/50 flex flex-col justify-center">
                    <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-semibold">Screenshot Proof</span>
                    {selectedDepositForApproval.screenshot ? (
                      <a
                        href={`${selectedDepositForApproval.screenshot}?token=${token}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
                      >
                        <span>View Attachment</span>
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No receipt attached</span>
                    )}
                  </div>
                </div>

                {/* Amount Review & Editable Input */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase tracking-widest font-extrabold text-slate-500">
                    Deposit Amount to Approve & Credit
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Admin can edit this value before approval (e.g. if partial transfer or fee adjustments are made).
                  </p>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 font-bold text-xs font-mono">{settings.currency}</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      required
                      min="0.01"
                      value={approvalAmount}
                      onChange={(e) => setApprovalAmount(e.target.value)}
                      className="w-full pl-16 pr-4 py-3.5 text-sm font-bold font-mono text-slate-800 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 focus:outline-none transition-all shadow-xs"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowApproveDepositModal(false);
                    setSelectedDepositForApproval(null);
                  }}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle size={14} />
                  <span>Approve & Credit Balance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

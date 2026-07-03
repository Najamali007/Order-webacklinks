/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import Login from "./components/Login.js";
import UserDashboard from "./components/UserDashboard.js";
import AdminDashboard from "./components/AdminDashboard.js";
import { User, AppSettings } from "./types.js";

const DEFAULT_SETTINGS: AppSettings = {
  websiteName: "WeBacklinks",
  logo: "WeBacklinks",
  currency: "PKR",
  depositInstructions: "",
  contactEmail: "support@webacklinks.com",
  smtpEmail: "",
  smtpHost: "",
  smtpPort: 587,
  smtpUser: "",
  smtpPass: "",
  prices: {
    "Web 2.0": 10,
    "Web 2.0 Profile": 10,
    "Web Directories": 10,
    "Wiki Related Sites": 10,
    "Social Bookmarking": 10,
    "Listing Sites": 30,
    "Mixed Backlinks": 30,
    "PDF Submission": 40,
    "Article Submission": 50,
  },
  bankAccounts: []
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [globalAlert, setGlobalAlert] = useState<{ show: boolean; message: string } | null>(null);

  useEffect(() => {
    window.alert = (message: string) => {
      setGlobalAlert({ show: true, message });
    };
  }, []);

  useEffect(() => {
    // Initial data pipeline load
    const initializeApp = async () => {
      // 1. Fetch system settings
      try {
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }
      } catch (e) {
        console.error("Failed to load platform settings:", e);
      }

      // 2. Resolve active session from localStorage
      const savedToken = localStorage.getItem("backlink_session_token");
      if (savedToken) {
        try {
          const profileRes = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${savedToken}` },
          });

          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setUser(profileData.user);
            setToken(savedToken);
          } else {
            // Token expired or invalid, purge
            localStorage.removeItem("backlink_session_token");
          }
        } catch (e) {
          console.error("Failed to authenticate session:", e);
        }
      }
      setLoading(false);
    };

    initializeApp();
  }, []);

  const handleLoginSuccess = (loggedInUser: User, sessionToken: string) => {
    setUser(loggedInUser);
    setToken(sessionToken);
    localStorage.setItem("backlink_session_token", sessionToken);
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.error(e);
      }
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("backlink_session_token");
    window.location.href = "https://webacklinks.com/";
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white" id="app-loading">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-display font-medium text-slate-400 text-sm">Initializing platform workspace...</p>
      </div>
    );
  }

  const renderAlertModal = () => {
    if (!globalAlert || !globalAlert.show) return null;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in" id="global-alert-modal">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200/85 shadow-2xl animate-zoom-in text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <AlertCircle size={22} className="animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Notification</h4>
            <p className="text-xs text-slate-600 font-semibold leading-relaxed">{globalAlert.message}</p>
          </div>
          <button
            onClick={() => setGlobalAlert(null)}
            className="w-full py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    );
  };

  const isAdminPath = window.location.pathname === "/webacklinks-admin";

  if (!user || !token) {
    return (
      <>
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          websiteName={settings.websiteName} 
          isAdminView={isAdminPath}
        />
        {renderAlertModal()}
      </>
    );
  }

  if (user.role !== "admin" && isAdminPath) {
    return (
      <>
        <Login 
          onLoginSuccess={handleLoginSuccess} 
          websiteName={settings.websiteName} 
          isAdminView={true}
        />
        {renderAlertModal()}
      </>
    );
  }

  if (user.role === "admin") {
    if (!isAdminPath) {
      window.history.replaceState(null, "", "/webacklinks-admin");
    }
    return (
      <>
        <AdminDashboard
          user={user}
          token={token}
          settings={settings}
          onLogout={handleLogout}
          onUpdateSettings={handleUpdateSettings}
          onUpdateUser={handleUpdateUser}
        />
        {renderAlertModal()}
      </>
    );
  }

  return (
    <>
      <UserDashboard
        user={user}
        token={token}
        settings={settings}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateUser}
      />
      {renderAlertModal()}
    </>
  );
}

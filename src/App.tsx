/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
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

  const isAdminPath = window.location.pathname === "/webacklinks-admin";

  if (!user || !token) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        websiteName={settings.websiteName} 
        isAdminView={isAdminPath}
      />
    );
  }

  if (user.role !== "admin" && isAdminPath) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        websiteName={settings.websiteName} 
        isAdminView={true}
      />
    );
  }

  if (user.role === "admin") {
    if (!isAdminPath) {
      window.history.replaceState(null, "", "/webacklinks-admin");
    }
    return (
      <AdminDashboard
        user={user}
        token={token}
        settings={settings}
        onLogout={handleLogout}
        onUpdateSettings={handleUpdateSettings}
        onUpdateUser={handleUpdateUser}
      />
    );
  }

  return (
    <UserDashboard
      user={user}
      token={token}
      settings={settings}
      onLogout={handleLogout}
      onUpdateUser={handleUpdateUser}
    />
  );
}

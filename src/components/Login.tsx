/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { LogIn, UserPlus, Phone, Mail, Lock, User as UserIcon, ShieldAlert, Eye, EyeOff, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types.js";
import WeBacklinksLogo, { WeBacklinksSiteIcon, WeBacklinksOriginalLogo } from "./WeBacklinksLogo.js";

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
  websiteName: string;
  isAdminView?: boolean;
}

export default function Login({ onLoginSuccess, websiteName, isAdminView = false }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  
  // Verification states
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyEmail, setVerifyEmail] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+92");
  const [securityKey, setSecurityKey] = useState("");
  
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isAdminView && email.toLowerCase() !== "najam786ali@yahoo.com") {
      setError("Access Denied. Only the Super Admin email can sign in here.");
      setLoading(false);
      return;
    }

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister 
      ? { name, email, password, phone: `${countryCode} ${phone.trim()}` }
      : isAdminView
        ? { email, password, securityKey }
        : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      if (isRegister && data.needsVerification) {
        setVerifyEmail(data.email);
        setShowVerification(true);
        setIsRegister(false);
        setError("");
        setResendSuccess("");
        return;
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Connection failure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResendSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setResendSuccess("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code.");
      }

      setResendSuccess(data.message || "A new code has been sent.");
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    }
  };


  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResetSuccess(data.message || "Password updated successfully. You can now login.");
      setResetEmail("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message || "Connection failure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-x-hidden relative" id="login-container">
      {/* Go to Main Website Link */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-5 z-50">
        <a
          href="https://webacklinks.com/"
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 border border-slate-200 shadow-2xs hover:shadow-sm rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95 backdrop-blur-md"
        >
          <Globe size={12} className="text-slate-500 transition-colors duration-200" />
          <span className="hidden sm:inline">Go to Main Website</span>
          <span className="inline sm:hidden">Website</span>
        </a>
      </div>

      {/* Decorative animated floating particles in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            y: [0, -20, 0],
            rotate: [0, 10, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-[10%] left-[5%] w-64 h-64 rounded-full bg-blue-100/30 blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, 30, 0],
            rotate: [0, -15, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute bottom-[10%] right-[5%] w-96 h-96 rounded-full bg-indigo-100/20 blur-3xl"
        />
      </div>

      {/* Visual Brand Panel with slide & fade-in */}
      <motion.div 
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full md:w-[38%] lg:w-[440px] bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-between p-8 md:p-12 text-white border-b md:border-b-0 md:border-r border-slate-800 shrink-0 relative overflow-hidden z-10"
      >
        {/* Premium ambient decorative glow mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.06),transparent_50%)] pointer-events-none" />
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          className="flex items-center gap-3 relative z-10"
        >
          {/* Pulsating / floating original logo container */}
          <motion.div
            animate={{ 
              y: [0, -6, 0],
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="cursor-pointer"
          >
            <WeBacklinksSiteIcon className="w-12 h-12 shadow-xl rounded-2xl bg-white/5 border border-white/10 p-2" />
          </motion.div>
          <div>
            <span className="font-display font-light text-2xl tracking-tight text-white block">
              We<span className="font-bold">Backlinks</span>
            </span>
            <p className="text-[10px] uppercase tracking-widest opacity-60 font-mono mt-0.5">
              {isAdminView ? "Admin Security Terminal" : "SEO Backlink Management"}
            </p>
          </div>
        </motion.div>

        <div className="my-auto py-12 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans text-3xl md:text-4xl font-light tracking-tight leading-tight text-white mb-6"
          >
            {isAdminView ? (
              <>
                Authorized <span className="font-extrabold bg-gradient-to-r from-red-400 via-amber-300 to-red-500 bg-clip-text text-transparent drop-shadow-sm">Admin Control</span> Gateway
              </>
            ) : (
              <>
                Rank Higher with <span className="font-extrabold bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-sm">Premium SEO</span> Backlinks
              </>
            )}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
            className="text-slate-300/90 text-xs tracking-wide leading-relaxed"
          >
            {isAdminView ? (
              "Welcome to the secure administrative management interface. Log in with your Super Admin credentials and security key to manage user accounts, audit credit deposits, configure live bank details, and execute order backlink fulfillment."
            ) : (
              "Order premium Web 2.0, high DA article submissions, and wiki platforms. Track, manage, and download PDF reports in real time from a singular, secure dashboard."
            )}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-8 grid grid-cols-2 gap-4"
          >
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-xs hover:bg-white/10 transition-all duration-300 group cursor-pointer">
              <div className="text-xl font-light text-white font-sans group-hover:scale-105 transition-transform duration-300 origin-left">100%</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-1">Isolate User Privacy</div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 shadow-xs hover:bg-white/10 transition-all duration-300 group cursor-pointer">
              <div className="text-xl font-light text-green-400 font-sans group-hover:scale-105 transition-transform duration-300 origin-left">Instant</div>
              <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-1">Manual Credit Audits</div>
            </div>
          </motion.div>
        </div>

        {/* Support on WhatsApp and Community Buttons */}
        <div className="mt-auto pt-6 relative z-10 flex flex-col sm:flex-row gap-2.5">
          <a
            href="https://wa.me/923235854582"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:-translate-y-0.5 active:translate-y-0 group cursor-pointer text-center"
          >
            <Phone size={12} className="group-hover:scale-110 transition-transform duration-300 shrink-0" />
            <span className="truncate">WhatsApp Support</span>
          </a>
          <a
            href="https://whatsapp.com/channel/0029VbDeCP06LwHjGT5prQ0m"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 group cursor-pointer text-center"
          >
            <Globe size={12} className="group-hover:scale-110 transition-transform duration-300 shrink-0" />
            <span className="truncate">Join Community</span>
          </a>
        </div>
      </motion.div>

      {/* Form Panel - Perfectly Centered, Spacious and beautifully styled with a credit footer */}
      <div className="flex-1 flex flex-col justify-between p-6 md:p-12 lg:p-16 bg-white relative z-10 min-h-[600px]">
        {/* Top dummy helper to balance space */}
        <div className="hidden md:block h-6" />

        <div className="w-full max-w-md mx-auto my-auto overflow-hidden py-4">
          <AnimatePresence mode="wait">
            {isForgot ? (
              // Forgot Password Form View
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="text-center mb-8">
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
                    Reset password
                  </h2>
                  <p className="text-slate-500 mt-2 text-xs uppercase tracking-wider font-medium">
                    Enter your registered email address and set your new password
                  </p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs tracking-wide leading-relaxed" 
                    id="auth-error"
                  >
                    {error}
                  </motion.div>
                )}

                {resetSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs tracking-wide leading-relaxed" 
                    id="auth-success"
                  >
                    {resetSuccess}
                  </motion.div>
                )}

                <form onSubmit={handleResetSubmit} className="space-y-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Mail size={16} />
                      </span>
                      <input
                        id="reset-email"
                        type="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="e.g. client@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                      New Security Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Lock size={16} />
                      </span>
                      <input
                        id="reset-password"
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        title={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    id="reset-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Lock size={16} />
                        <span>Update Password Now</span>
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-8 text-center border-t border-slate-200/60 pt-6">
                  <button
                    onClick={() => {
                      setIsForgot(false);
                      setError("");
                      setResetSuccess("");
                    }}
                    className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </motion.div>
            ) : showVerification ? (
              // Email Verification View
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="text-center mb-8">
                  <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Mail size={24} className="animate-bounce" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900">
                    Verify Your Email
                  </h2>
                  <p className="text-slate-500 mt-2 text-xs leading-relaxed max-w-sm mx-auto">
                    We have dispatched a secure 6-digit confirmation code to <strong className="text-slate-800">{verifyEmail}</strong>. Please enter it below.
                  </p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs tracking-wide leading-relaxed" 
                    id="auth-error"
                  >
                    {error}
                  </motion.div>
                )}

                {resendSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs tracking-wide leading-relaxed" 
                  >
                    {resendSuccess}
                  </motion.div>
                )}

                <form onSubmit={handleVerifySubmit} className="space-y-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 text-center">
                      6-Digit Verification Code
                    </label>
                    <div className="relative max-w-[240px] mx-auto">
                      <input
                        id="verification-code"
                        type="text"
                        maxLength={6}
                        required
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 123456"
                        className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-lg font-bold tracking-widest text-center transition-all"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    id="verify-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <LogIn size={16} />
                        <span>Verify and Login</span>
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-8 text-center border-t border-slate-200/60 pt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    Resend Verification Code
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowVerification(false);
                      setIsRegister(true);
                      setError("");
                      setResendSuccess("");
                    }}
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Back to Registration
                  </button>
                </div>
              </motion.div>
            ) : (
              // Regular Login / Register Views
              <motion.div
                key={isRegister ? "register" : "login"}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="text-center mb-8">
                  <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
                    {isAdminView ? "Admin Portal Access" : isRegister ? "Create client account" : "Sign in to account"}
                  </h2>
                  <p className="text-slate-500 mt-2 text-xs uppercase tracking-wider font-medium">
                    {isAdminView 
                      ? "Enter secure admin credentials & security key"
                      : isRegister 
                        ? "Register below to place your backlink orders" 
                        : "Enter credentials to access your dashboard"}
                  </p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs tracking-wide leading-relaxed" 
                    id="auth-error"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {isRegister && (
                    <div className="space-y-5">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                      >
                        <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                            <UserIcon size={16} />
                          </span>
                          <input
                            id="register-name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Muhammad Ali"
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs transition-all"
                          />
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                          Phone Number
                        </label>
                        <div className="flex gap-2">
                          <div className="w-[110px] shrink-0">
                            <select
                              value={countryCode}
                              onChange={(e) => setCountryCode(e.target.value)}
                              className="w-full px-2 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white text-xs transition-all h-[42px] cursor-pointer font-medium"
                            >
                              <option value="+92">🇵🇰 +92</option>
                              <option value="+1">🇺🇸 +1</option>
                              <option value="+44">🇬🇧 +44</option>
                              <option value="+971">🇦🇪 +971</option>
                              <option value="+966">🇸🇦 +966</option>
                              <option value="+91">🇮🇳 +91</option>
                              <option value="+880">🇧🇩 +880</option>
                              <option value="+61">🇦🇺 +61</option>
                              <option value="+49">🇩🇪 +49</option>
                              <option value="+90">🇹🇷 +90</option>
                              <option value="+965">🇰🇼 +965</option>
                              <option value="+968">🇴🇲 +968</option>
                              <option value="+974">🇶🇦 +974</option>
                              <option value="+973">🇧🇭 +973</option>
                            </select>
                          </div>
                          <div className="flex-1 relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                              <Phone size={16} />
                            </span>
                            <input
                              id="register-phone"
                              type="tel"
                              required
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="300 1234567"
                              className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs transition-all h-[42px]"
                            />
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Mail size={16} />
                      </span>
                      <input
                        id="auth-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. client@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs transition-all"
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        Password
                      </label>
                      {!isRegister && !isAdminView && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgot(true);
                            setError("");
                          }}
                          className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Lock size={16} />
                      </span>
                      <input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </motion.div>

                  {isAdminView && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 flex items-center gap-1.5">
                        <ShieldAlert size={12} className="text-amber-500 animate-pulse" />
                        <span>Security Key</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Lock size={16} className="text-amber-500/80" />
                        </span>
                        <input
                          id="admin-security-key"
                          type="password"
                          required
                          value={securityKey}
                          onChange={(e) => setSecurityKey(e.target.value)}
                          placeholder="Najam2712ali__!!??@@"
                          className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-amber-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-1 focus:ring-amber-500 text-xs transition-all"
                        />
                      </div>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    id="auth-submit-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : isRegister ? (
                      <>
                        <UserPlus size={16} />
                        <span>Register Account</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={16} />
                        <span>Sign In Securely</span>
                      </>
                    )}
                  </motion.button>
                </form>

                {!isAdminView && (
                  <div className="mt-8 text-center border-t border-slate-200/60 pt-6">
                    <button
                      id="auth-switch-btn"
                      onClick={() => {
                        setIsRegister(!isRegister);
                        setError("");
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                    >
                      {isRegister ? "Already have an account? Sign In" : "Need an account? Register Client Account"}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom footer for website designer and support contact */}
        <div className="text-center text-[11px] text-slate-400 mt-8 pt-4 border-t border-slate-100 relative z-10 w-full max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-semibold text-slate-500">
            Need support?{" "}
            <a
              href="mailto:mail@webacklinks.com"
              className="text-blue-600 hover:text-blue-700 font-extrabold transition-all hover:underline"
            >
              mail@webacklinks.com
            </a>
          </p>
          <p className="text-[10px]">
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
  );
}

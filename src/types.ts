/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "inactive";
export type OrderStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type DepositStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Hashed password, omitted in client responses
  phone: string;
  role: UserRole;
  balance: number; // in PKR (or configured currency)
  approvedTopUpAmount?: number; // approved by admin for next topup
  status: UserStatus;
  createdAt: string;
  avatar?: string | null; // Base64 or local filepath
  userBankName?: string;
  userAccountTitle?: string;
  userAccountNumber?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  category: string;
  quantity: number;
  totalCost: number;
  status: OrderStatus;
  createdAt: string;
  pdfReport: string | null;
  deliveryLink: string | null;
  notes: string | null;
  completionDate: string | null;
  attachedFile?: string | null;
  attachedFileName?: string | null;
}

export interface DepositRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  screenshot: string | null; // Base64 or local filepath
  status: DepositStatus;
  createdAt: string;
  reviewedAt: string | null;
  userBankName?: string;
  userAccountTitle?: string;
  userAccountNumber?: string;
}

export interface Notification {
  id: string;
  userId: string | null; // null means target is admin or broad
  role: "user" | "admin" | "all";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface BacklinkCategoryItem {
  name: string;
  price: number;
  minLimit: number;
  maxLimit: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
}

export interface AppSettings {
  websiteName: string;
  logo: string; // URL or text logo
  currency: string; // Default: PKR (Rs.)
  depositInstructions: string;
  contactEmail: string;
  smtpEmail: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  prices: Record<string, number>; // Mapping category -> price each
  categories?: BacklinkCategoryItem[]; // Custom categories and packages
  bankAccounts?: BankAccount[]; // Structured bank accounts for copy-paste
  customTabs?: string[]; // Custom tab names for the dashboard
  domainListFile?: string | null; // Attached file for Domain List
  domainListFileName?: string | null; // Filename for attached Domain List
  domainListUrl?: string | null; // Google Sheet/External Link for Domain List
  megaEmail?: string | null; // Email login for MEGA.nz
  megaPassword?: string | null; // Password login for MEGA.nz
}

export interface DashboardRow {
  id: string;
  category: string;
  da: string;
  dr: string;
  price: string | number;
  status?: string;
  total?: string;
  tab?: string;
  createdAt: string;
}

export const BACKLINK_CATEGORIES = [
  "Web 2.0",
  "Web 2.0 Profile",
  "Web Directories",
  "Wiki Related Sites",
  "Social Bookmarking",
  "Listing Sites",
  "Mixed Backlinks",
  "PDF Submission",
  "Article Submission",
] as const;

export type BacklinkCategory = typeof BACKLINK_CATEGORIES[number];

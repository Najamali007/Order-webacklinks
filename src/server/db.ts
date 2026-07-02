/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { User, Order, DepositRequest, Notification, AppSettings } from "../types.js";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DatabaseSchema {
  users: User[];
  orders: Order[];
  deposits: DepositRequest[];
  notifications: Notification[];
  settings: AppSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
  websiteName: "WeBacklinks",
  logo: "WeBacklinks",
  currency: "PKR",
  depositInstructions: "Please send the amount to Easypaisa / JazzCash / Bank Account:\n\n- Easypaisa: 0300-1234567 (Title: SEO Hub Admin)\n- Bank Account: Allied Bank 0123456789 (Title: SEO Backlink Platform)\n\nAfter sending, input the Transaction ID, Deposit Amount, and Payment Method below.",
  contactEmail: "support@webacklinks.com",
  smtpEmail: "smtp-admin@webacklinks.com",
  smtpHost: "smtp.mailtrap.io",
  smtpPort: 2525,
  smtpUser: "your-smtp-username",
  smtpPass: "your-smtp-password",
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
  categories: [
    { name: "Web 2.0", price: 10, minLimit: 100, maxLimit: 10000 },
    { name: "Web 2.0 Profile", price: 10, minLimit: 100, maxLimit: 10000 },
    { name: "Web Directories", price: 10, minLimit: 100, maxLimit: 10000 },
    { name: "Wiki Related Sites", price: 10, minLimit: 100, maxLimit: 10000 },
    { name: "Social Bookmarking", price: 10, minLimit: 100, maxLimit: 10000 },
    { name: "Listing Sites", price: 30, minLimit: 50, maxLimit: 5000 },
    { name: "Mixed Backlinks", price: 30, minLimit: 50, maxLimit: 5000 },
    { name: "PDF Submission", price: 40, minLimit: 50, maxLimit: 5000 },
    { name: "Article Submission", price: 50, minLimit: 50, maxLimit: 5000 },
  ],
  bankAccounts: [
    {
      id: "bank_1",
      bankName: "Meezan Bank Limited",
      accountName: "SEO Backlink Hub",
      accountNumber: "1234-01020304-5",
      iban: "PK49MEZN01234010203045"
    },
    {
      id: "bank_2",
      bankName: "Easypaisa Mobile Account",
      accountName: "Muhammad Ali",
      accountNumber: "0300-1234567",
      iban: "N/A"
    }
  ]
};

// Ensure database file exists and is seeded
function initializeDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content) as DatabaseSchema;
      let dirty = false;

      // Migrate existing settings support email
      if (parsed.settings && parsed.settings.contactEmail !== "support@webacklinks.com") {
        parsed.settings.contactEmail = "support@webacklinks.com";
        dirty = true;
      }
      if (parsed.settings && parsed.settings.smtpEmail !== "smtp-admin@webacklinks.com") {
        parsed.settings.smtpEmail = "smtp-admin@webacklinks.com";
        dirty = true;
      }

      // Check if super admin already exists
      const hasSuperAdmin = parsed.users.some(u => u.email.toLowerCase() === "najam786ali@yahoo.com");
      if (!hasSuperAdmin) {
        const salt = bcrypt.genSaltSync(10);
        const superAdminHashed = bcrypt.hashSync("Password7860@", salt);
        parsed.users.push({
          id: "usr_super_admin",
          name: "Super Admin",
          email: "najam786ali@yahoo.com",
          password: superAdminHashed,
          phone: "+923000000000",
          role: "admin",
          balance: 999999,
          status: "active",
          createdAt: new Date().toISOString()
        });
        dirty = true;
      }

      if (parsed.settings) {
        if (parsed.settings.websiteName !== "WeBacklinks") {
          parsed.settings.websiteName = "WeBacklinks";
          dirty = true;
        }
        if (parsed.settings.logo !== "WeBacklinks") {
          parsed.settings.logo = "WeBacklinks";
          dirty = true;
        }
        if (!parsed.settings.categories) {
          parsed.settings.categories = DEFAULT_SETTINGS.categories;
          dirty = true;
        }
        if (!parsed.settings.bankAccounts) {
          parsed.settings.bankAccounts = DEFAULT_SETTINGS.bankAccounts;
          dirty = true;
        }
        if (dirty) {
          fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
        }
      }
      return parsed;
    } catch (e) {
      console.error("Failed to read database, resetting to default...", e);
    }
  }

  // Pre-seed database with accounts
  const salt = bcrypt.genSaltSync(10);
  const adminPassword = bcrypt.hashSync("Password7860@", salt);
  const userPassword = bcrypt.hashSync("user123", salt);

  const initialData: DatabaseSchema = {
    users: [
      {
        id: "usr_super_admin",
        name: "Super Admin",
        email: "najam786ali@yahoo.com",
        password: adminPassword,
        phone: "+923000000000",
        role: "admin",
        balance: 999999,
        status: "active",
        createdAt: new Date("2026-01-01T12:00:00Z").toISOString(),
      },
      {
        id: "usr_client",
        name: "Test Client",
        email: "user@backlink.com",
        password: userPassword,
        phone: "+923219876543",
        role: "user",
        balance: 15000, // Pre-funded Rs. 15,000 for instant testing
        status: "active",
        createdAt: new Date("2026-06-15T09:30:00Z").toISOString(),
      }
    ],
    orders: [
      {
        id: "ord_1",
        userId: "usr_client",
        userName: "Test Client",
        userEmail: "user@backlink.com",
        category: "Web 2.0",
        quantity: 120,
        totalCost: 1200,
        status: "completed",
        createdAt: new Date("2026-06-20T10:00:00Z").toISOString(),
        pdfReport: "/uploads/reports/sample_report.pdf",
        deliveryLink: "https://docs.google.com/spreadsheets/d/sample",
        notes: "Highly optimized Web 2.0 list delivered.",
        completionDate: new Date("2026-06-21T14:00:00Z").toISOString(),
      },
      {
        id: "ord_2",
        userId: "usr_client",
        userName: "Test Client",
        userEmail: "user@backlink.com",
        category: "Mixed Backlinks",
        quantity: 80,
        totalCost: 2400,
        status: "pending",
        createdAt: new Date("2026-07-01T15:00:00Z").toISOString(),
        pdfReport: null,
        deliveryLink: null,
        notes: null,
        completionDate: null,
      }
    ],
    deposits: [
      {
        id: "dep_1",
        userId: "usr_client",
        userName: "Test Client",
        userEmail: "user@backlink.com",
        amount: 5000,
        paymentMethod: "Easypaisa",
        transactionId: "TXN987654321",
        screenshot: null,
        status: "approved",
        createdAt: new Date("2026-06-15T10:00:00Z").toISOString(),
        reviewedAt: new Date("2026-06-15T11:30:00Z").toISOString(),
      }
    ],
    notifications: [
      {
        id: "notif_1",
        userId: "usr_client",
        role: "user",
        title: "Welcome aboard!",
        message: "Your SEO Backlink Hub account is active. Your current balance is Rs. 15,000.",
        read: false,
        createdAt: new Date("2026-06-15T09:30:00Z").toISOString(),
      }
    ],
    settings: DEFAULT_SETTINGS,
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  return initialData;
}

// Global active schema instance in memory, flushed to disk on mutation.
let dbData: DatabaseSchema = initializeDatabase();

function flush(): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
}

export const db = {
  // --- USERS ---
  getUsers: (): User[] => dbData.users,
  getUserById: (id: string): User | undefined => dbData.users.find(u => u.id === id),
  getUserByEmail: (email: string): User | undefined => dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  createUser: (user: User): void => {
    dbData.users.push(user);
    flush();
  },
  updateUser: (id: string, updates: Partial<User>): User | null => {
    const idx = dbData.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    dbData.users[idx] = { ...dbData.users[idx], ...updates };
    flush();
    return dbData.users[idx];
  },
  deleteUser: (id: string): boolean => {
    const initialLen = dbData.users.length;
    dbData.users = dbData.users.filter(u => u.id !== id);
    // Also cleanup orders and deposits if deleting user (or keep them or null them)
    flush();
    return dbData.users.length < initialLen;
  },

  // --- ORDERS ---
  getOrders: (): Order[] => dbData.orders,
  getOrderById: (id: string): Order | undefined => dbData.orders.find(o => o.id === id),
  getOrdersByUserId: (userId: string): Order[] => dbData.orders.filter(o => o.userId === userId),
  createOrder: (order: Order): void => {
    dbData.orders.push(order);
    flush();
  },
  updateOrder: (id: string, updates: Partial<Order>): Order | null => {
    const idx = dbData.orders.findIndex(o => o.id === id);
    if (idx === -1) return null;
    dbData.orders[idx] = { ...dbData.orders[idx], ...updates };
    flush();
    return dbData.orders[idx];
  },
  deleteOrder: (id: string): boolean => {
    const initialLen = dbData.orders.length;
    dbData.orders = dbData.orders.filter(o => o.id !== id);
    flush();
    return dbData.orders.length < initialLen;
  },

  // --- DEPOSITS ---
  getDeposits: (): DepositRequest[] => dbData.deposits,
  getDepositById: (id: string): DepositRequest | undefined => dbData.deposits.find(d => d.id === id),
  getDepositsByUserId: (userId: string): DepositRequest[] => dbData.deposits.filter(d => d.userId === userId),
  createDeposit: (deposit: DepositRequest): void => {
    dbData.deposits.push(deposit);
    flush();
  },
  updateDeposit: (id: string, updates: Partial<DepositRequest>): DepositRequest | null => {
    const idx = dbData.deposits.findIndex(d => d.id === id);
    if (idx === -1) return null;
    dbData.deposits[idx] = { ...dbData.deposits[idx], ...updates };
    flush();
    return dbData.deposits[idx];
  },

  // --- NOTIFICATIONS ---
  getNotifications: (): Notification[] => dbData.notifications,
  getNotificationsByUserId: (userId: string): Notification[] => {
    return dbData.notifications.filter(n => n.userId === userId || n.role === "all" || (n.role === "user" && userId !== "usr_admin"));
  },
  getAdminNotifications: (): Notification[] => {
    return dbData.notifications.filter(n => n.role === "admin");
  },
  createNotification: (notif: Notification): void => {
    dbData.notifications.unshift(notif); // Put newest first
    // Limit to keep file clean
    if (dbData.notifications.length > 500) {
      dbData.notifications = dbData.notifications.slice(0, 500);
    }
    flush();
  },
  markNotificationsAsRead: (userId: string): void => {
    dbData.notifications.forEach(n => {
      if (n.userId === userId || n.role === "all") {
        n.read = true;
      }
    });
    flush();
  },

  // --- SETTINGS ---
  getSettings: (): AppSettings => dbData.settings,
  updateSettings: (updates: Partial<AppSettings>): AppSettings => {
    dbData.settings = { ...dbData.settings, ...updates };
    flush();
    return dbData.settings;
  }
};

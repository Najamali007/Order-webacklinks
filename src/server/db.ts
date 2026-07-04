/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { User, Order, DepositRequest, Notification, AppSettings, DashboardRow } from "../types.js";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DatabaseSchema {
  users: User[];
  orders: Order[];
  deposits: DepositRequest[];
  notifications: Notification[];
  settings: AppSettings;
  dashboardRows?: DashboardRow[];
}

const DEFAULT_SETTINGS: AppSettings = {
  websiteName: "WeBacklinks",
  logo: "WeBacklinks",
  currency: "PKR",
  depositInstructions: "Please send the amount to Easypaisa / JazzCash / Bank Account:\n\n- Easypaisa: 0300-1234567 (Title: SEO Hub Admin)\n- Bank Account: Allied Bank 0123456789 (Title: SEO Backlink Platform)\n\nAfter sending, input the Transaction ID, Deposit Amount, and Payment Method below.",
  contactEmail: "mail@webacklinks.com",
  smtpEmail: "mail@webacklinks.com",
  smtpHost: "smtp.hostinger.com",
  smtpPort: 587,
  smtpUser: "mail@webacklinks.com",
  smtpPass: "Password7860@",
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
  ],
  customTabs: ["Authority Backlinks", "High DA Guest Posts"],
  domainListFile: null,
  domainListFileName: null,
  domainListUrl: null
};

// --- MySQL Integration Configuration ---
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_NAME = process.env.DB_NAME;

let pool: mysql.Pool | null = null;
let isMySql = false;

// --- Helper Mappings for MySQL / TypeScript types ---
function mapUserToDb(user: any) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    phone: user.phone,
    role: user.role,
    balance: user.balance,
    approved_top_up_amount: user.approvedTopUpAmount || 0,
    status: user.status,
    created_at: user.createdAt,
    avatar: user.avatar || null,
    user_bank_name: user.userBankName || null,
    user_account_title: user.userAccountTitle || null,
    user_account_number: user.userAccountNumber || null
  };
}

function mapDbToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    phone: row.phone,
    role: row.role as any,
    balance: Number(row.balance),
    approvedTopUpAmount: Number(row.approved_top_up_amount || 0),
    status: row.status as any,
    createdAt: row.created_at,
    avatar: row.avatar || null,
    userBankName: row.user_bank_name || "",
    userAccountTitle: row.user_account_title || "",
    userAccountNumber: row.user_account_number || ""
  };
}

function mapOrderToDb(order: any) {
  return {
    id: order.id,
    user_id: order.userId,
    user_name: order.userName,
    user_email: order.userEmail,
    category: order.category,
    quantity: order.quantity,
    total_cost: order.totalCost,
    status: order.status,
    created_at: order.createdAt,
    pdf_report: order.pdfReport || null,
    delivery_link: order.deliveryLink || null,
    notes: order.notes || null,
    completion_date: order.completionDate || null,
    attached_file: order.attachedFile || null,
    attached_file_name: order.attachedFileName || null
  };
}

function mapDbToOrder(row: any): Order {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    category: row.category,
    quantity: Number(row.quantity),
    totalCost: Number(row.total_cost),
    status: row.status as any,
    createdAt: row.created_at,
    pdfReport: row.pdf_report || null,
    deliveryLink: row.delivery_link || null,
    notes: row.notes || null,
    completionDate: row.completion_date || null,
    attachedFile: row.attached_file || null,
    attachedFileName: row.attached_file_name || null
  };
}

function mapDepositToDb(dep: any) {
  return {
    id: dep.id,
    user_id: dep.userId,
    user_name: dep.userName,
    user_email: dep.userEmail,
    amount: dep.amount,
    payment_method: dep.paymentMethod,
    transaction_id: dep.transactionId,
    screenshot: dep.screenshot || null,
    status: dep.status,
    created_at: dep.createdAt,
    reviewed_at: dep.reviewedAt || null
  };
}

function mapDbToDeposit(row: any): DepositRequest {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    amount: Number(row.amount),
    paymentMethod: row.payment_method,
    transactionId: row.transaction_id,
    screenshot: row.screenshot || null,
    status: row.status as any,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at || null
  };
}

function mapNotificationToDb(notif: any) {
  return {
    id: notif.id,
    user_id: notif.userId || null,
    role: notif.role,
    title: notif.title,
    message: notif.message,
    is_read: notif.read ? 1 : 0,
    created_at: notif.createdAt
  };
}

function mapDbToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id || null,
    role: row.role as any,
    title: row.title,
    message: row.message,
    read: Boolean(row.is_read),
    createdAt: row.created_at
  };
}

function mapSettingsToDb(settings: AppSettings) {
  return {
    id: 1,
    website_name: settings.websiteName,
    logo: settings.logo,
    currency: settings.currency,
    deposit_instructions: settings.depositInstructions,
    contact_email: settings.contactEmail,
    smtp_email: settings.smtpEmail || "",
    smtp_host: settings.smtpHost || "",
    smtp_port: settings.smtpPort || 587,
    smtp_user: settings.smtpUser || "",
    smtp_pass: settings.smtpPass || "",
    prices: JSON.stringify(settings.prices || {}),
    categories: JSON.stringify(settings.categories || []),
    bank_accounts: JSON.stringify(settings.bankAccounts || []),
    custom_tabs: JSON.stringify(settings.customTabs || []),
    domain_list_file: settings.domainListFile || null,
    domain_list_file_name: settings.domainListFileName || null,
    domain_list_url: settings.domainListUrl || null,
    mega_email: settings.megaEmail || null,
    mega_password: settings.megaPassword || null
  };
}

function mapDbToSettings(row: any): AppSettings {
  let prices = DEFAULT_SETTINGS.prices;
  try {
    if (row.prices) prices = JSON.parse(row.prices);
  } catch (e) {}

  let categories = DEFAULT_SETTINGS.categories;
  try {
    if (row.categories) categories = JSON.parse(row.categories);
  } catch (e) {}

  let bankAccounts = DEFAULT_SETTINGS.bankAccounts;
  try {
    if (row.bank_accounts) bankAccounts = JSON.parse(row.bank_accounts);
  } catch (e) {}

  let customTabs = DEFAULT_SETTINGS.customTabs;
  try {
    if (row.custom_tabs) customTabs = JSON.parse(row.custom_tabs);
  } catch (e) {}

  return {
    websiteName: row.website_name || "WeBacklinks",
    logo: row.logo || "WeBacklinks",
    currency: row.currency || "PKR",
    depositInstructions: row.deposit_instructions || "",
    contactEmail: row.contact_email || "mail@webacklinks.com",
    smtpEmail: row.smtp_email || "",
    smtpHost: row.smtp_host || "",
    smtpPort: Number(row.smtp_port || 587),
    smtpUser: row.smtp_user || "",
    smtpPass: row.smtp_pass || "",
    prices,
    categories,
    bankAccounts,
    customTabs,
    domainListFile: row.domain_list_file || null,
    domainListFileName: row.domain_list_file_name || null,
    domainListUrl: row.domain_list_url || null,
    megaEmail: row.mega_email || null,
    megaPassword: row.mega_password || null
  };
}

function mapDashboardRowToDb(row: any) {
  return {
    id: row.id,
    category: row.category,
    da: String(row.da),
    dr: String(row.dr),
    price: String(row.price),
    status: row.status || null,
    total: row.total || null,
    tab: row.tab || null,
    created_at: row.createdAt
  };
}

function mapDbToDashboardRow(row: any): DashboardRow {
  return {
    id: row.id,
    category: row.category,
    da: row.da,
    dr: row.dr,
    price: isNaN(Number(row.price)) ? row.price : Number(row.price),
    status: row.status || "",
    total: row.total || "",
    tab: row.tab || "",
    createdAt: row.created_at
  };
}

// Ensure database file exists and is seeded for local JSON mode
function initializeDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content) as DatabaseSchema;
      let dirty = false;

      if (parsed.settings && parsed.settings.contactEmail !== "mail@webacklinks.com") {
        parsed.settings.contactEmail = "mail@webacklinks.com";
        dirty = true;
      }
      if (parsed.settings && parsed.settings.smtpEmail !== "mail@webacklinks.com") {
        parsed.settings.smtpEmail = "mail@webacklinks.com";
        dirty = true;
      }

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
        parsed.settings.customTabs = ["Authority Backlinks", "High DA Guest Posts"];
        dirty = true;
      }

      if (!parsed.dashboardRows) {
        parsed.dashboardRows = [
          {
            id: "db_row_1",
            category: "Tech & Gadgets Blogs",
            da: "55",
            dr: "60",
            price: 1500,
            status: "Available",
            createdAt: new Date("2026-06-20T10:00:00Z").toISOString()
          },
          {
            id: "db_row_2",
            category: "Business & Finance News",
            da: "62",
            dr: "65",
            price: 2500,
            status: "Available",
            createdAt: new Date("2026-06-21T11:00:00Z").toISOString()
          },
          {
            id: "db_row_3",
            category: "Health & Wellness Sites",
            da: "48",
            dr: "50",
            price: 1200,
            status: "Available",
            createdAt: new Date("2026-06-22T12:00:00Z").toISOString()
          }
        ];
        dirty = true;
      }

      if (dirty) {
        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), "utf-8");
      }
      return parsed;
    } catch (e) {
      console.error("Failed to read database, resetting to default...", e);
    }
  }

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
        balance: 15000,
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
    dashboardRows: [
      {
        id: "db_row_1",
        category: "Tech & Gadgets Blogs",
        da: "55",
        dr: "60",
        price: 1500,
        status: "Available",
        createdAt: new Date("2026-06-20T10:00:00Z").toISOString()
      },
      {
        id: "db_row_2",
        category: "Business & Finance News",
        da: "62",
        dr: "65",
        price: 2500,
        status: "Available",
        createdAt: new Date("2026-06-21T11:00:00Z").toISOString()
      },
      {
        id: "db_row_3",
        category: "Health & Wellness Sites",
        da: "48",
        dr: "50",
        price: 1200,
        status: "Available",
        createdAt: new Date("2026-06-22T12:00:00Z").toISOString()
      }
    ],
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  return initialData;
}

// Global active schema instance in memory, flushed to disk on mutation.
let dbData: DatabaseSchema = initializeDatabase();

function flush(): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), "utf-8");
}

async function runAsyncQuery(sql: string, params: any[] = []) {
  if (!isMySql || !pool) return;
  try {
    await pool.query(sql, params);
  } catch (err) {
    console.error("❌ MySQL Background Query Error:", err, "SQL:", sql, "Params:", params);
  }
}

async function ensureColumnExists(connection: mysql.Connection, table: string, column: string, typeAndConstraint: string) {
  try {
    const [rows]: any = await connection.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
    if (rows.length === 0) {
      console.log(`Adding missing column "${column}" to table "${table}"...`);
      await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${typeAndConstraint}`);
    }
  } catch (err) {
    console.error(`Error ensuring column "${column}" exists in "${table}":`, err);
  }
}

async function runMigrations() {
  if (!pool) return;

  const conn = await pool.getConnection();
  try {
    // 1. Create tables if not exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(150) UNIQUE NOT NULL,
        \`password\` VARCHAR(255) NOT NULL,
        \`phone\` VARCHAR(50) NOT NULL,
        \`role\` VARCHAR(20) DEFAULT 'user' NOT NULL,
        \`balance\` DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
        \`approved_top_up_amount\` DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
        \`status\` VARCHAR(20) DEFAULT 'active' NOT NULL,
        \`created_at\` VARCHAR(50) NOT NULL,
        \`avatar\` MEDIUMTEXT DEFAULT NULL,
        \`user_bank_name\` VARCHAR(100) DEFAULT NULL,
        \`user_account_title\` VARCHAR(100) DEFAULT NULL,
        \`user_account_number\` VARCHAR(100) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`orders\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`user_id\` VARCHAR(50) NOT NULL,
        \`user_name\` VARCHAR(100) NOT NULL,
        \`user_email\` VARCHAR(150) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`quantity\` INT NOT NULL,
        \`total_cost\` DECIMAL(15,2) NOT NULL,
        \`status\` VARCHAR(50) DEFAULT 'pending' NOT NULL,
        \`created_at\` VARCHAR(50) NOT NULL,
        \`pdf_report\` VARCHAR(255) DEFAULT NULL,
        \`delivery_link\` VARCHAR(255) DEFAULT NULL,
        \`notes\` TEXT DEFAULT NULL,
        \`completion_date\` VARCHAR(50) DEFAULT NULL,
        \`attached_file\` VARCHAR(500) DEFAULT NULL,
        \`attached_file_name\` VARCHAR(255) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`deposit_requests\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`user_id\` VARCHAR(50) NOT NULL,
        \`user_name\` VARCHAR(100) NOT NULL,
        \`user_email\` VARCHAR(150) NOT NULL,
        \`amount\` DECIMAL(15,2) NOT NULL,
        \`payment_method\` VARCHAR(100) NOT NULL,
        \`transaction_id\` VARCHAR(100) NOT NULL,
        \`screenshot\` VARCHAR(255) DEFAULT NULL,
        \`status\` VARCHAR(50) DEFAULT 'pending' NOT NULL,
        \`created_at\` VARCHAR(50) NOT NULL,
        \`reviewed_at\` VARCHAR(50) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`user_id\` VARCHAR(50) DEFAULT NULL,
        \`role\` VARCHAR(20) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`message\` TEXT NOT NULL,
        \`is_read\` TINYINT(1) DEFAULT 0 NOT NULL,
        \`created_at\` VARCHAR(50) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`settings\` (
        \`id\` INT PRIMARY KEY AUTO_INCREMENT,
        \`website_name\` VARCHAR(100) NOT NULL DEFAULT 'WeBacklinks',
        \`logo\` VARCHAR(100) NOT NULL DEFAULT 'WeBacklinks',
        \`currency\` VARCHAR(20) NOT NULL DEFAULT 'PKR',
        \`deposit_instructions\` TEXT NOT NULL,
        \`contact_email\` VARCHAR(150) NOT NULL DEFAULT 'mail@webacklinks.com',
        \`smtp_email\` VARCHAR(150) DEFAULT '',
        \`smtp_host\` VARCHAR(150) DEFAULT '',
        \`smtp_port\` INT DEFAULT 587,
        \`smtp_user\` VARCHAR(150) DEFAULT '',
        \`smtp_pass\` VARCHAR(150) DEFAULT '',
        \`prices\` TEXT DEFAULT NULL,
        \`categories\` TEXT DEFAULT NULL,
        \`bank_accounts\` TEXT DEFAULT NULL,
        \`custom_tabs\` TEXT DEFAULT NULL,
        \`domain_list_file\` VARCHAR(255) DEFAULT NULL,
        \`domain_list_file_name\` VARCHAR(255) DEFAULT NULL,
        \`domain_list_url\` VARCHAR(255) DEFAULT NULL,
        \`mega_email\` VARCHAR(255) DEFAULT NULL,
        \`mega_password\` VARCHAR(255) DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`dashboard_rows\` (
        \`id\` VARCHAR(50) PRIMARY KEY,
        \`category\` VARCHAR(100) NOT NULL,
        \`da\` VARCHAR(20) NOT NULL,
        \`dr\` VARCHAR(20) NOT NULL,
        \`price\` VARCHAR(50) NOT NULL,
        \`status\` VARCHAR(50) DEFAULT NULL,
        \`total\` VARCHAR(50) DEFAULT NULL,
        \`tab\` VARCHAR(50) DEFAULT NULL,
        \`created_at\` VARCHAR(50) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Enforce up-to-date column constraints
    await ensureColumnExists(conn, "users", "approved_top_up_amount", "DECIMAL(15,2) DEFAULT 0.00 NOT NULL");
    await ensureColumnExists(conn, "users", "avatar", "MEDIUMTEXT DEFAULT NULL");
    await ensureColumnExists(conn, "users", "user_bank_name", "VARCHAR(100) DEFAULT NULL");
    await ensureColumnExists(conn, "users", "user_account_title", "VARCHAR(100) DEFAULT NULL");
    await ensureColumnExists(conn, "users", "user_account_number", "VARCHAR(100) DEFAULT NULL");

    await ensureColumnExists(conn, "orders", "attached_file", "VARCHAR(500) DEFAULT NULL");
    await ensureColumnExists(conn, "orders", "attached_file_name", "VARCHAR(255) DEFAULT NULL");

    await ensureColumnExists(conn, "settings", "custom_tabs", "TEXT DEFAULT NULL");
    await ensureColumnExists(conn, "settings", "domain_list_file", "VARCHAR(255) DEFAULT NULL");
    await ensureColumnExists(conn, "settings", "domain_list_file_name", "VARCHAR(255) DEFAULT NULL");
    await ensureColumnExists(conn, "settings", "domain_list_url", "VARCHAR(255) DEFAULT NULL");
    await ensureColumnExists(conn, "settings", "mega_email", "VARCHAR(255) DEFAULT NULL");
    await ensureColumnExists(conn, "settings", "mega_password", "VARCHAR(255) DEFAULT NULL");

    console.log("🚀 MySQL database schema is verified and up-to-date!");
  } catch (err) {
    console.error("❌ Failed to run MySQL migrations:", err);
    throw err;
  } finally {
    conn.release();
  }
}

async function loadDataFromMySql() {
  if (!pool) return;

  const conn = await pool.getConnection();
  try {
    console.log("⏳ Loading data from MySQL database into memory cache...");

    // 1. Users
    const [userRows]: any = await conn.query("SELECT * FROM users");
    const loadedUsers = userRows.map(mapDbToUser);

    const hasSuperAdmin = loadedUsers.some((u: any) => u.email.toLowerCase() === "najam786ali@yahoo.com");
    if (!hasSuperAdmin) {
      const salt = bcrypt.genSaltSync(10);
      const superAdminHashed = bcrypt.hashSync("Password7860@", salt);
      const superAdmin: User = {
        id: "usr_super_admin",
        name: "Super Admin",
        email: "najam786ali@yahoo.com",
        password: superAdminHashed,
        phone: "+923000000000",
        role: "admin",
        balance: 999999,
        approvedTopUpAmount: 0,
        status: "active",
        createdAt: new Date().toISOString(),
      };
      const dbUser = mapUserToDb(superAdmin);
      await conn.query("INSERT INTO users SET ?", [dbUser]);
      loadedUsers.push(superAdmin);
      console.log("🌱 Seeded Super Admin into MySQL database.");
    }

    // 2. Settings
    const [settingsRows]: any = await conn.query("SELECT * FROM settings LIMIT 1");
    let loadedSettings: AppSettings;
    if (settingsRows.length === 0) {
      loadedSettings = DEFAULT_SETTINGS;
      const dbSettings = mapSettingsToDb(DEFAULT_SETTINGS);
      await conn.query("INSERT INTO settings SET ?", [dbSettings]);
      console.log("🌱 Seeded Default Settings into MySQL database.");
    } else {
      loadedSettings = mapDbToSettings(settingsRows[0]);
    }

    if (loadedSettings.contactEmail !== "mail@webacklinks.com") {
      loadedSettings.contactEmail = "mail@webacklinks.com";
      await conn.query("UPDATE settings SET contact_email = ? WHERE id = 1", ["mail@webacklinks.com"]);
    }
    if (loadedSettings.smtpEmail !== "mail@webacklinks.com") {
      loadedSettings.smtpEmail = "mail@webacklinks.com";
      await conn.query("UPDATE settings SET smtp_email = ? WHERE id = 1", ["mail@webacklinks.com"]);
    }
    loadedSettings.websiteName = "WeBacklinks";
    loadedSettings.logo = "WeBacklinks";
    await conn.query("UPDATE settings SET website_name = ?, logo = ? WHERE id = 1", ["WeBacklinks", "WeBacklinks"]);

    // 3. Orders
    const [orderRows]: any = await conn.query("SELECT * FROM orders");
    const loadedOrders = orderRows.map(mapDbToOrder);

    // 4. Deposits
    const [depositRows]: any = await conn.query("SELECT * FROM deposit_requests");
    const loadedDeposits = depositRows.map(mapDbToDeposit);

    // 5. Notifications
    const [notifRows]: any = await conn.query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 500");
    const loadedNotifs = notifRows.map(mapDbToNotification);

    // 6. Dashboard Rows
    const [dashboardRows]: any = await conn.query("SELECT * FROM dashboard_rows");
    const loadedDashboardRows = dashboardRows.map(mapDbToDashboardRow);

    if (loadedDashboardRows.length === 0) {
      const defaultRows = [
        {
          id: "db_row_1",
          category: "Tech & Gadgets Blogs",
          da: "55",
          dr: "60",
          price: 1500,
          status: "Available",
          createdAt: new Date("2026-06-20T10:00:00Z").toISOString()
        },
        {
          id: "db_row_2",
          category: "Business & Finance News",
          da: "62",
          dr: "65",
          price: 2500,
          status: "Available",
          createdAt: new Date("2026-06-21T11:00:00Z").toISOString()
        },
        {
          id: "db_row_3",
          category: "Health & Wellness Sites",
          da: "48",
          dr: "50",
          price: 1200,
          status: "Available",
          createdAt: new Date("2026-06-22T12:00:00Z").toISOString()
        }
      ];
      for (const row of defaultRows) {
        await conn.query("INSERT INTO dashboard_rows SET ?", [mapDashboardRowToDb(row)]);
        loadedDashboardRows.push(row);
      }
      console.log("🌱 Seeded Default Dashboard Rows into MySQL database.");
    }

    dbData = {
      users: loadedUsers,
      orders: loadedOrders,
      deposits: loadedDeposits,
      notifications: loadedNotifs,
      settings: loadedSettings,
      dashboardRows: loadedDashboardRows,
    };

    console.log("✅ Loaded all MySQL data into memory cache successfully!");
  } catch (err) {
    console.error("❌ Failed to load data from MySQL:", err);
    throw err;
  } finally {
    conn.release();
  }
}

async function initMySql() {
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    console.log("ℹ️ MySQL environment variables are not fully configured. Using Local JSON database.");
    return;
  }

  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const conn = await pool.getConnection();
    console.log("✅ Successfully connected to MySQL database!");
    conn.release();
    isMySql = true;

    await runMigrations();
    await loadDataFromMySql();
  } catch (err: any) {
    console.error("⚠️ MySQL connection or initialization failed! Error:", err.message);
    console.log("ℹ️ Falling back to Local JSON database (data/db.json).");
    isMySql = false;
    pool = null;
  }
}

// Fire MySQL asynchronous initialization
initMySql();

export const db = {
  // --- USERS ---
  getUsers: (): User[] => dbData.users,
  getUserById: (id: string): User | undefined => dbData.users.find(u => u.id === id),
  getUserByEmail: (email: string): User | undefined => dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
  createUser: (user: User): void => {
    dbData.users.push(user);
    if (isMySql) {
      const dbUser = mapUserToDb(user);
      runAsyncQuery("INSERT INTO users SET ?", [dbUser]);
    } else {
      flush();
    }
  },
  updateUser: (id: string, updates: Partial<User>): User | null => {
    const idx = dbData.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    dbData.users[idx] = { ...dbData.users[idx], ...updates };

    if (isMySql) {
      const mappedUpdates: any = {};
      const userDbMapping: any = {
        name: "name",
        email: "email",
        password: "password",
        phone: "phone",
        role: "role",
        balance: "balance",
        approvedTopUpAmount: "approved_top_up_amount",
        status: "status",
        createdAt: "created_at",
        avatar: "avatar",
        userBankName: "user_bank_name",
        userAccountTitle: "user_account_title",
        userAccountNumber: "user_account_number"
      };

      Object.entries(updates).forEach(([key, val]) => {
        const dbCol = userDbMapping[key];
        if (dbCol !== undefined) {
          mappedUpdates[dbCol] = val;
        }
      });

      if (Object.keys(mappedUpdates).length > 0) {
        runAsyncQuery("UPDATE users SET ? WHERE id = ?", [mappedUpdates, id]);
      }
    } else {
      flush();
    }
    return dbData.users[idx];
  },
  deleteUser: (id: string): boolean => {
    const initialLen = dbData.users.length;
    dbData.users = dbData.users.filter(u => u.id !== id);
    if (isMySql) {
      runAsyncQuery("DELETE FROM users WHERE id = ?", [id]);
    } else {
      flush();
    }
    return dbData.users.length < initialLen;
  },

  // --- ORDERS ---
  getOrders: (): Order[] => dbData.orders,
  getOrderById: (id: string): Order | undefined => dbData.orders.find(o => o.id === id),
  getOrdersByUserId: (userId: string): Order[] => dbData.orders.filter(o => o.userId === userId),
  createOrder: (order: Order): void => {
    dbData.orders.push(order);
    if (isMySql) {
      const dbOrder = mapOrderToDb(order);
      runAsyncQuery("INSERT INTO orders SET ?", [dbOrder]);
    } else {
      flush();
    }
  },
  updateOrder: (id: string, updates: Partial<Order>): Order | null => {
    const idx = dbData.orders.findIndex(o => o.id === id);
    if (idx === -1) return null;
    dbData.orders[idx] = { ...dbData.orders[idx], ...updates };

    if (isMySql) {
      const mappedUpdates: any = {};
      const mapping: any = {
        userId: "user_id",
        userName: "user_name",
        userEmail: "user_email",
        category: "category",
        quantity: "quantity",
        totalCost: "total_cost",
        status: "status",
        createdAt: "created_at",
        pdfReport: "pdf_report",
        deliveryLink: "delivery_link",
        notes: "notes",
        completionDate: "completion_date",
        attachedFile: "attached_file",
        attachedFileName: "attached_file_name"
      };

      Object.entries(updates).forEach(([key, val]) => {
        const dbCol = mapping[key];
        if (dbCol !== undefined) {
          mappedUpdates[dbCol] = val;
        }
      });

      if (Object.keys(mappedUpdates).length > 0) {
        runAsyncQuery("UPDATE orders SET ? WHERE id = ?", [mappedUpdates, id]);
      }
    } else {
      flush();
    }
    return dbData.orders[idx];
  },
  deleteOrder: (id: string): boolean => {
    const initialLen = dbData.orders.length;
    dbData.orders = dbData.orders.filter(o => o.id !== id);
    if (isMySql) {
      runAsyncQuery("DELETE FROM orders WHERE id = ?", [id]);
    } else {
      flush();
    }
    return dbData.orders.length < initialLen;
  },

  // --- DEPOSITS ---
  getDeposits: (): DepositRequest[] => dbData.deposits,
  getDepositById: (id: string): DepositRequest | undefined => dbData.deposits.find(d => d.id === id),
  getDepositsByUserId: (userId: string): DepositRequest[] => dbData.deposits.filter(d => d.userId === userId),
  createDeposit: (deposit: DepositRequest): void => {
    dbData.deposits.push(deposit);
    if (isMySql) {
      const dbDep = mapDepositToDb(deposit);
      runAsyncQuery("INSERT INTO deposit_requests SET ?", [dbDep]);
    } else {
      flush();
    }
  },
  updateDeposit: (id: string, updates: Partial<DepositRequest>): DepositRequest | null => {
    const idx = dbData.deposits.findIndex(d => d.id === id);
    if (idx === -1) return null;
    dbData.deposits[idx] = { ...dbData.deposits[idx], ...updates };

    if (isMySql) {
      const mappedUpdates: any = {};
      const mapping: any = {
        userId: "user_id",
        userName: "user_name",
        userEmail: "user_email",
        amount: "amount",
        paymentMethod: "payment_method",
        transactionId: "transaction_id",
        screenshot: "screenshot",
        status: "status",
        createdAt: "created_at",
        reviewedAt: "reviewed_at"
      };

      Object.entries(updates).forEach(([key, val]) => {
        const dbCol = mapping[key];
        if (dbCol !== undefined) {
          mappedUpdates[dbCol] = val;
        }
      });

      if (Object.keys(mappedUpdates).length > 0) {
        runAsyncQuery("UPDATE deposit_requests SET ? WHERE id = ?", [mappedUpdates, id]);
      }
    } else {
      flush();
    }
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
    dbData.notifications.unshift(notif);
    if (dbData.notifications.length > 500) {
      dbData.notifications = dbData.notifications.slice(0, 500);
    }

    if (isMySql) {
      const dbNotif = mapNotificationToDb(notif);
      runAsyncQuery("INSERT INTO notifications SET ?", [dbNotif]);
    } else {
      flush();
    }
  },
  markNotificationsAsRead: (userId: string): void => {
    const userObj = dbData.users.find(u => u.id === userId);
    const isAdmin = userObj?.role === "admin";

    dbData.notifications.forEach(n => {
      if (n.userId === userId || n.role === "all" || (isAdmin && n.role === "admin")) {
        n.read = true;
      }
    });

    if (isMySql) {
      if (isAdmin) {
        runAsyncQuery("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR role = 'all' OR role = 'admin'", [userId]);
      } else {
        runAsyncQuery("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR role = 'all'", [userId]);
      }
    } else {
      flush();
    }
  },
  clearNotifications: (userId: string): void => {
    const userObj = dbData.users.find(u => u.id === userId);
    const isAdmin = userObj?.role === "admin";

    dbData.notifications = dbData.notifications.filter(n => {
      const belongsToUser = n.userId === userId || n.role === "all" || (n.role === "user" && userId !== "usr_admin") || (isAdmin && n.role === "admin");
      return !belongsToUser;
    });

    if (isMySql) {
      if (isAdmin) {
        runAsyncQuery("DELETE FROM notifications WHERE role = 'admin'", []);
      } else {
        runAsyncQuery("DELETE FROM notifications WHERE user_id = ? OR role = 'all' OR (role = 'user' AND ? != 'usr_admin')", [userId, userId]);
      }
    } else {
      flush();
    }
  },

  // --- SETTINGS ---
  getSettings: (): AppSettings => dbData.settings,
  updateSettings: (updates: Partial<AppSettings>): AppSettings => {
    dbData.settings = { ...dbData.settings, ...updates };

    if (isMySql) {
      const mappedUpdates: any = {};
      const mapping: any = {
        websiteName: "website_name",
        logo: "logo",
        currency: "currency",
        depositInstructions: "deposit_instructions",
        contactEmail: "contact_email",
        smtpEmail: "smtp_email",
        smtpHost: "smtp_host",
        smtpPort: "smtp_port",
        smtpUser: "smtp_user",
        smtpPass: "smtp_pass",
        prices: "prices",
        categories: "categories",
        bankAccounts: "bank_accounts",
        customTabs: "custom_tabs",
        domainListFile: "domain_list_file",
        domainListFileName: "domain_list_file_name",
        domainListUrl: "domain_list_url",
        megaEmail: "mega_email",
        megaPassword: "mega_password"
      };

      Object.entries(updates).forEach(([key, val]) => {
        const dbCol = mapping[key];
        if (dbCol !== undefined) {
          if (["prices", "categories", "bankAccounts", "customTabs"].includes(key)) {
            mappedUpdates[dbCol] = JSON.stringify(val);
          } else {
            mappedUpdates[dbCol] = val;
          }
        }
      });

      if (Object.keys(mappedUpdates).length > 0) {
        runAsyncQuery("UPDATE settings SET ? WHERE id = 1", [mappedUpdates]);
      }
    } else {
      flush();
    }
    return dbData.settings;
  },

  // --- DASHBOARD ROWS ---
  getDashboardRows: (): DashboardRow[] => {
    if (!dbData.dashboardRows) {
      dbData.dashboardRows = [];
    }
    return dbData.dashboardRows;
  },
  createDashboardRow: (row: DashboardRow): void => {
    if (!dbData.dashboardRows) {
      dbData.dashboardRows = [];
    }
    dbData.dashboardRows.push(row);

    if (isMySql) {
      const dbRow = mapDashboardRowToDb(row);
      runAsyncQuery("INSERT INTO dashboard_rows SET ?", [dbRow]);
    } else {
      flush();
    }
  },
  updateDashboardRow: (id: string, updates: Partial<DashboardRow>): DashboardRow | null => {
    if (!dbData.dashboardRows) {
      dbData.dashboardRows = [];
    }
    const idx = dbData.dashboardRows.findIndex(r => r.id === id);
    if (idx === -1) return null;
    dbData.dashboardRows[idx] = { ...dbData.dashboardRows[idx], ...updates };

    if (isMySql) {
      const mappedUpdates: any = {};
      const mapping: any = {
        category: "category",
        da: "da",
        dr: "dr",
        price: "price",
        status: "status",
        total: "total",
        tab: "tab",
        createdAt: "created_at"
      };

      Object.entries(updates).forEach(([key, val]) => {
        const dbCol = mapping[key];
        if (dbCol !== undefined) {
          mappedUpdates[dbCol] = String(val);
        }
      });

      if (Object.keys(mappedUpdates).length > 0) {
        runAsyncQuery("UPDATE dashboard_rows SET ? WHERE id = ?", [mappedUpdates, id]);
      }
    } else {
      flush();
    }
    return dbData.dashboardRows[idx];
  },
  deleteDashboardRow: (id: string): boolean => {
    if (!dbData.dashboardRows) {
      dbData.dashboardRows = [];
      return false;
    }
    const initialLen = dbData.dashboardRows.length;
    dbData.dashboardRows = dbData.dashboardRows.filter(r => r.id !== id);

    if (isMySql) {
      runAsyncQuery("DELETE FROM dashboard_rows WHERE id = ?", [id]);
    } else {
      flush();
    }
    return dbData.dashboardRows.length < initialLen;
  }
};

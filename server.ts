/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import bcrypt from "bcryptjs";
import { db } from "./src/server/db.js";
import { uploadToMega, downloadFromMega } from "./src/server/mega.js";
import { sendNotificationEmail, sendAdminVerificationEmail } from "./src/server/email.js";
import {
  createSession,
  destroySession,
  requireAuth,
  requireAdmin,
  AuthRequest,
} from "./src/server/auth.js";
import { User, Order, DepositRequest, Notification, AppSettings } from "./src/types.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Enable JSON body and URL encoded data parsing with large limits
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure upload directories exist inside local data folder for extreme security
const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");
const REPORTS_DIR = path.join(UPLOADS_DIR, "reports");
const SCREENSHOTS_DIR = path.join(UPLOADS_DIR, "screenshots");
const ATTACHMENTS_DIR = path.join(UPLOADS_DIR, "attachments");

fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });

// Setup Multer storage engines for PDFs and screenshot attachments
const reportsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, REPORTS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `report-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const screenshotsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, SCREENSHOTS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `screenshot-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const attachmentsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ATTACHMENTS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `order-file-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadReport = multer({
  storage: reportsStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [".pdf", ".csv", ".xlsx", ".xls"];
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, CSV, and Excel (XLSX/XLS) files are allowed."));
    }
  },
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

const uploadScreenshot = multer({
  storage: screenshotsStorage,
  fileFilter: (req, file, cb) => {
    // Allow images only
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed."));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const uploadAttachment = multer({
  storage: attachmentsStorage,
  fileFilter: (req, file, cb) => {
    // Allow all file formats for order campaign attachments as requested by user
    cb(null, true);
  },
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// ==========================================
// 🖼️ LOGO & SITE ICON PROXY ROUTES (Bypasses Hotlinking Protection)
// ==========================================

app.get("/api/logo.png", async (req, res) => {
  try {
    const response = await fetch("https://webacklinks.com/wp-content/uploads/2022/11/webackliks-official-logo--e1768684524993.png", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Referer": "https://webacklinks.com/"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch logo: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day cache
    res.send(buffer);
  } catch (error) {
    console.error("Error proxying logo, using redirect:", error);
    res.redirect("https://webacklinks.com/wp-content/uploads/2022/11/webackliks-official-logo--e1768684524993.png");
  }
});

app.get("/api/site-icon.png", async (req, res) => {
  try {
    const response = await fetch("https://webacklinks.com/wp-content/uploads/2023/02/site-icon-of-webacklinks.png", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Referer": "https://webacklinks.com/"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch site icon: ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day cache
    res.send(buffer);
  } catch (error) {
    console.error("Error proxying site icon, using redirect:", error);
    res.redirect("https://webacklinks.com/wp-content/uploads/2023/02/site-icon-of-webacklinks.png");
  }
});

// ==========================================
// 🔐 AUTH ROUTES
// ==========================================

app.post("/api/auth/register", (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const existingUser = db.getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: "Email address is already registered." });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const newUser: User = {
    id: "usr_" + Math.random().toString(36).substring(2, 11),
    name,
    email,
    password: hashedPassword,
    phone,
    role: "user",
    balance: 0,
    approvedTopUpAmount: 0,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  db.createUser(newUser);

  // Send signup notification to admin
  db.createNotification({
    id: "notif_" + Math.random().toString(36).substring(2, 11),
    userId: null,
    role: "admin",
    title: "New User Registered",
    message: `${name} (${email}) has registered an account.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  const token = createSession(newUser.id, newUser.role);
  
  // Strip password before returning
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({ user: userWithoutPassword, token });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password, securityKey } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // Enforce security key check for super admin
  if (email.toLowerCase() === "najam786ali@yahoo.com") {
    if (!securityKey || securityKey !== "Najam2712ali__!!??@@") {
      return res.status(401).json({ error: "Access Denied. Incorrect or missing Security Key." });
    }
  }

  const user = db.getUserByEmail(email);
  if (!user || !user.password) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  if (user.status === "inactive") {
    return res.status(403).json({ error: "Your account has been disabled. Please contact Administrator." });
  }

  const matches = bcrypt.compareSync(password, user.password);
  if (!matches) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = createSession(user.id, user.role);

  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword, token });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: "Email and new password are required." });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: "This email address is not registered." });
  }

  if (newPassword.trim().length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters in length." });
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(newPassword, salt);

  const updatedUser = db.updateUser(user.id, { password: hashedPassword });
  if (!updatedUser) {
    return res.status(500).json({ error: "Failed to reset password." });
  }

  res.json({ success: true, message: "Password has been reset successfully." });
});

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    destroySession(token);
  }
  res.json({ success: true, message: "Logged out successfully." });
});

app.get("/api/auth/me", requireAuth, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

app.put("/api/users/profile", requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  const { name, phone, avatar, password, userBankName, userAccountTitle, userAccountNumber } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone number are required." });
  }

  const updates: Partial<User> = {
    name,
    phone,
    avatar: avatar || user.avatar || null,
    userBankName: userBankName !== undefined ? userBankName : user.userBankName || "",
    userAccountTitle: userAccountTitle !== undefined ? userAccountTitle : user.userAccountTitle || "",
    userAccountNumber: userAccountNumber !== undefined ? userAccountNumber : user.userAccountNumber || "",
  };

  if (password && password.trim().length >= 6) {
    const salt = bcrypt.genSaltSync(10);
    updates.password = bcrypt.hashSync(password, salt);
  }

  const updatedUser = db.updateUser(user.id, updates);
  if (!updatedUser) {
    return res.status(500).json({ error: "Failed to update profile." });
  }

  const { password: _, ...userWithoutPassword } = updatedUser;
  res.json({ success: true, user: userWithoutPassword });
});

// ==========================================
// 💳 DEPOSIT ROUTES
// ==========================================

app.post("/api/users/instant-topup", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;
    const user = req.user!;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required." });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Please enter a valid positive amount." });
    }

    const approvedLimit = user.approvedTopUpAmount || 0;
    if (numericAmount > approvedLimit) {
      return res.status(400).json({ 
        error: `apne amount galat dali hai. Approved top up amount is ${db.getSettings().currency} ${approvedLimit.toLocaleString()}.` 
      });
    }

    // Direct addition of balance
    const newBalance = user.balance + numericAmount;
    const newApprovedLimit = approvedLimit - numericAmount;

    // Update user in DB
    const updatedUser = db.updateUser(user.id, { 
      balance: newBalance,
      approvedTopUpAmount: newApprovedLimit
    });

    const currency = db.getSettings().currency;

    // Log approved deposit
    const newDeposit = {
      id: "dep_" + Math.random().toString(36).substring(2, 11),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount: numericAmount,
      paymentMethod: "Direct Topup",
      transactionId: "TXN_TOPUP_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      screenshot: null,
      status: "approved" as const,
      createdAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString()
    };
    db.createDeposit(newDeposit);

    // Create Notification
    db.createNotification({
      id: "notif_" + Math.random().toString(36).substring(2, 11),
      userId: user.id,
      role: "user",
      title: "Wallet Topped Up 🎉",
      message: `You successfully topped up ${currency} ${numericAmount.toLocaleString()}! Current Balance: ${currency} ${newBalance.toLocaleString()}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      balance: newBalance,
      approvedTopUpAmount: newApprovedLimit,
      user: updatedUser
    });
  } catch (error: any) {
    console.error("Error topping up:", error);
    res.status(500).json({ error: "Failed to top up wallet." });
  }
});

app.post("/api/deposits", requireAuth, (req, res, next) => {
  uploadScreenshot.single("screenshot")(req, res, (err) => {
    if (err) {
      console.error("❌ Multer screenshot upload error:", err);
      return res.status(400).json({ error: err.message || "Failed to upload screenshot. Ensure the file is an image under 5MB." });
    }
    next();
  });
}, async (req: AuthRequest, res) => {
  try {
    const { amount, paymentMethod, transactionId } = req.body;
    const user = req.user!;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ error: "Deposit amount and payment method are required." });
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({ error: "Invalid deposit amount." });
    }

    const screenshotPath = req.file ? `/api/deposits/screenshot/${req.file.filename}` : null;

    if (req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        await uploadToMega(req.file.filename, fileBuffer);
      } catch (err) {
        console.error("⚠️ Background MEGA upload failed for screenshot:", err);
      }
    }

    const newDeposit: DepositRequest = {
      id: "dep_" + Math.random().toString(36).substring(2, 11),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      amount: depositAmount,
      paymentMethod,
      transactionId: transactionId || "N/A",
      screenshot: screenshotPath,
      status: "pending",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    };

    db.createDeposit(newDeposit);

    // Trigger Admin notifications
    db.createNotification({
      id: "notif_" + Math.random().toString(36).substring(2, 11),
      userId: null,
      role: "admin",
      title: "New Deposit Request",
      message: `${user.name} submitted a deposit request of ${db.getSettings().currency} ${depositAmount.toLocaleString()}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    // SMTP Email to Admin
    await sendNotificationEmail({
      subject: `Deposit Request Received - ${user.name}`,
      bodyTitle: "New Wallet Deposit Request",
      details: {
        "User Name": user.name,
        "User Email": user.email,
        "Deposit Amount": `${db.getSettings().currency} ${depositAmount.toLocaleString()}`,
        "Payment Method": paymentMethod,
        "Transaction ID": transactionId || "N/A",
        "Request Date": new Date().toLocaleString(),
      },
    });

    res.status(201).json(newDeposit);
  } catch (error: any) {
    console.error("❌ Error processing deposit:", error);
    res.status(500).json({ error: error.message || "Failed to process deposit." });
  }
});

app.get("/api/deposits", requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role === "admin") {
    const deposits = db.getDeposits();
    // Enrich with user's current bank details so it is always up to date
    const enriched = deposits.map(d => {
      const u = db.getUserById(d.userId);
      return {
        ...d,
        userBankName: u?.userBankName || "",
        userAccountTitle: u?.userAccountTitle || "",
        userAccountNumber: u?.userAccountNumber || ""
      };
    });
    res.json(enriched);
  } else {
    res.json(db.getDepositsByUserId(user.id));
  }
});

app.post("/api/deposits/:id/review", requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, amount } = req.body; // status: "approved" | "rejected", amount is optional edited amount

  if (status !== "approved" && status !== "rejected") {
    return res.status(400).json({ error: "Status must be 'approved' or 'rejected'." });
  }

  const deposit = db.getDepositById(id);
  if (!deposit) {
    return res.status(404).json({ error: "Deposit request not found." });
  }

  if (deposit.status !== "pending") {
    return res.status(400).json({ error: "Deposit has already been processed." });
  }

  const targetUser = db.getUserById(deposit.userId);
  if (!targetUser) {
    return res.status(404).json({ error: "User associated with this deposit was not found." });
  }

  let finalAmount = deposit.amount;
  if (status === "approved" && amount !== undefined) {
    const parsedAmount = parseFloat(amount);
    if (!isNaN(parsedAmount) && parsedAmount > 0) {
      finalAmount = parsedAmount;
      db.updateDeposit(id, { amount: finalAmount });
    }
  }

  // Update status
  const updatedDeposit = db.updateDeposit(id, {
    status,
    reviewedAt: new Date().toISOString(),
  });

  const currency = db.getSettings().currency;

  if (status === "approved") {
    // Direct addition of balance as requested: "amount balance main show ho jani chaiye"
    const newBalance = (targetUser.balance || 0) + finalAmount;
    db.updateUser(targetUser.id, { balance: newBalance });

    // Notify User
    db.createNotification({
      id: "notif_" + Math.random().toString(36).substring(2, 11),
      userId: targetUser.id,
      role: "user",
      title: "Deposit Request Approved 🎉",
      message: `Your deposit of ${currency} ${finalAmount.toLocaleString()} has been approved and added directly to your wallet balance! Current Balance: ${currency} ${newBalance.toLocaleString()}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else {
    // Notify User about rejection
    db.createNotification({
      id: "notif_" + Math.random().toString(36).substring(2, 11),
      userId: targetUser.id,
      role: "user",
      title: "Deposit Request Rejected",
      message: `Your deposit of ${currency} ${finalAmount.toLocaleString()} (Txn ID: ${deposit.transactionId}) was rejected. Please contact support.`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  res.json({ success: true, deposit: updatedDeposit });
});

// Securely serve deposit screenshots to authenticated users
app.get("/api/deposits/screenshot/:filename", requireAuth, async (req: AuthRequest, res) => {
  const { filename } = req.params;
  const filePath = path.join(SCREENSHOTS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    try {
      const megaBuffer = await downloadFromMega(filename);
      if (megaBuffer) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, megaBuffer);
      }
    } catch (err) {
      console.error("⚠️ Failed to restore screenshot from MEGA:", err);
    }
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Screenshot not found." });
  }

  // Basic security constraint: Regular users can only see their own screenshots
  const user = req.user!;
  if (user.role !== "admin") {
    // Find if the user has any deposit associated with this screenshot
    const userDeposits = db.getDepositsByUserId(user.id);
    const ownsScreenshot = userDeposits.some(d => d.screenshot === `/api/deposits/screenshot/${filename}`);
    if (!ownsScreenshot) {
      return res.status(403).json({ error: "Forbidden. Access denied." });
    }
  }

  res.sendFile(filePath);
});

// ==========================================
// 📦 ORDER ROUTES
// ==========================================

app.post("/api/orders", requireAuth, (req, res, next) => {
  uploadAttachment.single("file")(req, res, (err) => {
    if (err) {
      console.error("❌ Multer order attachment upload error:", err);
      return res.status(400).json({ error: err.message || "Failed to upload order file attachment. Ensure it is under 25MB." });
    }
    next();
  });
}, async (req: AuthRequest, res) => {
  try {
    const { category, quantity, notes } = req.body;
    const user = req.user!;

    if (!category || !quantity) {
      return res.status(400).json({ error: "Category and Quantity are required." });
    }

    const orderQuantity = parseInt(quantity);
    if (isNaN(orderQuantity) || orderQuantity <= 0) {
      return res.status(400).json({ error: "Invalid order quantity." });
    }

    // Calculate pricing & limits dynamically
    const settings = db.getSettings();
    const catItem = (settings.categories || []).find(c => c.name === category);

    const priceEach = catItem ? catItem.price : (settings.prices[category] || 10);
    const minLimit = catItem ? catItem.minLimit : 50;
    const maxLimit = catItem ? catItem.maxLimit : 50000;

    if (orderQuantity < minLimit) {
      return res.status(400).json({
        error: `Minimum order quantity for ${category} is ${minLimit}.`,
      });
    }

    if (orderQuantity > maxLimit) {
      return res.status(400).json({
        error: `Maximum order quantity for ${category} is ${maxLimit}.`,
      });
    }

    const totalCost = orderQuantity * priceEach;

    // Wallet check
    if (user.balance < totalCost) {
      return res.status(400).json({
        error: "Insufficient Credit. Please Deposit First.",
      });
    }

    // Deduct credit
    const newBalance = user.balance - totalCost;
    db.updateUser(user.id, { balance: newBalance });

    const orderId = "ord_" + Math.random().toString(36).substring(2, 11);

    // Create order
    const newOrder: Order = {
      id: orderId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      category,
      quantity: orderQuantity,
      totalCost,
      status: "pending",
      createdAt: new Date().toISOString(),
      pdfReport: null,
      deliveryLink: null,
      notes: notes || null,
      completionDate: null,
      attachedFile: req.file ? `/api/orders/${orderId}/download-attachment?file=${req.file.filename}` : null,
      attachedFileName: req.file ? req.file.originalname : null,
    };

    if (req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        await uploadToMega(req.file.filename, fileBuffer);
      } catch (err) {
        console.error("⚠️ Background MEGA upload failed for order attachment:", err);
      }
    }

    db.createOrder(newOrder);

    // Send System Notification to Admin
    db.createNotification({
      id: "notif_" + Math.random().toString(36).substring(2, 11),
      userId: null,
      role: "admin",
      title: "New Order Submitted",
      message: `${user.name} ordered ${orderQuantity} × ${category} backlinks. Total: ${settings.currency} ${totalCost.toLocaleString()}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    // Send SMTP notification to Admin
    await sendNotificationEmail({
      subject: `New Order Submitted - ${category}`,
      bodyTitle: "New SEO Backlink Order Received",
      details: {
        "User Name": user.name,
        "User Email": user.email,
        "Order Type": category,
        Quantity: orderQuantity,
        "Total Amount": `${settings.currency} ${totalCost.toLocaleString()}`,
        Date: new Date().toLocaleString(),
      },
    });

    res.status(201).json({
      order: newOrder,
      balance: newBalance,
    });
  } catch (error: any) {
    console.error("❌ Error processing order:", error);
    res.status(500).json({ error: error.message || "Failed to process backlink order." });
  }
});

app.get("/api/orders", requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role === "admin") {
    res.json(db.getOrders());
  } else {
    res.json(db.getOrdersByUserId(user.id));
  }
});

// Update order status/notes or complete order
app.post(
  "/api/orders/:id/complete",
  requireAdmin,
  (req, res, next) => {
    uploadReport.single("report")(req, res, (err) => {
      if (err) {
        console.error("❌ Multer report upload error:", err);
        return res.status(400).json({ error: err.message || "Failed to upload report file. Ensure it is a valid PDF/CSV/Excel under 15MB." });
      }
      next();
    });
  },
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { deliveryLink, notes } = req.body;

      const order = db.getOrderById(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found." });
      }

      if (!req.file && !deliveryLink) {
        return res.status(400).json({ error: "Please upload a report file (PDF, Excel, CSV) or provide a delivery link." });
      }

      const reportPath = req.file ? `/api/orders/${order.id}/download-pdf?file=${req.file.filename}` : order.pdfReport;

      if (req.file) {
        try {
          const fileBuffer = fs.readFileSync(req.file.path);
          await uploadToMega(req.file.filename, fileBuffer);
        } catch (err) {
          console.error("⚠️ Background MEGA upload failed for completed report:", err);
        }
      }

      const updatedOrder = db.updateOrder(id, {
        status: "completed",
        pdfReport: reportPath,
        deliveryLink: deliveryLink || null,
        notes: notes || null,
        completionDate: new Date().toISOString(),
      });

      // Notify User
      db.createNotification({
        id: "notif_" + Math.random().toString(36).substring(2, 11),
        userId: order.userId,
        role: "user",
        title: "Order Completed 🎉",
        message: `Your backlink order (ID: ${order.id}) for ${order.quantity} × ${order.category} has been completed! Click to download your report.`,
        read: false,
        createdAt: new Date().toISOString(),
      });

      res.json({ success: true, order: updatedOrder });
    } catch (error: any) {
      console.error("❌ Error completing order:", error);
      res.status(500).json({ error: error.message || "Failed to complete order." });
    }
  }
);

// Admin can change order status directly (pending, in_progress, completed, cancelled)
app.put("/api/orders/:id/status", requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = db.getOrderById(id);
  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  const validStatuses = ["pending", "in_progress", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  if (status === "completed" && !order.pdfReport && !order.deliveryLink) {
    return res.status(400).json({ error: "Order cannot be marked as Completed without adding a Delivery Report File or a Sheet Link first." });
  }

  // Handle cancelled wallet refund
  if (status === "cancelled" && order.status !== "cancelled") {
    const orderUser = db.getUserById(order.userId);
    if (orderUser) {
      const newBalance = orderUser.balance + order.totalCost;
      db.updateUser(orderUser.id, { balance: newBalance });
      db.createNotification({
        id: "notif_" + Math.random().toString(36).substring(2, 11),
        userId: orderUser.id,
        role: "user",
        title: "Order Cancelled & Refunded",
        message: `Your order (ID: ${order.id}) was cancelled by administrator. ${db.getSettings().currency} ${order.totalCost.toLocaleString()} was refunded to your wallet.`,
        read: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  const updatedOrder = db.updateOrder(id, { status });
  res.json({ success: true, order: updatedOrder });
});

// Admin can delete an order permanently
app.delete("/api/orders/:id", requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const success = db.deleteOrder(id);
  if (!success) {
    return res.status(404).json({ error: "Order not found." });
  }
  res.json({ success: true, message: "Order deleted successfully." });
});

// Secure PDF download route - strictly checks user ownership or admin status
app.get("/api/orders/:id/download-pdf", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const order = db.getOrderById(id);

  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  const user = req.user!;
  if (user.role !== "admin" && order.userId !== user.id) {
    return res.status(403).json({ error: "Access denied. This report belongs to another client." });
  }

  if (!order.pdfReport) {
    return res.status(404).json({ error: "PDF report is not uploaded for this order." });
  }

  // Resolve file from local storage
  let filename = req.query.file as string;
  if (!filename && order.pdfReport) {
    if (order.pdfReport.includes("?file=")) {
      filename = order.pdfReport.split("?file=")[1];
    } else {
      const lastPart = order.pdfReport.split("/").pop();
      if (lastPart && lastPart.startsWith("report-")) {
        filename = lastPart;
      } else {
        const files = fs.readdirSync(REPORTS_DIR);
        if (files.length > 0) {
          filename = files[0];
        } else {
          filename = lastPart || "";
        }
      }
    }
  }

  if (!filename) {
    return res.status(404).json({ error: "Report file metadata invalid." });
  }

  // Find file in REPORTS_DIR
  const filePath = path.join(REPORTS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    try {
      const megaBuffer = await downloadFromMega(filename);
      if (megaBuffer) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, megaBuffer);
      }
    } catch (err) {
      console.error("⚠️ Failed to restore report from MEGA:", err);
    }
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Report file not found on disk." });
  }

  const ext = path.extname(filename).toLowerCase();
  let contentType = "application/pdf";
  let downloadExt = ".pdf";

  if (ext === ".csv") {
    contentType = "text/csv";
    downloadExt = ".csv";
  } else if (ext === ".xlsx") {
    contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    downloadExt = ".xlsx";
  } else if (ext === ".xls") {
    contentType = "application/vnd.ms-excel";
    downloadExt = ".xls";
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename="SEO_Report_${order.category.replace(/\s+/g, "_")}_${order.id}${downloadExt}"`);
  res.sendFile(filePath);
});

// Secure attachment download route for campaign order files
app.get("/api/orders/:id/download-attachment", requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const order = db.getOrderById(id);

  if (!order) {
    return res.status(404).json({ error: "Order not found." });
  }

  const user = req.user!;
  if (user.role !== "admin" && order.userId !== user.id) {
    return res.status(403).json({ error: "Access denied. This file belongs to another client." });
  }

  if (!order.attachedFile) {
    return res.status(404).json({ error: "No attachment file uploaded for this order." });
  }

  let filename = req.query.file as string;
  if (!filename && order.attachedFile) {
    if (order.attachedFile.includes("?file=")) {
      filename = order.attachedFile.split("?file=")[1];
    } else {
      filename = order.attachedFile.split("/").pop() || "";
    }
  }

  if (!filename) {
    return res.status(400).json({ error: "Attachment file query parameter missing." });
  }

  const filePath = path.join(ATTACHMENTS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    try {
      const megaBuffer = await downloadFromMega(filename);
      if (megaBuffer) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, megaBuffer);
      }
    } catch (err) {
      console.error("⚠️ Failed to restore attachment from MEGA:", err);
    }
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Attachment file not found on disk." });
  }

  const origName = order.attachedFileName || "order_attachment.txt";
  res.download(filePath, origName);
});

// ==========================================
// 👤 ADMIN - USER MANAGEMENT ROUTES
// ==========================================

app.get("/api/admin/users", requireAdmin, (req, res) => {
  res.json(db.getUsers());
});

app.put("/api/admin/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, phone, status, role, approvedTopUpAmount } = req.body;

  const targetUser = db.getUserById(id);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found." });
  }

  const updates: Partial<User> = { name, phone, status, role };
  if (approvedTopUpAmount !== undefined) {
    updates.approvedTopUpAmount = Number(approvedTopUpAmount) || 0;
  }

  const updatedUser = db.updateUser(id, updates);
  res.json({ success: true, user: updatedUser });
});

const deleteVerificationCodes = new Map<string, { code: string; expiresAt: number }>();

app.post("/api/admin/send-delete-code", requireAdmin, async (req: AuthRequest, res) => {
  const admin = req.user!;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  deleteVerificationCodes.set(admin.id, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  console.log(`[SECURITY] USER DELETION CODE GENERATED FOR ADMIN ${admin.email}: ${code}`);

  try {
    await sendAdminVerificationEmail(admin.email, code);
    res.json({ success: true, message: `Verification code sent to your email: ${admin.email}` });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to send email verification code." });
  }
});

app.delete("/api/admin/users/:id", requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { code } = req.query;
  const admin = req.user!;

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Verification code is required to complete deletion." });
  }

  const savedCodeObj = deleteVerificationCodes.get(admin.id);
  if (!savedCodeObj || savedCodeObj.expiresAt < Date.now()) {
    return res.status(400).json({ error: "Verification code has expired or was not requested. Please request a new code." });
  }

  if (savedCodeObj.code !== code) {
    return res.status(400).json({ error: "Incorrect verification code. Please try again." });
  }

  deleteVerificationCodes.delete(admin.id);

  if (id === "usr_admin") {
    return res.status(400).json({ error: "You cannot delete the primary admin account." });
  }

  const userToDelete = db.getUserById(id);
  if (userToDelete && userToDelete.role === "admin") {
    return res.status(400).json({ error: "Administrator accounts cannot be deleted." });
  }

  const success = db.deleteUser(id);
  if (!success) {
    return res.status(404).json({ error: "User not found." });
  }

  res.json({ success: true, message: "User account deleted successfully." });
});

app.post("/api/admin/users/:id/credit", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { amount, action } = req.body; // action: "add" | "remove"

  const targetUser = db.getUserById(id);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found." });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: "Invalid credit amount." });
  }

  let newBalance = targetUser.balance;
  const currency = db.getSettings().currency;

  if (action === "add") {
    newBalance += numericAmount;
    db.updateUser(id, { balance: newBalance });

    // Notify user
    db.createNotification({
      id: "notif_" + Math.random().toString(36).substring(2, 11),
      userId: id,
      role: "user",
      title: "Credits Added 💳",
      message: `Admin added ${currency} ${numericAmount.toLocaleString()} to your wallet. New Balance: ${currency} ${newBalance.toLocaleString()}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else if (action === "remove") {
    if (newBalance < numericAmount) {
      return res.status(400).json({ error: "User has insufficient balance to remove this amount." });
    }
    newBalance -= numericAmount;
    db.updateUser(id, { balance: newBalance });

    // Notify user
    db.createNotification({
      id: "notif_" + Math.random().toString(36).substring(2, 11),
      userId: id,
      role: "user",
      title: "Credits Removed",
      message: `Admin deducted ${currency} ${numericAmount.toLocaleString()} from your wallet. New Balance: ${currency} ${newBalance.toLocaleString()}`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } else {
    return res.status(400).json({ error: "Action must be 'add' or 'remove'." });
  }

  res.json({ success: true, user: db.getUserById(id) });
});

// ==========================================
// ⚙️ SETTINGS ROUTES
// ==========================================

// Public website settings (excluding secrets)
app.get("/api/settings", (req, res) => {
  const settings = db.getSettings();
  const { smtpPass: _, ...publicSettings } = settings;
  res.json(publicSettings);
});

// Admin-only complete settings
app.get("/api/admin/settings", requireAdmin, (req, res) => {
  res.json(db.getSettings());
});

app.put("/api/admin/settings", requireAdmin, (req, res) => {
  const settingsData = req.body;
  const updatedSettings = db.updateSettings(settingsData);
  res.json({ success: true, settings: updatedSettings });
});

// ==========================================
// 📊 DASHBOARD ROWS ROUTES
// ==========================================

// Get all dashboard rows for user side table
app.get("/api/dashboard-rows", requireAuth, (req: AuthRequest, res) => {
  res.json(db.getDashboardRows());
});

// Create a new dashboard row (Admin only)
app.post("/api/admin/dashboard-rows", requireAdmin, (req, res) => {
  const { category, da, dr, price, status, total, tab } = req.body;
  if (!category || da === undefined || price === undefined) {
    return res.status(400).json({ error: "Category, DA, and Price are required." });
  }

  const newRow = {
    id: "db_row_" + Math.random().toString(36).substring(2, 11),
    category,
    da: String(da),
    dr: dr !== undefined && dr !== null ? String(dr) : "",
    price: price === "" ? "" : (isNaN(Number(price)) ? String(price) : Number(price)),
    status: status ? String(status).trim() : "",
    total: total ? String(total).trim() : "",
    tab: tab ? String(tab).trim() : "",
    createdAt: new Date().toISOString()
  };

  db.createDashboardRow(newRow);
  res.status(201).json({ success: true, row: newRow });
});

// Update an existing dashboard row (Admin only)
app.put("/api/admin/dashboard-rows/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { category, da, dr, price, status, total, tab } = req.body;

  const updates: any = {};
  if (category !== undefined) updates.category = category;
  if (da !== undefined) updates.da = String(da);
  if (dr !== undefined) updates.dr = dr !== null && dr !== undefined ? String(dr) : "";
  if (price !== undefined) updates.price = price === "" ? "" : (isNaN(Number(price)) ? String(price) : Number(price));
  if (status !== undefined) updates.status = String(status).trim();
  if (total !== undefined) updates.total = String(total).trim();
  if (tab !== undefined) updates.tab = String(tab).trim();

  const updated = db.updateDashboardRow(id, updates);
  if (!updated) {
    return res.status(404).json({ error: "Dashboard row not found." });
  }

  res.json({ success: true, row: updated });
});

// Delete a dashboard row (Admin only)
app.delete("/api/admin/dashboard-rows/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteDashboardRow(id);
  if (!deleted) {
    return res.status(404).json({ error: "Dashboard row not found." });
  }
  res.json({ success: true });
});

// ==========================================
// 🔔 NOTIFICATION ROUTES
// ==========================================

app.get("/api/notifications", requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  if (user.role === "admin") {
    // Admins see admin specific or all notifications
    res.json(db.getAdminNotifications());
  } else {
    res.json(db.getNotificationsByUserId(user.id));
  }
});

app.post("/api/notifications/read", requireAuth, (req: AuthRequest, res) => {
  const user = req.user!;
  db.markNotificationsAsRead(user.id);
  res.json({ success: true });
});

// Global error handler for JSON responses (catches multer errors, etc.)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ SERVER ERROR:", err);
  res.status(err.status || 500).json({
    error: err.message || "An unexpected server error occurred."
  });
});

// ==========================================
// 🛠️ VITE / PRODUCTION STATIC FILE SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Add SPA fallback in development mode to prevent 404 on reloads
    app.get("*", async (req, res, next) => {
      if (req.originalUrl.startsWith("/api")) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.NODE_ENV === "production") {
    app.listen(PORT, () => {
      console.log(`🚀 SEO Backlink Platform running in production on port ${PORT}`);
    });
  } else {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 SEO Backlink Platform running in development at http://localhost:${PORT}`);
    });
  }
}

startServer();

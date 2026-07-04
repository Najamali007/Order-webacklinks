/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import nodemailer from "nodemailer";
import { db } from "./db.js";

export async function sendNotificationEmail(params: {
  subject: string;
  bodyTitle: string;
  details: Record<string, string | number>;
}): Promise<boolean> {
  try {
    const settings = db.getSettings();
    const recipient = settings.contactEmail || "adsence0202@gmail.com";

    // Build beautiful HTML email body
    const rows = Object.entries(params.details)
      .map(
        ([key, val]) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #4b5563; width: 140px;">${key}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">${val}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <div style="padding-bottom: 20px; border-bottom: 2px solid #3b82f6;">
          <h2 style="margin: 0; color: #1e3a8a; font-size: 24px;">${settings.websiteName}</h2>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Notification System</p>
        </div>
        <div style="padding: 20px 0;">
          <h3 style="margin-top: 0; color: #111827; font-size: 18px;">${params.bodyTitle}</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
        <div style="padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
          <p>This is an automated system notification. Settings can be updated in the Admin Dashboard.</p>
          <p>&copy; ${new Date().getFullYear()} ${settings.websiteName}. All rights reserved.</p>
        </div>
      </div>
    `;

    // Standard safe check to see if SMTP credentials are default placeholder
    const isSmtpPlaceholder =
      !settings.smtpHost ||
      !settings.smtpUser ||
      settings.smtpHost.includes("your-") ||
      settings.smtpUser.includes("your-") ||
      (settings.smtpHost === "smtp.mailtrap.io" && settings.smtpUser === "your-smtp-username");

    if (isSmtpPlaceholder) {
      console.log(`
  =========================================
  📧 EMAIL SIMULATOR (SMTP NOT CONFIGURED)
  =========================================
  To: ${recipient}
  Subject: ${params.subject}
  Body Title: ${params.bodyTitle}
  Details:
  ${Object.entries(params.details)
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join("\n")}
  =========================================
  `);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"${settings.websiteName}" <${settings.smtpEmail}>`,
      to: recipient,
      subject: params.subject,
      html: html,
    });

    console.log(`📧 Email successfully sent to ${recipient}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send SMTP Email notification:", err);
    return false;
  }
}

export async function sendAdminVerificationEmail(adminEmail: string, code: string): Promise<boolean> {
  try {
    const settings = db.getSettings();
    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <div style="padding-bottom: 20px; border-bottom: 2px solid #3b82f6;">
          <h2 style="margin: 0; color: #1e3a8a; font-size: 24px;">WeBacklinks Security</h2>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Action Authorization Required</p>
        </div>
        <div style="padding: 20px 0;">
          <h3 style="margin-top: 0; color: #111827; font-size: 18px;">Verify User Deletion Request</h3>
          <p style="color: #4b5563; line-height: 1.6;">You requested to delete a client account from the WeBacklinks Administration Dashboard. To complete this action, please enter the following verification code:</p>
          <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; letter-spacing: 6px; color: #1e3a8a; font-weight: bold;">${code}</span>
          </div>
          <p style="color: #ef4444; font-size: 13px; line-height: 1.6;"><strong>Important:</strong> This verification code is valid for 5 minutes. If you did not initiate this action, please secure your admin account credentials immediately.</p>
        </div>
        <div style="padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
          <p>This is a real-time automated security code dispatch.</p>
          <p>&copy; ${new Date().getFullYear()} WeBacklinks. All rights reserved.</p>
        </div>
      </div>
    `;

    const isSmtpPlaceholder =
      !settings.smtpHost ||
      !settings.smtpUser ||
      settings.smtpHost.includes("your-") ||
      settings.smtpUser.includes("your-") ||
      (settings.smtpHost === "smtp.mailtrap.io" && settings.smtpUser === "your-smtp-username");

    if (isSmtpPlaceholder) {
      console.log(`
  =========================================
  📧 EMAIL SIMULATOR (SMTP NOT CONFIGURED)
  =========================================
  To: ${adminEmail}
  Subject: WeBacklinks - Admin Action Verification Code
  Code: ${code}
  =========================================
  `);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"${settings.websiteName}" <${settings.smtpEmail}>`,
      to: adminEmail,
      subject: "WeBacklinks - Admin Action Verification Code",
      html: html,
    });

    console.log(`📧 Verification code email successfully sent to ${adminEmail}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send SMTP verification email:", err);
    return false;
  }
}

export async function sendUserVerificationEmail(userEmail: string, code: string): Promise<boolean> {
  try {
    const settings = db.getSettings();
    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <div style="padding-bottom: 20px; border-bottom: 2px solid #3b82f6;">
          <h2 style="margin: 0; color: #1e3a8a; font-size: 24px;">${settings.websiteName}</h2>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Email Verification Code</p>
        </div>
        <div style="padding: 20px 0;">
          <h3 style="margin-top: 0; color: #111827; font-size: 18px;">Verify Your Email Address</h3>
          <p style="color: #4b5563; line-height: 1.6;">Thank you for registering on ${settings.websiteName}. To complete your registration, please enter the following verification code in your browser:</p>
          <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; letter-spacing: 6px; color: #1e3a8a; font-weight: bold;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6;"><strong>Note:</strong> This verification code is valid for 15 minutes. If you did not request this code, please ignore this email.</p>
        </div>
        <div style="padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
          <p>This is an automated system dispatch. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} ${settings.websiteName}. All rights reserved.</p>
        </div>
      </div>
    `;

    const isSmtpPlaceholder =
      !settings.smtpHost ||
      !settings.smtpUser ||
      settings.smtpHost.includes("your-") ||
      settings.smtpUser.includes("your-") ||
      (settings.smtpHost === "smtp.mailtrap.io" && settings.smtpUser === "your-smtp-username");

    if (isSmtpPlaceholder) {
      console.log(`
  =========================================
  📧 EMAIL SIMULATOR (SMTP NOT CONFIGURED)
  =========================================
  To: ${userEmail}
  Subject: ${settings.websiteName} - Email Verification Code
  Code: ${code}
  =========================================
  `);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"${settings.websiteName}" <${settings.smtpEmail}>`,
      to: userEmail,
      subject: `${settings.websiteName} - Email Verification Code`,
      html: html,
    });

    console.log(`📧 User Verification code email successfully sent to ${userEmail}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send SMTP user verification email:", err);
    return false;
  }
}

export async function sendDepositSubmissionAdminEmail(params: {
  userName: string;
  userEmail: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  userBankName?: string;
  userAccountTitle?: string;
  userAccountNumber?: string;
  screenshot?: string | null;
}): Promise<boolean> {
  try {
    const settings = db.getSettings();
    const recipient = settings.contactEmail || "mail@webacklinks.com";
    const currency = settings.currency || "PKR";

    const hasTransactionId = params.transactionId && 
                             params.transactionId !== "N/A" && 
                             params.transactionId !== "null" && 
                             params.transactionId.trim() !== "";

    const transactionRow = hasTransactionId
      ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 35%;">Transaction ID:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;">
                <span style="font-family: monospace; background-color: #f3f4f6; padding: 3px 6px; border-radius: 3px; border: 1px solid #e5e7eb;">${params.transactionId}</span>
              </td>
            </tr>
        `
      : "";

    const screenshotSection = params.screenshot
      ? `
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #15803d; font-weight: 600;">📎 Attached Payment Receipt / Screenshot</p>
            <a href="${params.screenshot}" target="_blank" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);">
              View Receipt Screenshot
            </a>
          </div>
        `
      : "";

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">${settings.websiteName}</h1>
          <p style="color: #bfdbfe; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">New Deposit Received</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <div style="background-color: #f0f7ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
            <h3 style="margin: 0 0 5px 0; color: #1e3a8a; font-size: 16px;">Deposit Verification Alert</h3>
            <p style="margin: 0; color: #4b5563; font-size: 13px; line-height: 1.4;">A new wallet deposit request has been submitted and is awaiting administrative approval.</p>
          </div>
          
          <h4 style="color: #111827; font-size: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin: 0 0 15px 0; font-weight: 600;">👤 User Details</h4>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 35%;">User Name:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${params.userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">User Email:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;"><a href="mailto:${params.userEmail}" style="color: #3b82f6; text-decoration: none;">${params.userEmail}</a></td>
            </tr>
          </table>

          <h4 style="color: #111827; font-size: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin: 20px 0 15px 0; font-weight: 600;">💳 Deposit Details</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 35%;">Deposit Amount:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #10b981; font-size: 16px;">${currency} ${params.amount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Payment Method:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${params.paymentMethod}</td>
            </tr>
            ${transactionRow}
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Submission Date:</td>
              <td style="padding: 8px 0; color: #4b5563;">${new Date().toLocaleString()}</td>
            </tr>
          </table>

          ${screenshotSection}
          
          <div style="background-color: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 15px; border-radius: 6px; margin-top: 25px; font-size: 13px; line-height: 1.5;">
            <strong>⏱️ Action Required:</strong> Please verify the funds in your payment gateway and approve or reject this request in your administrative dashboard.
          </div>
        </div>
        <div style="background-color: #111827; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #1f2937;">
          <p style="margin: 0 0 5px 0; font-weight: 600; color: #ffffff;">${settings.websiteName} Notification Engine</p>
          <p style="margin: 0; color: #6b7280;">This email was automatically dispatched to the site administrator.</p>
        </div>
      </div>
    `;

    const isSmtpPlaceholder =
      !settings.smtpHost ||
      !settings.smtpUser ||
      settings.smtpHost.includes("your-") ||
      settings.smtpUser.includes("your-") ||
      (settings.smtpHost === "smtp.mailtrap.io" && settings.smtpUser === "your-smtp-username");

    if (isSmtpPlaceholder) {
      console.log(`
  =========================================
  📧 EMAIL SIMULATOR (SMTP NOT CONFIGURED)
  =========================================
  To Admin: ${recipient}
  Subject: [Admin Alert] New Deposit - ${params.userName}
  Amount: ${currency} ${params.amount}
  =========================================
  `);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"${settings.websiteName}" <${settings.smtpEmail}>`,
      to: recipient,
      subject: `📥 New Deposit Request: ${currency} ${params.amount.toLocaleString()} - ${params.userName}`,
      html: html,
    });

    console.log(`📧 Deposit alert email successfully sent to Admin (${recipient})`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send SMTP Deposit submission admin email:", err);
    return false;
  }
}

async function getLogoAttachment() {
  try {
    const response = await fetch("https://webacklinks.com/wp-content/uploads/2022/11/webackliks-official-logo--e1768684524993.png", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Referer": "https://webacklinks.com/"
      }
    });
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return {
        filename: "logo.png",
        content: Buffer.from(arrayBuffer),
        cid: "webacklinks-logo"
      };
    }
  } catch (err) {
    console.error("Failed to fetch logo for email attachment:", err);
  }
  return null;
}

export async function sendDepositApprovalUserEmail(params: {
  userEmail: string;
  userName: string;
  amount: number;
  newBalance: number;
}): Promise<boolean> {
  try {
    const settings = db.getSettings();
    const currency = settings.currency || "PKR";
    const supportEmail = settings.contactEmail || "mail@webacklinks.com";

    const logoAttachment = await getLogoAttachment();

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
        <div style="background-color: #ffffff; border-bottom: 1px solid #f1f5f9; padding: 30px; text-align: center; background-image: linear-gradient(to bottom, #ffffff, #f8fafc);">
          <img src="${logoAttachment ? 'cid:webacklinks-logo' : 'https://webacklinks.com/wp-content/uploads/2022/11/webackliks-official-logo--e1768684524993.png'}" alt="WeBacklinks" style="max-height: 45px; height: auto; border: 0; outline: none; margin: 0 auto; display: block;" />
          <p style="color: #1e3a8a; margin: 15px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Deposit Approved 🎉</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #111827; font-size: 20px; margin-top: 0; font-weight: 600;">Hello ${params.userName},</h2>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">Great news! Your deposit has been successfully verified and approved by the administrator. The funds are now available in your platform wallet balance.</p>
          
          <div style="background-color: #f0f7ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; color: #1e3a8a; font-weight: bold;">Amount Added</p>
            <p style="margin: 5px 0 15px 0; font-size: 32px; font-weight: 800; color: #2563eb;">${currency} ${params.amount.toLocaleString()}</p>
            <div style="display: inline-block; background-color: #3b82f6; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
              New Wallet Balance: ${currency} ${params.newBalance.toLocaleString()}
            </div>
          </div>

          <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">You can now use this credit to purchase premium Web 2.0 links, profiles, or custom backlink services directly from your dashboard.</p>

          <div style="text-align: center; margin-bottom: 30px; padding: 20px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
            <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 15px 0;">Stay Connected & Get Fast Support</p>
            <div style="display: block; text-align: center;">
              <a href="https://wa.me/923235854582" target="_blank" style="display: inline-block; background-color: #25d366; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; margin: 5px; box-shadow: 0 2px 4px rgba(37, 211, 102, 0.2);">
                WhatsApp Support
              </a>
              <a href="https://whatsapp.com/channel/0029VbDeCP06LwHjGT5prQ0m" target="_blank" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: bold; font-size: 13px; margin: 5px; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);">
                Join Community
              </a>
            </div>
          </div>

          <div style="text-align: center; font-size: 13px; color: #6b7280; line-height: 1.5; margin-top: 20px; padding-top: 10px;">
            <span style="display: block; margin-bottom: 4px; font-weight: 600;">📧 Support Desk</span>
            <a href="mailto:${supportEmail}" style="color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 14px;">${supportEmail}</a>
          </div>
        </div>
        <div style="background-color: #111827; padding: 25px; text-align: center; font-size: 12px; color: #9ca3af;">
          <p style="margin: 0 0 5px 0; font-weight: 600; color: #ffffff;">${settings.websiteName} Platform</p>
          <p style="margin: 0; color: #6b7280;">Change the World with Powerful Backlinks</p>
        </div>
      </div>
    `;

    const isSmtpPlaceholder =
      !settings.smtpHost ||
      !settings.smtpUser ||
      settings.smtpHost.includes("your-") ||
      settings.smtpUser.includes("your-") ||
      (settings.smtpHost === "smtp.mailtrap.io" && settings.smtpUser === "your-smtp-username");

    if (isSmtpPlaceholder) {
      console.log(`
  =========================================
  📧 EMAIL SIMULATOR (SMTP NOT CONFIGURED)
  =========================================
  To User: ${params.userEmail}
  Subject: Deposit Confirmed - ${settings.websiteName}
  Amount: ${currency} ${params.amount}
  =========================================
  `);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"${settings.websiteName}" <${settings.smtpEmail}>`,
      to: params.userEmail,
      subject: `✅ Wallet Credited: ${currency} ${params.amount.toLocaleString()} Added Successfully - ${settings.websiteName}`,
      html: html,
      attachments: logoAttachment ? [logoAttachment] : [],
    });

    console.log(`📧 Deposit approval email successfully sent to User (${params.userEmail})`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send SMTP Deposit approval user email:", err);
    return false;
  }
}

export async function sendProjectCompletionUserEmail(params: {
  userEmail: string;
  userName: string;
  orderId: string;
  category: string;
  quantity: number;
  deliveryLink: string | null;
  notes: string | null;
}): Promise<boolean> {
  try {
    const settings = db.getSettings();
    const supportEmail = settings.contactEmail || "mail@webacklinks.com";

    const logoAttachment = await getLogoAttachment();

    const deliverySection = params.deliveryLink 
      ? `<div style="background-color: #f0f7ff; border: 1px solid #bee3f8; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #2b6cb0; font-weight: 600;">🔗 Delivery / Report Spreadsheet Link</p>
          <a href="${params.deliveryLink}" target="_blank" style="display: inline-block; background-color: #3182ce; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; font-size: 13px;">
            Open Live Report Sheet
          </a>
         </div>`
      : "";

    const notesSection = params.notes
      ? `<div style="background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin: 15px 0; font-size: 13px; color: #4a5568;">
          <strong style="color: #2d3748;">Admin Notes:</strong><br>
          <p style="margin: 5px 0 0 0; line-height: 1.5; white-space: pre-line;">${params.notes}</p>
         </div>`
      : "";

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
        <div style="background-color: #EFF6FF; border-bottom: 1px solid #dbeafe; padding: 30px; text-align: center;">
          <img src="${logoAttachment ? 'cid:webacklinks-logo' : 'https://webacklinks.com/wp-content/uploads/2022/11/webackliks-official-logo--e1768684524993.png'}" alt="WeBacklinks" style="max-height: 45px; height: auto; border: 0; outline: none; margin: 0 auto; display: block;" />
          <p style="color: #1e3a8a; margin: 15px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Order Completed 🎉</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #111827; font-size: 20px; margin-top: 0; font-weight: 600;">Hello ${params.userName},</h2>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">Excellent news! Your SEO Backlinks project has been completed successfully. Your report is now ready and available for review.</p>
          
          <h3 style="color: #111827; font-size: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin: 0 0 15px 0; font-weight: 600;">📋 Project Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 35%;">Order ID:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;"><span style="font-family: monospace; background-color: #f3f4f6; padding: 2px 6px; border-radius: 3px; border: 1px solid #e5e7eb;">#${params.orderId}</span></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Backlink Category:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${params.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Quantity Ordered:</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${params.quantity.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Completion Date:</td>
              <td style="padding: 8px 0; color: #4b5563;">${new Date().toLocaleString()}</td>
            </tr>
          </table>

          ${deliverySection}

          <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">💡 <strong>Pro-Tip:</strong> Any delivered files or reports can also be securely downloaded anytime directly from the <strong>Order History</strong> panel in your client dashboard.</p>

          <div style="text-align: center; margin-bottom: 30px; padding: 25px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
            <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 15px 0;">Stay Connected & Get Fast Support</p>
            <div style="display: block; text-align: center;">
              <a href="https://wa.me/923235854582" target="_blank" style="display: inline-block; background-color: #128C7E; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 6px; box-shadow: 0 4px 6px rgba(18, 140, 126, 0.15); border: 1px solid #075E54; transition: all 0.2s ease;">
                WhatsApp Support
              </a>
              <a href="https://whatsapp.com/channel/0029VbDeCP06LwHjGT5prQ0m" target="_blank" style="display: inline-block; background-color: #0088cc; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 13px; margin: 6px; box-shadow: 0 4px 6px rgba(0, 136, 204, 0.15); border: 1px solid #006699; transition: all 0.2s ease;">
                Join Our Community
              </a>
            </div>
          </div>

          <div style="text-align: center; font-size: 13px; color: #6b7280; line-height: 1.5; margin-top: 20px; padding-top: 10px;">
            <span style="display: block; margin-bottom: 4px; font-weight: 600;">📧 Support Desk</span>
            <a href="mailto:${supportEmail}" style="color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 14px;">${supportEmail}</a>
          </div>
        </div>
        <div style="background-color: #111827; padding: 25px; text-align: center; font-size: 12px; color: #9ca3af;">
          <p style="margin: 0 0 5px 0; font-weight: 600; color: #ffffff;">${settings.websiteName} Platform</p>
          <p style="margin: 0; color: #6b7280;">Change the World with Powerful Backlinks</p>
        </div>
      </div>
    `;

    const isSmtpPlaceholder =
      !settings.smtpHost ||
      !settings.smtpUser ||
      settings.smtpHost.includes("your-") ||
      settings.smtpUser.includes("your-") ||
      (settings.smtpHost === "smtp.mailtrap.io" && settings.smtpUser === "your-smtp-username");

    if (isSmtpPlaceholder) {
      console.log(`
  =========================================
  📧 EMAIL SIMULATOR (SMTP NOT CONFIGURED)
  =========================================
  To User: ${params.userEmail}
  Subject: Order Completed - #${params.orderId}
  =========================================
  `);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpPort === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"${settings.websiteName}" <${settings.smtpEmail}>`,
      to: params.userEmail,
      subject: `🎉 Project Completed: Order #${params.orderId} is Ready - ${settings.websiteName}`,
      html: html,
      attachments: logoAttachment ? [logoAttachment] : [],
    });

    console.log(`📧 Project completion email successfully sent to User (${params.userEmail})`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send SMTP project completion user email:", err);
    return false;
  }
}


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

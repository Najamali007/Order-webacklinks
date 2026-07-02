/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { db } from "./db.js";
import { User } from "../types.js";

// Memory session store
interface Session {
  token: string;
  userId: string;
  role: "user" | "admin";
  expiresAt: number;
}

const sessions: Map<string, Session> = new Map();
const SESSION_DURATION = 1000 * 60 * 60 * 24; // 24 Hours

export function createSession(userId: string, role: "user" | "admin"): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DURATION;
  sessions.set(token, { token, userId, role, expiresAt });
  return token;
}

export function destroySession(token: string): void {
  sessions.delete(token);
}

// Extend standard Request interface to hold authenticated fields
export interface AuthRequest extends Request {
  user?: User;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  let token = "";
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === "string") {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Please login." });
  }

  const session = sessions.get(token);

  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(token); // Clear expired
    return res.status(401).json({ error: "Session expired or invalid. Please login again." });
  }

  const user = db.getUserById(session.userId);
  if (!user) {
    return res.status(401).json({ error: "User associated with this session no longer exists." });
  }

  if (user.status === "inactive") {
    return res.status(403).json({ error: "Your account has been disabled. Please contact Administrator." });
  }

  // Extend the session expiry on activity
  session.expiresAt = Date.now() + SESSION_DURATION;
  req.user = user;
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Forbidden. Admin access required." });
    }
    next();
  });
}

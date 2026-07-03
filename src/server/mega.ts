import { Storage } from "megajs";
import { db } from "./db.js";

let storageInstance: Storage | null = null;
let currentEmail = "";
let currentPassword = "";

async function getMegaStorage(): Promise<Storage | null> {
  const settings = db.getSettings();
  if (!settings.megaEmail || !settings.megaPassword) {
    return null;
  }

  // Reuse instance if credentials didn't change and status is ready
  if (
    storageInstance &&
    currentEmail === settings.megaEmail &&
    currentPassword === settings.megaPassword &&
    storageInstance.status === "ready"
  ) {
    return storageInstance;
  }

  try {
    const storage = new Storage({
      email: settings.megaEmail,
      password: settings.megaPassword,
      autoload: true,
      autologin: true,
    });

    await storage.ready;
    storageInstance = storage;
    currentEmail = settings.megaEmail;
    currentPassword = settings.megaPassword;
    return storageInstance;
  } catch (error) {
    console.error("❌ Failed to connect to MEGA.nz:", error);
    return null;
  }
}

export async function uploadToMega(filename: string, buffer: Buffer): Promise<boolean> {
  try {
    const storage = await getMegaStorage();
    if (!storage) {
      console.log("⚠️ MEGA credentials not configured or connection failed. Skipping upload.");
      return false;
    }

    console.log(`🚀 Uploading ${filename} to MEGA.nz...`);
    const uploadStream = storage.upload({ name: filename }, buffer);
    await uploadStream.complete;
    console.log(`✅ Uploaded ${filename} to MEGA.nz successfully.`);
    return true;
  } catch (error) {
    console.error(`❌ Error uploading ${filename} to MEGA:`, error);
    return false;
  }
}

export async function downloadFromMega(filename: string): Promise<Buffer | null> {
  try {
    const storage = await getMegaStorage();
    if (!storage) return null;

    console.log(`🔍 Searching ${filename} on MEGA.nz...`);
    const file = storage.find(filename);
    if (!file) {
      console.log(`❌ File ${filename} not found on MEGA.nz`);
      return null;
    }

    console.log(`📥 Downloading ${filename} from MEGA.nz...`);
    const buffer = await file.downloadBuffer({});
    return buffer;
  } catch (error) {
    console.error(`❌ Error downloading ${filename} from MEGA:`, error);
    return null;
  }
}

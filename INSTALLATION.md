# 🔗 Hostinger Deployment & Database Installation Guide

This SEO Backlink Ordering Platform is a fully responsive, secured, high-performance Node.js full-stack (Express + React) application. It is engineered to run seamlessly on standard **Hostinger VPS** plans or **Hostinger Premium/Cloud Startup Web Hosting** setups that support Node.js.

---

## 💻 1. Hostinger Database Setup (MySQL)

This platform works with MySQL database engines out of the box. Follow these steps to configure your Hostinger database:

1. Log in to your **Hostinger hPanel**.
2. Navigate to **Databases** > **MySQL Databases**.
3. Create a brand new database and user:
   * **Database Name**: e.g., `u123456789_backlink`
   * **MySQL User**: e.g., `u123456789_admin`
   * **Password**: Create a secure, strong password.
4. Click **Create**.
5. Find your newly created database and click **Enter phpMyAdmin**.
6. In phpMyAdmin, click the **Import** tab on the top menu.
7. Click **Choose File** and select the `/schema.sql` file provided in this repository.
8. Click **Go** (at the bottom) to execute the SQL tables setup. This will automatically create all tables (`users`, `orders`, `deposit_requests`, `notifications`, `settings`) and pre-seed the:
   * **Admin Account**: `admin@backlink.com` / Password: `admin123`
   * **Test Client**: `user@backlink.com` / Password: `user123` (With Rs. 15,000 balance ready for instant testing)

---

## ⚙️ 2. Environment Variables configuration

Duplicate the `.env.example` file and rename it to `.env` in the project root, then populate your credentials:

```env
# Server Port (Hostinger default Node.js port is automatically routed)
PORT=3000

# Node Environment
NODE_ENV=production

# 🗄️ MySQL Database Credentials (Hostinger Credentials)
DB_HOST=localhost
DB_PORT=3306
DB_USER=u123456789_admin
DB_PASSWORD=YourDatabasePasswordHere
DB_NAME=u123456789_backlink

# 📧 SMTP Configuration
# (Can also be managed directly from the Admin Settings tab inside the dashboard)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=no-reply@yourdomain.com
SMTP_PASS=YourEmailPasswordHere
```

---

## 📦 3. Uploading & Launching on Hostinger

### Method A: Hostinger Node.js Web Hosting Integration (hPanel)

If your Hostinger package has built-in Node.js app administration interfaces in the hPanel:

1. Compress the project folder into a `.zip` archive (Exclude `node_modules` and the `data` database testing logs).
2. Go to **File Manager** inside Hostinger hPanel and upload the `.zip` to your domain folder (e.g., `/public_html` or `/private_html`). Extract it.
3. In hPanel, search for **Node.js** under the Advanced section.
4. Click **Install Node.js App** or configure an existing app:
   * **App directory**: `.` (Root)
   * **Node version**: `18.x` or `20.x` or higher.
   * **Application startup file**: `dist/server.cjs` (Compiled server entry point)
5. Save changes.
6. Click **Run NPM Install** to install clean dependencies.
7. Click **Run Build** (which runs `npm run build` triggering the Vite bundling for React assets and Esbuild compiler for Node.js).
8. Toggle status to **Started**.

### Method B: Hostinger VPS Deployment (SSH)

If you are deploying on a Hostinger VPS (e.g., Ubuntu server):

1. Connect to your VPS via SSH:
   ```bash
   ssh root@your_server_ip
   ```
2. Git clone or upload your project code into `/var/www/backlink-platform`.
3. Install Node.js & NPM:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
4. Install global process managers:
   ```bash
   sudo npm install -y -g pm2
   ```
5. Install packages & Build production bundles:
   ```bash
   npm install
   npm run build
   ```
6. Start the process using PM2:
   ```bash
   pm2 start dist/server.cjs --name "backlink-platform"
   pm2 save
   pm2 startup
   ```
7. Configure Nginx Reverse Proxy to route external port `80/443` traffic to port `3000`.

---

## 🔒 Security & Performance Guidelines

1. **Upload Folder Permissions**: Ensure `/data/uploads/` is writable by the Node.js server but strictly blocked from public directory indexing. This applet achieves this by using `/api/orders/:id/download-pdf` session checks rather than placing raw PDFs in public paths.
2. **Secrets Hiding**: Never commit your `.env` file to public GitHub repositories.
3. **Session Lifetimes**: Cookie session authentication lasts for 24 hours of inactivity.

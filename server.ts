import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { sendVerificationEmail } from './src/services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('edubook.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    whatsapp TEXT,
    password TEXT,
    verification_code TEXT,
    is_verified INTEGER DEFAULT 0,
    referral_code TEXT UNIQUE NOT NULL,
    referred_by TEXT,
    quota_balance INTEGER DEFAULT 20,
    quota_expiry DATETIME,
    bonus_balance INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Initialize default settings
const initSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get() as any;
if (initSettings.count === 0) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('ai_provider', 'gemini');
}

// Migration: Add missing columns if table already exists
const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const columnNames = tableInfo.map(c => c.name);

if (!columnNames.includes('verification_code')) {
  db.exec("ALTER TABLE users ADD COLUMN verification_code TEXT");
}
if (!columnNames.includes('is_verified')) {
  db.exec("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0");
}

// Migration for promotions table
const promoTableInfo = db.prepare("PRAGMA table_info(promotions)").all() as any[];
if (promoTableInfo.length > 0) {
  const promoColumnNames = promoTableInfo.map(c => c.name);
  if (!promoColumnNames.includes('image')) {
    db.exec("ALTER TABLE promotions ADD COLUMN image TEXT");
  }
  if (!promoColumnNames.includes('image_aspect')) {
    db.exec("ALTER TABLE promotions ADD COLUMN image_aspect TEXT DEFAULT '16:9'");
  }
}

// Ensure all admins are verified
db.exec("UPDATE users SET is_verified = 1 WHERE role = 'admin'");

db.exec(`
  -- Update existing users with 0 quota to have 20 for testing
  UPDATE users SET quota_balance = 20, quota_expiry = datetime('now', '+7 days') WHERE quota_balance = 0 AND role = 'user';

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    package_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    proof_image TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    image_aspect TEXT DEFAULT '16:9', -- '16:9', '1:1', '4:5'
    type TEXT DEFAULT 'promo', -- 'promo' or 'announcement'
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'success', 'rejected'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );
`);

// Seed Admin if not exists
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  db.prepare('INSERT INTO users (name, email, password, referral_code, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)')
    .run('Admin', 'admin@edubook.ai', 'admin123', referralCode, 'admin', 1);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Settings APIs
  app.get('/api/admin/settings', (req, res) => {
    try {
      const settings = db.prepare('SELECT * FROM settings').all() as any[];
      const settingsMap = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(settingsMap);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/admin/settings', (req, res) => {
    const { settings } = req.body; // Object with key-value pairs
    try {
      const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      for (const [key, value] of Object.entries(settings)) {
        upsert.run(key, value);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Auth APIs
  app.post('/api/auth/register', async (req, res) => {
    let { name, email, whatsapp, password, referralCode } = req.body;
    
    // Standardize WhatsApp to 62...
    whatsapp = whatsapp.replace(/[^0-9]/g, '');
    if (whatsapp.startsWith('0')) {
      whatsapp = '62' + whatsapp.slice(1);
    } else if (whatsapp.startsWith('8')) {
      whatsapp = '62' + whatsapp;
    }

    const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days trial

      db.prepare(`
        INSERT INTO users (name, email, whatsapp, password, referral_code, referred_by, quota_balance, quota_expiry, verification_code)
        VALUES (?, ?, ?, ?, ?, ?, 20, ?, ?)
      `).run(name, email, whatsapp, password, newReferralCode, referralCode || null, expiryDate.toISOString(), otp);
      
      // Send real email
      const emailSent = await sendVerificationEmail(email, otp);
      
      if (emailSent) {
        res.json({ success: true, message: 'Pendaftaran berhasil, silakan tunggu verifikasi admin.' });
      } else {
        // Even if email fails, we return success as requested
        res.json({ 
          success: true, 
          message: 'Pendaftaran berhasil, silakan tunggu verifikasi admin.'
        });
      }
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post('/api/auth/verify', (req, res) => {
    const { email, code } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND verification_code = ?').get(email, code) as any;
    
    if (user) {
      db.prepare('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?').run(user.id);
      res.json({ success: true, message: 'Akun berhasil diverifikasi' });
    } else {
      res.status(400).json({ success: false, message: 'Kode verifikasi salah' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    try {
      const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password) as any;
      
      if (user) {
        if (user.is_verified === 0) {
          console.log(`Login attempt for unverified user: ${email}`);
          return res.status(403).json({ success: false, message: 'Akun belum diverifikasi', unverified: true });
        }
        console.log(`User logged in: ${email}`);
        res.json({ success: true, user });
      } else {
        console.log(`Invalid login attempt: ${email}`);
        res.status(401).json({ success: false, message: 'Kredensial tidak valid' });
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
  });

  // User APIs
  app.get('/api/user/:id', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  });

  app.get('/api/promotions', (req, res) => {
    const promos = db.prepare('SELECT * FROM promotions WHERE is_active = 1 ORDER BY created_at DESC').all();
    res.json(promos);
  });

  // Chat APIs
  app.get('/api/messages/:userId', (req, res) => {
    const messages = db.prepare('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC').all(req.params.userId);
    res.json(messages);
  });

  app.post('/api/messages', (req, res) => {
    const { userId, role, content, type } = req.body;
    
    // Check quota if user is sending message
    if (role === 'user') {
      const user = db.prepare('SELECT quota_balance, quota_expiry FROM users WHERE id = ?').get(userId) as any;
      const now = new Date();
      const expiry = user.quota_expiry ? new Date(user.quota_expiry) : null;
      
      if (user.quota_balance <= 0 || (expiry && expiry < now)) {
        return res.status(403).json({ success: false, message: 'Kuota habis atau telah kedaluwarsa' });
      }
      
      // Deduct quota
      db.prepare('UPDATE users SET quota_balance = quota_balance - 1 WHERE id = ?').run(userId);
    }

    const result = db.prepare(`
      INSERT INTO messages (user_id, role, content, type)
      VALUES (?, ?, ?, ?)
    `).run(userId, role, content, type || 'text');
    
    res.json({ success: true, id: result.lastInsertRowid });
  });

  // Payment APIs
  app.post('/api/transactions', (req, res) => {
    const { userId, packageName, price, proofImage } = req.body;
    const result = db.prepare(`
      INSERT INTO transactions (user_id, package_name, price, proof_image)
      VALUES (?, ?, ?, ?)
    `).run(userId, packageName, price, proofImage);
    
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.get('/api/transactions/:userId', (req, res) => {
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
    res.json(transactions);
  });

  // Referral APIs
  app.get('/api/referrals/:code', (req, res) => {
    const referrals = db.prepare('SELECT name, email, created_at FROM users WHERE referred_by = ?').all(req.params.code);
    res.json(referrals);
  });

  // Withdrawal APIs
  app.post('/api/withdrawals', (req, res) => {
    const { userId, amount, bankName, accountNumber, accountName } = req.body;
    
    const user = db.prepare('SELECT bonus_balance FROM users WHERE id = ?').get(userId) as any;
    if (!user || user.bonus_balance < amount) {
      return res.status(400).json({ success: false, message: 'Saldo bonus tidak mencukupi' });
    }

    if (amount < 50000) {
      return res.status(400).json({ success: false, message: 'Minimal penarikan Rp 50.000' });
    }

    try {
      db.prepare('UPDATE users SET bonus_balance = bonus_balance - ? WHERE id = ?').run(amount, userId);
      db.prepare(`
        INSERT INTO withdrawals (user_id, amount, bank_name, account_number, account_name)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, amount, bankName, accountNumber, accountName);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.get('/api/withdrawals/:userId', (req, res) => {
    const withdrawals = db.prepare('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC').all(req.params.userId);
    res.json(withdrawals);
  });

  // Admin APIs
  app.get('/api/admin/stats', (req, res) => {
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "user"').get() as any;
    const totalRevenue = db.prepare('SELECT SUM(price) as sum FROM transactions WHERE status = "success"').get() as any;
    const pendingPayments = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE status = "pending"').get() as any;
    const pendingUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_verified = 0 AND role = "user"').get() as any;
    const pendingWithdrawals = db.prepare('SELECT COUNT(*) as count FROM withdrawals WHERE status = "pending"').get() as any;
    
    res.json({
      totalStudents: totalStudents.count,
      totalRevenue: totalRevenue.sum || 0,
      pendingPayments: pendingPayments.count,
      pendingUsers: pendingUsers.count,
      pendingWithdrawals: pendingWithdrawals.count
    });
  });

  app.get('/api/admin/pending-transactions', (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, u.name as user_name, u.email as user_email, u.whatsapp, u.referral_code, u.verification_code
      FROM transactions t 
      JOIN users u ON t.user_id = u.id 
      WHERE t.status = 'pending'
      ORDER BY t.created_at DESC
    `).all();
    res.json(transactions);
  });

  app.post('/api/admin/confirm-transaction', (req, res) => {
    const { transactionId } = req.body;
    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(transactionId) as any;
    
    if (!transaction || transaction.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Transaksi tidak valid' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(transaction.user_id) as any;
    
    // Update transaction
    db.prepare('UPDATE transactions SET status = "success" WHERE id = ?').run(transactionId);
    
    // Add quota
    let quotaAdd = 0;
    let daysAdd = 0;
    if (transaction.price === 50000) { quotaAdd = 1000; daysAdd = 15; }
    else if (transaction.price === 100000) { quotaAdd = 2000; daysAdd = 30; }
    else if (transaction.price === 150000) { quotaAdd = 3000; daysAdd = 30; }

    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + daysAdd);
    
    db.prepare(`
      UPDATE users 
      SET quota_balance = quota_balance + ?, 
          quota_expiry = ? 
      WHERE id = ?
    `).run(quotaAdd, newExpiry.toISOString(), transaction.user_id);

    // Referral Commission (10%)
    if (user.referred_by) {
      const inviter = db.prepare('SELECT id FROM users WHERE referral_code = ?').get(user.referred_by) as any;
      if (inviter) {
        const commission = Math.floor(transaction.price * 0.1);
        db.prepare('UPDATE users SET bonus_balance = bonus_balance + ? WHERE id = ?').run(commission, inviter.id);
      }
    }

    res.json({ success: true });
  });

  app.get('/api/admin/users', (req, res) => {
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
    res.json(users);
  });

  app.post('/api/admin/update-user', (req, res) => {
    let { userId, quota_balance, bonus_balance, role, is_verified, whatsapp } = req.body;
    
    if (whatsapp) {
      whatsapp = whatsapp.replace(/[^0-9]/g, '');
      if (whatsapp.startsWith('0')) {
        whatsapp = '62' + whatsapp.slice(1);
      } else if (whatsapp.startsWith('8')) {
        whatsapp = '62' + whatsapp;
      }
    }

    try {
      if (whatsapp) {
        db.prepare('UPDATE users SET quota_balance = ?, bonus_balance = ?, role = ?, is_verified = ?, whatsapp = ? WHERE id = ?')
          .run(quota_balance, bonus_balance, role, is_verified, whatsapp, userId);
      } else {
        db.prepare('UPDATE users SET quota_balance = ?, bonus_balance = ?, role = ?, is_verified = ? WHERE id = ?')
          .run(quota_balance, bonus_balance, role, is_verified, userId);
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.get('/api/admin/promotions', (req, res) => {
    const promos = db.prepare('SELECT * FROM promotions ORDER BY created_at DESC').all();
    res.json(promos);
  });

  app.post('/api/admin/promotions', (req, res) => {
    const { title, content, type, image, image_aspect } = req.body;
    try {
      db.prepare('INSERT INTO promotions (title, content, type, image, image_aspect) VALUES (?, ?, ?, ?, ?)')
        .run(title, content, type || 'promo', image || null, image_aspect || '16:9');
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.delete('/api/admin/promotions/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM promotions WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.post('/api/admin/delete-user', (req, res) => {
    const { userId } = req.body;
    try {
      // Delete user's messages and transactions first due to foreign keys if needed, 
      // but here we just delete the user (assuming no strict FK constraints or cascade is handled)
      db.prepare('DELETE FROM messages WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.get('/api/admin/all-transactions', (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, u.name as user_name, u.email as user_email, u.whatsapp, u.referral_code, u.verification_code
      FROM transactions t 
      JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
    `).all();
    res.json(transactions);
  });

  app.post('/api/admin/reject-transaction', (req, res) => {
    const { transactionId } = req.body;
    try {
      db.prepare('UPDATE transactions SET status = "rejected" WHERE id = ?').run(transactionId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  app.get('/api/admin/revenue-chart', (req, res) => {
    const data = db.prepare(`
      SELECT date(created_at) as date, SUM(price) as amount
      FROM transactions
      WHERE status = 'success'
      GROUP BY date(created_at)
      ORDER BY date ASC
      LIMIT 30
    `).all();
    res.json(data);
  });

  app.get('/api/admin/withdrawals', (req, res) => {
    const withdrawals = db.prepare(`
      SELECT w.*, u.name as user_name, u.email as user_email 
      FROM withdrawals w 
      JOIN users u ON w.user_id = u.id 
      ORDER BY w.created_at DESC
    `).all();
    res.json(withdrawals);
  });

  app.post('/api/admin/confirm-withdrawal', (req, res) => {
    const { withdrawalId, status } = req.body; // status: 'success' or 'rejected'
    const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(withdrawalId) as any;
    
    if (!withdrawal || withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Penarikan tidak valid' });
    }

    try {
      if (status === 'rejected') {
        // Return balance to user
        db.prepare('UPDATE users SET bonus_balance = bonus_balance + ? WHERE id = ?').run(withdrawal.amount, withdrawal.user_id);
      }
      
      db.prepare('UPDATE withdrawals SET status = ? WHERE id = ?').run(status, withdrawalId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // 404 handler for API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.url}` });
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

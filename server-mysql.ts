import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pool from "./database.js"; // Assuming you compile to JS or use ts-node/esm
import { sendVerificationEmail } from './src/services/emailService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Helper for MySQL queries with error handling
  const query = async (sql: string, params: any[] = []) => {
    try {
      const [results] = await pool.execute(sql, params);
      return results;
    } catch (error: any) {
      console.error('MySQL Error:', error.message);
      throw error;
    }
  };

  // Initialize settings table
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(255) PRIMARY KEY,
        \`value\` TEXT
      )
    `);
    const results = await query('SELECT COUNT(*) as count FROM settings') as any[];
    if (results[0].count === 0) {
      await query('INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?)', ['ai_provider', 'gemini']);
    }
  } catch (e) {
    console.error("Failed to init settings table", e);
  }

  // --- API ROUTES ---

  app.get('/api/admin/settings', async (req, res) => {
    try {
      const settings = await query('SELECT * FROM settings') as any[];
      const settingsMap = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(settingsMap);
    } catch (e) {
      res.status(500).json({});
    }
  });

  app.post('/api/admin/settings', async (req, res) => {
    const { settings } = req.body;
    try {
      for (const [key, value] of Object.entries(settings)) {
        await query('INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = ?', [key, value, value]);
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });

  // Auth
  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const users = await query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]) as any[];
      if (users.length > 0) {
        res.json({ success: true, user: users[0] });
      } else {
        res.status(401).json({ success: false, message: 'Email atau password salah' });
      }
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal login' });
    }
  });

  app.post('/api/register', async (req, res) => {
    let { name, email, whatsapp, password, referralCode, referredBy } = req.body;
    
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
      await query(
        'INSERT INTO users (name, email, whatsapp, password, referral_code, referred_by, verification_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, whatsapp, password, newReferralCode, referredBy || null, otp]
      );
      
      // Send real email
      const emailSent = await sendVerificationEmail(email, otp);
      
      const result = await query('SELECT * FROM users WHERE email = ?', [email]) as any[];
      
      if (emailSent) {
        res.json({ success: true, message: 'Pendaftaran berhasil, silakan tunggu verifikasi admin.' });
      } else {
        res.json({ 
          success: true, 
          message: 'Pendaftaran berhasil, silakan tunggu verifikasi admin.'
        });
      }
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Email sudah terdaftar atau terjadi kesalahan' });
    }
  });

  app.post('/api/verify', async (req, res) => {
    const { email, code } = req.body;
    try {
      const users = await query('SELECT * FROM users WHERE email = ? AND verification_code = ?', [email, code]) as any[];
      if (users.length > 0) {
        await query('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?', [users[0].id]);
        res.json({ success: true, message: 'Akun berhasil diverifikasi' });
      } else {
        res.status(400).json({ success: false, message: 'Kode verifikasi salah' });
      }
    } catch (e) {
      res.status(500).json({ success: false, message: 'Gagal verifikasi' });
    }
  });

  app.get('/api/user/:id', async (req, res) => {
    try {
      const users = await query('SELECT * FROM users WHERE id = ?', [req.params.id]) as any[];
      if (users.length > 0) res.json(users[0]);
      else res.status(404).json({ message: 'User not found' });
    } catch (e) {
      res.status(500).json({ message: 'Error fetching user' });
    }
  });

  // Messages
  app.get('/api/messages/:userId', async (req, res) => {
    try {
      const messages = await query('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at ASC', [req.params.userId]);
      res.json(messages);
    } catch (e) {
      res.status(500).json({ message: 'Error fetching messages' });
    }
  });

  app.post('/api/messages', async (req, res) => {
    const { userId, role, content } = req.body;
    try {
      await query('INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)', [userId, role, content]);
      if (role === 'user') {
        await query('UPDATE users SET quota_balance = quota_balance - 1 WHERE id = ?', [userId]);
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });

  // Transactions
  app.post('/api/transactions', async (req, res) => {
    const { userId, packageName, price, proofImage } = req.body;
    try {
      await query(
        'INSERT INTO transactions (user_id, package_name, price, proof_image) VALUES (?, ?, ?, ?)',
        [userId, packageName, price, proofImage]
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });

  // Referral
  app.get('/api/referrals/:code', async (req, res) => {
    try {
      const referrals = await query('SELECT name, email, created_at FROM users WHERE referred_by = ?', [req.params.code]);
      res.json(referrals);
    } catch (e) {
      res.status(500).json([]);
    }
  });

  // Withdrawals
  app.post('/api/withdrawals', async (req, res) => {
    const { userId, amount, bankName, accountNumber, accountName } = req.body;
    try {
      const users = await query('SELECT bonus_balance FROM users WHERE id = ?', [userId]) as any[];
      if (users.length === 0 || users[0].bonus_balance < amount) {
        return res.status(400).json({ success: false, message: 'Saldo bonus tidak mencukupi' });
      }
      await query('UPDATE users SET bonus_balance = bonus_balance - ? WHERE id = ?', [amount, userId]);
      await query(
        'INSERT INTO withdrawals (user_id, amount, bank_name, account_number, account_name) VALUES (?, ?, ?, ?, ?)',
        [userId, amount, bankName, accountNumber, accountName]
      );
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });

  app.get('/api/withdrawals/:userId', async (req, res) => {
    try {
      const withdrawals = await query('SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC', [req.params.userId]);
      res.json(withdrawals);
    } catch (e) {
      res.status(500).json([]);
    }
  });

  // Admin APIs
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const [students] = await query('SELECT COUNT(*) as count FROM users WHERE role = "user"') as any[];
      const [revenue] = await query('SELECT SUM(price) as sum FROM transactions WHERE status = "success"') as any[];
      const [pendingPay] = await query('SELECT COUNT(*) as count FROM transactions WHERE status = "pending"') as any[];
      const [pendingUser] = await query('SELECT COUNT(*) as count FROM users WHERE is_verified = 0 AND role = "user"') as any[];
      const [pendingWD] = await query('SELECT COUNT(*) as count FROM withdrawals WHERE status = "pending"') as any[];
      
      res.json({
        totalStudents: students.count,
        totalRevenue: revenue.sum || 0,
        pendingPayments: pendingPay.count,
        pendingUsers: pendingUser.count,
        pendingWithdrawals: pendingWD.count
      });
    } catch (e) {
      res.status(500).json({});
    }
  });

  app.get('/api/admin/pending-transactions', async (req, res) => {
    try {
      const transactions = await query(`
        SELECT t.*, u.name as user_name, u.email as user_email, u.whatsapp, u.referral_code, u.verification_code
        FROM transactions t 
        JOIN users u ON t.user_id = u.id 
        WHERE t.status = 'pending'
        ORDER BY t.created_at DESC
      `);
      res.json(transactions);
    } catch (e) {
      res.status(500).json([]);
    }
  });

  app.post('/api/admin/confirm-transaction', async (req, res) => {
    const { transactionId } = req.body;
    try {
      const transactions = await query('SELECT * FROM transactions WHERE id = ?', [transactionId]) as any[];
      if (transactions.length === 0 || transactions[0].status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Transaksi tidak valid' });
      }
      const transaction = transactions[0];
      const users = await query('SELECT * FROM users WHERE id = ?', [transaction.user_id]) as any[];
      const user = users[0];

      await query('UPDATE transactions SET status = "success" WHERE id = ?', [transactionId]);
      
      let quotaAdd = 0;
      let daysAdd = 0;
      if (transaction.price === 50000) { quotaAdd = 1000; daysAdd = 15; }
      else if (transaction.price === 100000) { quotaAdd = 2000; daysAdd = 30; }
      else if (transaction.price === 150000) { quotaAdd = 3000; daysAdd = 30; }

      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + daysAdd);
      
      await query(
        'UPDATE users SET quota_balance = quota_balance + ?, quota_expiry = ? WHERE id = ?',
        [quotaAdd, newExpiry.toISOString(), transaction.user_id]
      );

      if (user.referred_by) {
        const inviters = await query('SELECT id FROM users WHERE referral_code = ?', [user.referred_by]) as any[];
        if (inviters.length > 0) {
          const commission = Math.floor(transaction.price * 0.1);
          await query('UPDATE users SET bonus_balance = bonus_balance + ? WHERE id = ?', [commission, inviters[0].id]);
        }
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });

  app.get('/api/admin/users', async (req, res) => {
    try {
      const users = await query('SELECT * FROM users ORDER BY created_at DESC');
      res.json(users);
    } catch (e) {
      res.status(500).json([]);
    }
  });

  app.post('/api/admin/update-user', async (req, res) => {
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
        await query(
          'UPDATE users SET quota_balance = ?, bonus_balance = ?, role = ?, is_verified = ?, whatsapp = ? WHERE id = ?',
          [quota_balance, bonus_balance, role, is_verified, whatsapp, userId]
        );
      } else {
        await query(
          'UPDATE users SET quota_balance = ?, bonus_balance = ?, role = ?, is_verified = ? WHERE id = ?',
          [quota_balance, bonus_balance, role, is_verified, userId]
        );
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });

  app.get('/api/admin/all-transactions', async (req, res) => {
    try {
      const transactions = await query(`
        SELECT t.*, u.name as user_name, u.email as user_email, u.whatsapp, u.referral_code, u.verification_code
        FROM transactions t 
        JOIN users u ON t.user_id = u.id 
        ORDER BY t.created_at DESC
      `);
      res.json(transactions);
    } catch (e) {
      res.status(500).json([]);
    }
  });

  app.post('/api/admin/reject-transaction', async (req, res) => {
    const { transactionId } = req.body;
    try {
      await query('UPDATE transactions SET status = "rejected" WHERE id = ?', [transactionId]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });

  app.get('/api/admin/revenue-chart', async (req, res) => {
    try {
      const data = await query(`
        SELECT DATE(created_at) as date, SUM(price) as amount
        FROM transactions
        WHERE status = 'success'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
        LIMIT 30
      `);
      res.json(data);
    } catch (e) {
      res.status(500).json([]);
    }
  });

  app.get('/api/admin/withdrawals', async (req, res) => {
    try {
      const withdrawals = await query(`
        SELECT w.*, u.name as user_name, u.email as user_email 
        FROM withdrawals w 
        JOIN users u ON w.user_id = u.id 
        ORDER BY w.created_at DESC
      `);
      res.json(withdrawals);
    } catch (e) {
      res.status(500).json([]);
    }
  });

  app.post('/api/admin/confirm-withdrawal', async (req, res) => {
    const { withdrawalId, status } = req.body;
    try {
      const withdrawals = await query('SELECT * FROM withdrawals WHERE id = ?', [withdrawalId]) as any[];
      if (withdrawals.length === 0 || withdrawals[0].status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Penarikan tidak valid' });
      }
      const withdrawal = withdrawals[0];

      if (status === 'rejected') {
        await query('UPDATE users SET bonus_balance = bonus_balance + ? WHERE id = ?', [withdrawal.amount, withdrawal.user_id]);
      }
      
      await query('UPDATE withdrawals SET status = ? WHERE id = ?', [status, withdrawalId]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });

  app.post('/api/admin/delete-user', async (req, res) => {
    const { userId } = req.body;
    try {
      await query('DELETE FROM messages WHERE user_id = ?', [userId]);
      await query('DELETE FROM transactions WHERE user_id = ?', [userId]);
      await query('DELETE FROM users WHERE id = ?', [userId]);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

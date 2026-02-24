import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pool from "./database.js"; // Assuming you compile to JS or use ts-node/esm

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

  // --- API ROUTES ---

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
    const { name, email, password, referralCode, referredBy } = req.body;
    try {
      await query(
        'INSERT INTO users (name, email, password, referral_code, referred_by) VALUES (?, ?, ?, ?, ?)',
        [name, email, password, referralCode, referredBy]
      );
      const result = await query('SELECT * FROM users WHERE email = ?', [email]) as any[];
      res.json({ success: true, user: result[0] });
    } catch (error: any) {
      res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
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

  // ... (Other Admin APIs would follow similar pattern) ...

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

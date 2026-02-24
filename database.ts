import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'edubook_ai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function query(sql: string, params?: any[]) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error: any) {
    console.error('Database Query Error:', error.message);
    throw new Error('Gagal melakukan query ke database. Silakan periksa koneksi internet atau database Anda.');
  }
}

export default pool;

const express = require('express')
const cors = require('cors')
const path = require('path')
const Database = require('better-sqlite3')
const bcrypt = require('bcryptjs')

const app = express()
const PORT = 3001
const db = new Database(path.join(__dirname, 'data.db'))

// Enable CORS for frontend
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'] }))
app.use(express.json())

// Create users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    gender TEXT DEFAULT '',
    birthday TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now', 'localtime'))
  )
`)

// ─── POST /api/register ───
app.post('/api/register', (req, res) => {
  const { username, password, gender, birthday } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }
  if (username.length < 2 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度需在2-20个字符之间' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码长度至少6个字符' })
  }

  try {
    const hashed = bcrypt.hashSync(password, 10)
    const stmt = db.prepare('INSERT INTO users (username, password, gender, birthday) VALUES (?, ?, ?, ?)')
    const result = stmt.run(username, hashed, gender || '', birthday || '')
    res.json({
      id: result.lastInsertRowid,
      username,
      gender: gender || '',
      birthday: birthday || '',
    })
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '用户名已存在，请换一个' })
    }
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// ─── POST /api/login ───
app.post('/api/login', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' })
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  res.json({
    id: user.id,
    username: user.username,
    gender: user.gender,
    birthday: user.birthday,
  })
})

// ─── GET /api/users ─── (list all users, for debugging)
app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, gender, birthday, createdAt FROM users').all()
  res.json(users)
})

app.listen(PORT, () => {
  console.log(`🌿 TrailMemo Backend running on http://localhost:${PORT}`)
})
import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("database.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'teacher')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    total_hours INTEGER NOT NULL,
    lecture_hours INTEGER DEFAULT 0,
    seminar_hours INTEGER DEFAULT 0,
    lab_hours INTEGER DEFAULT 0,
    practical_hours INTEGER DEFAULT 0,
    FOREIGN KEY(teacher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS subject_groups (
    subject_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    PRIMARY KEY(subject_id, group_id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    FOREIGN KEY(group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    pair_number INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    lesson_type TEXT CHECK(lesson_type IN ('lecture', 'seminar', 'lab', 'practical')) NOT NULL,
    FOREIGN KEY(teacher_id) REFERENCES users(id),
    FOREIGN KEY(subject_id) REFERENCES subjects(id),
    FOREIGN KEY(group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_id INTEGER NOT NULL,
    to_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(from_id) REFERENCES users(id),
    FOREIGN KEY(to_id) REFERENCES users(id)
  );
`);

// Seed admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  db.prepare("INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)").run(
    "Administrator",
    "admin",
    "admin123",
    "admin"
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth API
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT id, name, username, role FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Login yoki parol noto'g'ri" });
    }
  });

  // Admin APIs
  app.get("/api/admin/teachers", (req, res) => {
    const teachers = db.prepare("SELECT id, name, username, password FROM users WHERE role = 'teacher'").all();
    res.json(teachers);
  });

  app.post("/api/admin/teachers", (req, res) => {
    const { name, username, password } = req.body;
    try {
      const result = db.prepare("INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, 'teacher')").run(name, username, password);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Username band" });
    }
  });

  app.put("/api/admin/teachers/:id", (req, res) => {
    const { name, username, password } = req.body;
    db.prepare("UPDATE users SET name = ?, username = ?, password = ? WHERE id = ?").run(name, username, password, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/teachers/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "O'qituvchini o'chirib bo'lmadi" });
    }
  });

  app.get("/api/admin/groups", (req, res) => {
    const groups = db.prepare("SELECT * FROM groups").all();
    res.json(groups);
  });

  app.post("/api/admin/groups", (req, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare("INSERT INTO groups (name) VALUES (?)").run(name);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Guruh nomi band" });
    }
  });

  app.delete("/api/admin/groups/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM groups WHERE id = ?").run(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Guruhni o'chirib bo'lmadi" });
    }
  });

  // Teacher APIs
  app.get("/api/teacher/subjects/:teacherId", (req, res) => {
    const subjects = db.prepare("SELECT * FROM subjects WHERE teacher_id = ?").all(req.params.teacherId);
    subjects.forEach(s => {
      s.groups = db.prepare("SELECT g.id, g.name FROM groups g JOIN subject_groups sg ON g.id = sg.group_id WHERE sg.subject_id = ?").all(s.id);
    });
    res.json(subjects);
  });

  app.post("/api/teacher/subjects", (req, res) => {
    const { teacher_id, name, total_hours, lecture_hours, seminar_hours, lab_hours, practical_hours, group_ids } = req.body;
    const insert = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO subjects (teacher_id, name, total_hours, lecture_hours, seminar_hours, lab_hours, practical_hours)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(teacher_id, name, total_hours, lecture_hours, seminar_hours, lab_hours, practical_hours);
      
      const subjectId = result.lastInsertRowid;
      const stmt = db.prepare("INSERT INTO subject_groups (subject_id, group_id) VALUES (?, ?)");
      for (const gid of group_ids) {
        stmt.run(subjectId, gid);
      }
      return subjectId;
    });
    res.json({ id: insert() });
  });

  app.put("/api/teacher/subjects/:id", (req, res) => {
    const { name, total_hours, lecture_hours, seminar_hours, lab_hours, practical_hours, group_ids } = req.body;
    const update = db.transaction(() => {
      db.prepare(`
        UPDATE subjects 
        SET name = ?, total_hours = ?, lecture_hours = ?, seminar_hours = ?, lab_hours = ?, practical_hours = ?
        WHERE id = ?
      `).run(name, total_hours, lecture_hours, seminar_hours, lab_hours, practical_hours, req.params.id);
      
      db.prepare("DELETE FROM subject_groups WHERE subject_id = ?").run(req.params.id);
      const stmt = db.prepare("INSERT INTO subject_groups (subject_id, group_id) VALUES (?, ?)");
      for (const gid of group_ids) {
        stmt.run(req.params.id, gid);
      }
    });
    update();
    res.json({ success: true });
  });

  app.delete("/api/teacher/subjects/:id", (req, res) => {
    try {
      const del = db.transaction(() => {
        db.prepare("DELETE FROM subject_groups WHERE subject_id = ?").run(Number(req.params.id));
        db.prepare("DELETE FROM schedule WHERE subject_id = ?").run(Number(req.params.id));
        db.prepare("DELETE FROM subjects WHERE id = ?").run(Number(req.params.id));
      });
      del();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Fanni o'chirib bo'lmadi" });
    }
  });

  app.get("/api/teacher/schedule/:teacherId", (req, res) => {
    const schedule = db.prepare(`
      SELECT s.*, sub.name as subject_name, g.name as group_name 
      FROM schedule s
      JOIN subjects sub ON s.subject_id = sub.id
      JOIN groups g ON s.group_id = g.id
      WHERE s.teacher_id = ?
    `).all(req.params.teacherId);
    res.json(schedule);
  });

  app.post("/api/teacher/schedule", (req, res) => {
    const { teacher_id, date, pair_number, subject_id, group_id, lesson_type } = req.body;
    // Check if exists for this pair
    const existing = db.prepare("SELECT id FROM schedule WHERE teacher_id = ? AND date = ? AND pair_number = ?").get(teacher_id, date, pair_number);
    if (existing) {
      db.prepare("UPDATE schedule SET subject_id = ?, group_id = ?, lesson_type = ? WHERE id = ?")
        .run(subject_id, group_id, lesson_type, existing.id);
      res.json({ id: existing.id });
    } else {
      const result = db.prepare("INSERT INTO schedule (teacher_id, date, pair_number, subject_id, group_id, lesson_type) VALUES (?, ?, ?, ?, ?, ?)")
        .run(teacher_id, date, pair_number, subject_id, group_id, lesson_type);
      res.json({ id: result.lastInsertRowid });
    }
  });

  app.delete("/api/teacher/schedule/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM schedule WHERE id = ?").run(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Darsni o'chirib bo'lmadi" });
    }
  });

  // Stats for Admin
  app.get("/api/admin/stats/:teacherId", (req, res) => {
    const subjects = db.prepare("SELECT * FROM subjects WHERE teacher_id = ?").all(req.params.teacherId);
    const stats = subjects.map(s => {
      const completed = db.prepare("SELECT COUNT(*) as count FROM schedule WHERE subject_id = ?").get(s.id).count * 2; // Assuming 1 pair = 2 hours
      return {
        id: s.id,
        name: s.name,
        total: s.total_hours,
        completed: completed,
        remaining: s.total_hours - completed
      };
    });
    res.json(stats);
  });

  // Messages
  app.post("/api/messages", (req, res) => {
    const { from_id, to_id, content } = req.body;
    db.prepare("INSERT INTO messages (from_id, to_id, content) VALUES (?, ?, ?)").run(from_id, to_id, content);
    res.json({ success: true });
  });

  app.get("/api/messages/:userId", (req, res) => {
    const messages = db.prepare(`
      SELECT m.*, u.name as from_name 
      FROM messages m 
      JOIN users u ON m.from_id = u.id 
      WHERE m.to_id = ? OR m.from_id = ?
      ORDER BY m.created_at ASC
    `).all(req.params.userId, req.params.userId);
    res.json(messages);
  });

  app.put("/api/messages/:id", (req, res) => {
    const { content } = req.body;
    db.prepare("UPDATE messages SET content = ? WHERE id = ?").run(content, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/messages/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM messages WHERE id = ?").run(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Xabarni o'chirib bo'lmadi" });
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

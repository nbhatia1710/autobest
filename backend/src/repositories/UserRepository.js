export class UserRepository {
  constructor(db) {
    this.db = db;
  }

  findByEmail(email) {
    const stmt = this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
    return stmt.get(email);
  }

  findById(id) {
    const stmt = this.db.prepare('SELECT id, email, role, created_at FROM users WHERE id = ?');
    return stmt.get(id);
  }

  create({ id, email, password, role = 'customer' }) {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password, role)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, email, password, role);
    return { id, email, role };
  }
}

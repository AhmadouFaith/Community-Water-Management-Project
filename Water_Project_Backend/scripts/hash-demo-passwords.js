const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function run() {
  try {
    const [rows] = await db.query('SELECT id, password_hash FROM user WHERE deleted_at IS NULL');

    let updated = 0;
    for (const row of rows) {
      const current = row.password_hash || '';
      if (current.startsWith('$2a$') || current.startsWith('$2b$') || current.startsWith('$2y$')) {
        continue;
      }

      const hash = await bcrypt.hash(current, 12);
      await db.query('UPDATE user SET password_hash = ? WHERE id = ?', [hash, row.id]);
      updated += 1;
      console.log(`Updated user #${row.id}`);
    }

    console.log(`Done. Passwords hashed for ${updated} users.`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to re-hash demo passwords:', err);
    process.exit(1);
  }
}

run();

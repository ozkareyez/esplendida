import "dotenv/config";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { hashPassword } from "better-auth/crypto";

const email = process.env.ADMIN_EMAIL || process.argv[2];
const password = process.env.ADMIN_PASSWORD || process.argv[3];
const name = process.env.ADMIN_NAME || process.argv[4] || "Administrador";

if (!email || !password) {
  console.error(
    "Uso: node scripts/create-admin.mjs <email> <password> [nombre]\n" +
      "También puedes usar las variables ADMIN_EMAIL y ADMIN_PASSWORD."
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Falta DATABASE_URL en el entorno.");
  process.exit(1);
}

const url = new URL(connectionString);
const client = new Client({
  host: url.hostname,
  port: Number(url.port) || 5432,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
  family: 4,
});

const normalizedEmail = email.toLowerCase().trim();

try {
  await client.connect();

  const existing = await client.query("select id from users where email = $1", [
    normalizedEmail,
  ]);

  const hash = await hashPassword(password);
  const now = new Date();

  if (existing.rowCount > 0) {
    const userId = existing.rows[0].id;
    await client.query(
      "update users set name = $2, email_verified = true, role = 'ADMIN', updated_at = $3 where id = $1",
      [userId, name, now]
    );
    await client.query(
      "update accounts set password = $2, updated_at = $3 where user_id = $1 and provider_id = 'credential'",
      [userId, hash, now]
    );
    console.log(`Usuario ADMIN actualizado: ${normalizedEmail}`);
  } else {
    const userId = randomUUID();
    const accountId = randomUUID();
    await client.query(
      "insert into users (id, name, email, email_verified, role, created_at, updated_at) values ($1, $2, $3, true, 'ADMIN', $4, $4)",
      [userId, name, normalizedEmail, now]
    );
    await client.query(
      "insert into accounts (id, account_id, provider_id, user_id, password, created_at, updated_at) values ($1, $2, 'credential', $3, $4, $5, $5)",
      [accountId, userId, userId, hash, now]
    );
    console.log(`Usuario ADMIN creado: ${normalizedEmail}`);
  }
} catch (error) {
  console.error("Error al crear el admin:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}

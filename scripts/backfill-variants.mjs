import "dotenv/config";
import { randomUUID } from "node:crypto";
import { Client } from "pg";

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

try {
  await client.connect();

  const { rows } = await client.query(`
    select p.id, p.slug, p.price
    from products p
    left join product_variants v on v.product_id = p.id
    where v.id is null
  `);

  if (rows.length === 0) {
    console.log("No hay productos sin variante. Nada por hacer.");
  }

  const now = new Date();
  for (const product of rows) {
    let sku = `${product.slug}-unico`;
    const exists = await client.query("select 1 from product_variants where sku = $1", [sku]);
    if (exists.rowCount > 0) {
      sku = `${product.slug}-unico-${randomUUID().slice(0, 8)}`;
    }

    await client.query(
      `insert into product_variants (id, product_id, sku, name, price, stock, min_stock, created_at, updated_at)
       values ($1, $2, $3, 'Único', $4, 0, 0, $5, $5)`,
      [randomUUID(), product.id, sku, product.price, now]
    );
    console.log(`Variante base creada para ${product.slug} (sku: ${sku})`);
  }
} catch (error) {
  console.error("Error en el backfill de variantes:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end();
}

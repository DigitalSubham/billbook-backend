import pool from "./db.js";

const updateInvoicesSchema = async () => {
  try {
    await pool.query("BEGIN");

    // Remove global unique constraint
    await pool.query(`
      ALTER TABLE invoices
      DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;
    `);

    // Add composite unique constraint
    await pool.query(`
      ALTER TABLE invoices
      ADD CONSTRAINT invoices_user_invoice_unique
      UNIQUE (user_id, invoice_number);
    `);

    await pool.query("COMMIT");
    console.log("✅ Invoices table updated successfully!");
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("❌ Error updating invoices table:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

updateInvoicesSchema();

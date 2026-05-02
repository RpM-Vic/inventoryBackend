import db from "./connectionBun";

(async function deleteProducts() {
  try {
    // 1. Start with a clean measurement
    console.time('Total deletion time');
    
    // 2. Drop indexes (correct approach)
    console.time('Index dropping');
    db.run('DROP INDEX IF EXISTS idx_codigo_barras;');
    db.run('DROP INDEX IF EXISTS idx_productos_id_producto;');
    db.run('PRAGMA foreign_keys = OFF;'); // Before deletion
    console.timeEnd('Index dropping');

    // 3. Transaction with performance logging
    console.time('Deletion transaction');
    db.run('BEGIN TRANSACTION;');
    db.run('DELETE FROM productos;');
    db.run('COMMIT;');
    console.timeEnd('Deletion transaction');

    // 4. Vacuum (consider if really needed for testing)
    console.time('Vacuum');
    db.run('VACUUM;');
    console.timeEnd('Vacuum');

    // 5. Recreate indexes with timing
    console.time('Index recreation');
    db.run('CREATE INDEX idx_codigo_barras ON productos(codigo_barras);');
    db.run('CREATE INDEX idx_productos_id_producto ON productos(id_producto);');
    db.run('PRAGMA foreign_keys = ON;');  // After deletion
    console.timeEnd('Index recreation');

    console.timeEnd('Total deletion time');
    console.log("All products deleted with performance metrics");
  } catch (error) {
    db.run('ROLLBACK;');
    console.error('Error:', error);
  } finally {
    db.close();
  }
})();
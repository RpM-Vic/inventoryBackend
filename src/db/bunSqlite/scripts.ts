
//this script creates the schema
//if you run again it will delete the db
import db from "./connectionBun";

// db.exec(`
//   CREATE TABLE IF NOT EXISTS logs (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     timestamp TEXT NOT NULL,
//     level TEXT NOT NULL,
//     message TEXT NOT NULL,
//     data TEXT
//   )
// `);

// db.exec(`
// ALTER TABLE productos_recibidos DROP COLUMN id_proveedor;`
// );

// -- I want to rename the table historial_compras into productos_recibidos
// -- I also want to rename the table historial_ventas into productos_vendidos

// db.exec(`
//   ALTER TABLE historial_compras RENAME TO productos_recibidos;
//   ALTER TABLE historial_ventas RENAME TO productos_vendidos;
// `);

// db.close()

// db.exec(`
//   CREATE TABLE IF NOT EXISTS historial_ediciones (
//     operacion TEXT,
//     id_usuario TEXT, -- Foreign key
//     productos_afectados INTEGER, -- Number of affected products
//     fecha_modificacion TEXT DEFAULT (datetime('now')), -- Timestamp of modification
//     FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE
//   );
// `);

// db.exec(`
//   ALTER TABLE productos ADD COLUMN en_transito REAL;
// `);

// db.exec(`
//   ALTER TABLE productos ADD COLUMN status TEXT;
// `);


// db.exec(`
//   DROP TABLE IF EXISTS productos_vendidos;
// `);

// db.exec(`
//   CREATE TABLE IF NOT EXISTS productos_vendidos (
//     id_venta TEXT,
//     id_usuario TEXT, -- Foreign key
//     id_producto TEXT, -- Foreign key
//     cantidad REAL,
//     fecha TEXT DEFAULT (datetime('now')), -- Timestamp of modification
//     FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE CASCADE
//     FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON UPDATE CASCADE
//   );
// `);

// db.exec(`
//   DROP TABLE IF EXISTS productos;
// `);

// db.exec(`
//   DROP TABLE IF EXISTS usuarios;
// `);

// db.exec(`
//   CREATE TABLE IF NOT EXISTS usuarios (
//     id_usuario TEXT PRIMARY KEY NOT NULL, 
//     nombre TEXT NOT NULL,
//     apellidos TEXT NOT NULL,
//     correo TEXT NOT NULL UNIQUE,
//     contrasena TEXT NOT NULL,
//     activo INTEGER DEFAULT 1, -- 1 = active, 0 = inactive soft delete
//     fecha_creacion TEXT DEFAULT (datetime('now')),
//     fecha_modificacion TEXT DEFAULT (datetime('now'))
      //  roles TEXT,
      //  OTP TEXT 
//   );
// `);
// db.exec(`
//   CREATE INDEX idx_correo ON usuarios (correo);
// `)

// db.exec(`
//   CREATE TABLE IF NOT EXISTS productos (
//     id_producto TEXT PRIMARY KEY NOT NULL, 
//     descripcion TEXT NOT NULL,
//     precio REAL NOT NULL,
//     categoria TEXT,
//     codigo_externo TEXT,
//     marca TEXT ,
//     proveedor TEXT, -- Supplier of the product
//     stock REAL NOT NULL,
//     minimo REAL,
//     maximo REAL,
//     codigo_barras TEXT,
//     ubicacion TEXT,
//     product REAL,
//     activo INTEGER DEFAULT 1, -- 1 = active, 0 = inactive soft delete
//     fecha_actualizacion TEXT DEFAULT (datetime('now'))
// contenido INTEGER,
// en_transito INTEGER
//   );
// `);
// db.exec(`
//   CREATE INDEX idx_codigo_barras ON productos (codigo_barras);
//   CREATE INDEX idx_productos_id_producto ON productos (id_producto);
// `)

// db.exec(`
//   CREATE TABLE IF NOT EXISTS historial_ventas (
//     id_venta TEXT PRIMARY KEY, 
//     id_usuario,--foreign key
//     id_producto,--foreign key
//     cantidad REAL NOT NULL,
//     fecha TEXT DEFAULT (datetime('now')),
//     FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)  ON UPDATE CASCADE,
//     FOREIGN KEY (id_producto) REFERENCES productos(id_producto)  ON UPDATE CASCADE
//   );
// `);
// db.exec(`
//   CREATE INDEX idx_historial_ventas_id_producto ON historial_ventas (id_producto);
// `)

// db.exec(`
//   CREATE TABLE IF NOT EXISTS historial_compras (
//     id_compra TEXT PRIMARY KEY, 
//     id_usuario,--foreign key
//     id_producto,--foreign key
//     id_proveedor, --foreign key
//     codigo TEXT UNIQUE,
//     cantidad REAL NOT NULL,
//     fecha TEXT DEFAULT (datetime('now')),
//     FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)  ON UPDATE CASCADE,
//     FOREIGN KEY (id_producto) REFERENCES productos(id_producto)  ON UPDATE CASCADE,
//     FOREIGN KEY (id_proveedor) REFERENCES proceedores(id_proveedor)  ON UPDATE CASCADE
//   );
// `);
// db.exec(`
//   CREATE INDEX idx_id_producto ON historial_compras (id_producto);
// `)


// db.exec(`
//   CREATE TABLE IF NOT EXISTS proveedores (
//     id_proveedor TEXT PRIMARY KEY, 
//     nombre TEXT NOT NULL,
//     telefono INTEGER,
//     ubicacion TEXT,
//     email TEXT,
//     fecha TEXT DEFAULT (datetime('now'))
//   );
// `);
// db.exec(`
//   CREATE INDEX idx_nombre ON proveedores (nombre);
// `)



// console.log('Table "productos" has been recreated with new columns.');


// Add the 'roles' column to the 'usuarios' table
// try {
//   db.exec(`
//     ALTER TABLE usuarios ADD COLUMN roles TEXT;
//   `);
//   console.log('Column "roles" added to table "usuarios" successfully.');
// } catch (error) {
//   console.error('Error adding column:', error);
// }


console.log("si se creó??")
import {
  defaultNewProduct,
  generadorProducto,
  type IProducto,
  type IProductoNuevo,
  type ProductQueries,
} from '../../interfaces';
import { generateId } from '../ids';
import db from './connectionBun';
import { Logger } from './Logger';

export class ProductSqlite implements ProductQueries {
  aumentarStock(id_producto: string, cantidad: number): Promise<void> {
    const query = `
  UPDATE productos
  SET stock = stock + ?
  WHERE id_producto = ?;
  `;

    return new Promise((resolve, reject) => {
      try {
        // Correctly pass parameters and callback
        db.run(query, [cantidad, id_producto]);
        resolve();
      } catch (e) {
        const message = 'no se pudo aumentar el stock';
        Logger.warn(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  getProducts(): Promise<any[]> {
    db.run('PRAGMA journal_mode=WAL;');
    const query = 'SELECT * FROM productos';
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        const results = stmt.all();
        resolve(results);
      } catch (e) {
        const message = 'no se pudieron obtener los productos';
        Logger.warn(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  customQuery(query: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      try {
        db.run('PRAGMA journal_mode=WAL;');
        const stmt = db.prepare(query);
        const results = stmt.all(...params); // Pass parameters safely
        resolve(results);
      } catch (e) {
        const message = 'no pudieron obtener los productos';
        Logger.warn(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  createProduct(producto: typeof defaultNewProduct): Promise<string> {
    const id_producto = generateId();
    const fecha_actualizacion = new Date().toISOString();
    const activo = true;

    let query1 = 'INSERT INTO productos (';
    let query2 = ') VALUES (';
    generadorProducto.forEach((propiedad, index) => {
      if (index != 0) {
        query1 += ', ';
        query2 += ',';
      }
      query1 += propiedad;
      query2 += '? ';
    });

    const query = query1 + query2 + ')';

    const onlykeys = Object.keys(defaultNewProduct);

    return new Promise((resolve, reject) => {
      try {
        // values need to be an array with only values
        const values = onlykeys.map((onlykey) => {
          const productValue =
            producto[onlykey as keyof typeof defaultNewProduct];
          const defaultValue =
            defaultNewProduct[onlykey as keyof typeof defaultNewProduct];

          // Check if the value exists and has the correct type
          if (typeof productValue !== typeof defaultValue) {
            const errorMessage = `Invalid type for ${onlykey}: expected ${typeof defaultValue}, got ${typeof productValue}`;
            reject(errorMessage); // Log the error
          }

          // Return the value or the default if the value is missing
          return productValue !== undefined ? productValue : defaultValue;
        });

        const stmt = db.prepare(query);
        stmt.run(id_producto, ...values, activo, fecha_actualizacion);
        resolve(id_producto); // Return the ID of the created product
      } catch (e) {
        const message = 'no se pudieron crear los productos';
        Logger.warn(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  // Function to delete a product
  deleteProduct(id: string): Promise<{ changes: number }> {
    const fecha_actualizacion = new Date().toISOString();
    const query = `UPDATE productos SET fecha_actualizacion = ?, activo = 0 WHERE id_producto = ?`;
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.query(query);
        const results = stmt.run(fecha_actualizacion, id);
        if (results.changes > 0) {
          resolve({ changes: results.changes });
        } else {
          reject(`No se encontró id ${id}`);
        }
      } catch (e) {
        const message = `No se pudo borrar {id}`;
        Logger.error(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  updateProduct(id_producto: string, updates: IProducto): Promise<string> {
    const fecha_actualizacion = new Date().toISOString();

    // Start building the query
    let query = 'UPDATE productos SET ';
    const values: any[] = [];

    // Add fields to the query if they are provided
    return new Promise((resolve, reject) => {
      try {
        const fields = Object.keys(updates);
        fields.forEach((field, index) => {
          if (!(field in defaultNewProduct)) {
            const message = `el campo ${field} no es valido`;
            Logger.warn(message);
            reject(message);
          }

          const defaultValue =
            defaultNewProduct[field as keyof typeof defaultNewProduct];
          const obtainedValue = updates[field as keyof typeof updates];

          if (obtainedValue == defaultValue) {
            query += `${field} = ?`;
            values.push(updates[field as keyof typeof updates]);
            if (index < fields.length - 1) {
              query += ', ';
            }
          }

          if(typeof defaultValue !== "number"){
            const message = `el valor ${obtainedValue} no es valido para ${field}`;
            Logger.warn(message);
            reject(message);
          }

          const numberValue=Number(updates[field as keyof typeof updates])
          if(isNaN(numberValue)){
            const message = `el valor ${obtainedValue} no es valido para ${field}`;
            Logger.warn(message);
            reject(message);  
          }
          query += `${field} = ?`;
          values.push(numberValue);
          if (index < fields.length - 1) {
            query += ', ';
          }
        
        });

        // Add fecha_actualizacion to the query
        query += ', fecha_actualizacion = ? ';
        values.push(fecha_actualizacion);

        // Add the WHERE clause
        query += 'WHERE id_producto = ?';
        values.push(id_producto);

        const stmt = db.prepare(query);
        const result = stmt.run(...values);

        // Check if the update was successful
        if (result.changes > 0) {
          resolve(`Product ${id_producto} updated successfully.`);
        } else {
          console.log(`Product ${id_producto} not found.`);
          reject();
        }
      } catch (e) {
        const message = 'no se pudieron actualizar los productos';
        Logger.warn(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  insertCSVData(products: (typeof defaultNewProduct)[]) {
    //Delete all the indexes to make the inserts faster
    db.run('DROP INDEX IF EXISTS idx_codigo_barras;');
    db.run('DROP INDEX IF EXISTS idx_productos_id_producto;');
    let linea = 1;

    const insert = db.transaction((products) => {
      for (const producto of products) {
        const id_producto = generateId();
        const fecha_actualizacion = new Date().toISOString();
        const activo = true;

        // Generate the SQL query dynamically
        let query1 = 'INSERT INTO productos (';
        let query2 = ') VALUES (';
        generadorProducto.forEach((propiedad, index) => {
          if (index != 0) {
            query1 += ', ';
            query2 += ',';
          }
          query1 += propiedad;
          query2 += '?';
        });
        const query = query1 + query2 + ')';

        // Extract values from the product object
        const onlykeys = Object.keys(defaultNewProduct);
        const values = onlykeys.map((onlykey) => {
          const productValue =
            producto[onlykey as keyof typeof defaultNewProduct];
          const defaultValue =
            defaultNewProduct[onlykey as keyof typeof defaultNewProduct];

          // If defaultValue is a number, try to parse productValue into a number
          if (typeof defaultValue === 'number') {
            const parsedValue = parseFloat(productValue as string); // Use parseFloat for flexibility
            if (isNaN(parsedValue)) {
              const errorMessage = `El valor de ${onlykey}: ${productValue} no es valido en linea ${linea}`;
              Logger.error(errorMessage);
              throw new Error(errorMessage);
            }
            return parsedValue;
          }

          // Use the product value if it exists, otherwise use the default value
          linea++;
          return productValue !== undefined ? productValue : defaultValue;
        });

        // Execute the query
        const insert = db.prepare(query);
        insert.run(id_producto, ...values, activo, fecha_actualizacion);
      }
    });

    // Execute the transaction
    insert(products);

    //Create new indexes to search faster
    db.run('CREATE INDEX idx_codigo_barras ON productos (codigo_barras);');
    db.run(
      'CREATE INDEX idx_productos_id_producto ON productos (id_producto);'
    );
  }
}

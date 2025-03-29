import type { HistorialesQueries } from '../../interfaces';
import db from './connectionBun';
import { Logger } from './Logger';

export class HistorialesSqlite2 implements HistorialesQueries {
  getHistorialEdiciones(numberPage: number): Promise<any[]> {
    const limit = 30;
    const offset = (numberPage - 1) * limit;
    const query = `
    SELECT 
      h.id_usuario, 
      u.nombre, 
      u.apellidos, 
      h.operacion, 
      h.productos_afectados, 
      h.fecha_modificacion
    FROM 
      historial_ediciones h
    JOIN 
      usuarios u 
    ON 
      h.id_usuario = u.id_usuario
    ORDER BY
      h.fecha_modificacion DESC
    LIMIT ${limit} OFFSET ${offset};
  `;

    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        const results = stmt.all();
        resolve(results);
      } catch (error) {
        const message = 'No se pudo obtener historial';
        Logger.error(message, JSON.stringify(error));
        reject(message);
      }
    });
  }

  getProductosVendidos(numberPage: number): Promise<any[]> {
    const limit = 30;
    const offset = (numberPage - 1) * limit;

    const query = `
    SELECT
      pv.id_venta,
      u.nombre,
      u.apellidos,
      p.descripcion,
      pv.cantidad,
      pv.fecha
    FROM 
      productos_vendidos pv
    JOIN
      usuarios u ON pv.id_usuario = u.id_usuario
    JOIN
      productos p ON pv.id_producto = p.id_producto
    ORDER BY
      pv.fecha DESC
    LIMIT ${limit} OFFSET ${offset};
      `;
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        const results = stmt.all();
        resolve(results);
      } catch (error) {
        const message = 'No se pudo obtener historial';
        Logger.error(message, JSON.stringify(error));
        reject(message);
      }
    });
  }

  getProductosRecibidos(numberPage: number): Promise<any[]> {
    const limit = 30;
    const offset = (numberPage - 1) * limit;
    const query = `
    SELECT 
      pr.id_compra,
      u.nombre,
      u.apellidos,
      p.descripcion,
      pr.cantidad,
      pr.proveedor,
      pr.fecha
    FROM 
      productos_recibidos pr
    JOIN
      usuarios u ON pr.id_usuario = u.id_usuario
    JOIN
      productos p ON pr.id_producto = p.id_producto
    ORDER BY
      pr.fecha DESC
    LIMIT ${limit} OFFSET ${offset};
    `;
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        const results = stmt.all();
        resolve(results);
      } catch (error) {
        const message = 'No se pudo obtener historial';
        Logger.error(message, JSON.stringify(error));
        reject(message);
      }
    });
  }

  recordEdition(
    operacion: string,
    id_usuario: string,
    productos_afectados: number
  ): Promise<void> {
    const fecha_modificacion = new Date().toISOString();
    const query = `
    INSERT INTO historial_ediciones (
      operacion, 
      id_usuario,
      productos_afectados,
      fecha_modificacion
    ) VALUES (?, ?, ?, ?)
  `;

    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        stmt.run(
          operacion,
          id_usuario,
          productos_afectados,
          fecha_modificacion
        );
        resolve();
      } catch (error) {
        const message = 'No se pudo obtener historial';
        Logger.error(message, JSON.stringify(error));
        reject(message);
      }
    });
  }

  recordVendidos(
    id_venta: string,
    id_usuario: string,
    id_producto: string,
    cantidad: number
  ): Promise<void> {
    const fecha = new Date().toISOString();
    const query = `
    INSERT INTO productos_vendidos (
      id_usuario,
      id_producto,
      cantidad,
      id_venta,
      fecha
    )  VALUES (?,?,?,?,?)
  `;
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        stmt.run(id_usuario, id_producto, cantidad, id_venta, fecha);
        resolve();
      } catch (error) {
        const message = `No se pudo guardar ${id_venta}`;
        Logger.error(message, JSON.stringify(error));
        reject(message);
      }
    });
  }

  recordRecibidos(
    id_compra: string,
    id_usuario: string,
    id_producto: string,
    proveedor: string,
    cantidad: number
  ): Promise<void> {
    const fecha = new Date().toISOString();
    const query = `
    INSERT INTO productos_recibidos (
      id_compra,
      id_usuario,
      id_producto,
      proveedor,
      cantidad,
      fecha
    )  VALUES (?,?,?,?,?,?)
  `;
    return new Promise((resolve, reject): void => {
      try {
        const stmt = db.prepare(query);
        stmt.run(
          id_compra,
          id_usuario,
          id_producto,
          proveedor,
          cantidad,
          fecha
        );
        resolve();
      } catch (error) {
        const message = `No se pudo guardar ${id_compra}`;
        Logger.error(message, JSON.stringify(error));
        reject(message);
      }
    });
  }

  getHistorialEdicion(column: string, value: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Construct the query
      const query = `SELECT * FROM historial_ediciones WHERE ${column} = ?`;
      try {
        // Prepare the statement
        const stmt = db.prepare(query);

        // Execute the query and fetch results
        const results = stmt.all(value);

        // Resolve the promise with the results
        resolve(results);
      } catch (error) {
        const message = `No se pudo obtener historial`;
        Logger.error(message, JSON.stringify(error));
        reject(message);
      }
    });
  }

  deleteOldLogs(): Promise<void> {
    // Calculate the date 3 months ago in ISO 8601 format
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setHours(threeMonthsAgo.getHours() - 20);
    // threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoISO = threeMonthsAgo.toISOString();

    const query = `DELETE FROM logs WHERE timestamp < ?`;

    return new Promise((resolve, reject) => {
      // Execute the query
      try {
        const stmt = db.prepare(query);
        const result = stmt.run(threeMonthsAgoISO);
        Logger.info(`${result.changes} objectos borrados de logs`);
        resolve();
      } catch (error) {
        const message = `No se pudieron borrar los logs`;
        Logger.error(message, JSON.stringify(error));
        reject(message);
      }
    });
  }

  deleteOldEdits(): Promise<void> {
    // Calculate the date 3 months ago in ISO 8601 format
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setHours(threeMonthsAgo.getHours() - 20);
    // threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const threeMonthsAgoISO = threeMonthsAgo.toISOString();

    const query = `DELETE FROM historial_ediciones WHERE fecha_modificacion < ?`;

    return new Promise((resolve, reject) => {
      // Execute the query
      try {
        const stmt = db.prepare(query);
        const result = stmt.run(threeMonthsAgoISO);
        Logger.info(`${result.changes} objectos borrados de logs`);
        resolve();
      } catch (error) {
        const message = `No se pudieron borrar los edits viejos`;
        Logger.error(message, JSON.stringify(error));
        reject(message);
      }
    });
  }
}

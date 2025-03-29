import { hash, hashSync, verify } from '@node-rs/bcrypt';
import type { IGetRoles, IUsuario, UserQueries } from '../../interfaces';
import { generateId } from '../ids';
import db from './connectionBun';
import { Logger } from './Logger';

export class UserSqlite implements UserQueries {
  getUsers(): Promise<IUsuario[]> {
    const query =
      'SELECT id_usuario, nombre, apellidos, correo, fecha_modificacion, roles FROM usuarios where activo = 1';
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        resolve(stmt.all() as IUsuario[]);
      } catch (e) {
        const message = 'No se pudieron obtener los datos';
        Logger.warn(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  setOTP(id_usuario: string, OTP: string): Promise<void> {
    const query = `
    UPDATE usuarios
    SET OTP = ?
    WHERE id_usuario = ?;
  `;

    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        const result = stmt.run(OTP, id_usuario);

        if (result.changes > 0) {
          resolve();
        } else {
          reject(`No user found with id_usuario: ${id_usuario}`);
        }
      } catch (e) {
        const message = `No se pudo establecer OTP ${id_usuario}`;
        Logger.warn(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  findByEmail(email: string): Promise<IUsuario> {
    const query = 'SELECT id_usuario FROM usuarios where correo = ? LIMIT 1';
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        const result = stmt.get(email) as IUsuario | null;
        resolve(result as IUsuario);
      } catch (e) {
        const message = `No se pudo encontrar ${email} en db`;
        Logger.warn(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  findById(id_user: string): Promise<IUsuario> {
    const query = 'SELECT * FROM usuarios where id_usuario = ? LIMIT 1';
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        const result = stmt.get(id_user) as IUsuario;
        resolve(result);
      } catch (e) {
        const message = `No se pudo encontrar ${id_user} en db`;
        Logger.warn(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  validatePassword(correo: string, contrasena: string): Promise<IUsuario> {
    const query = 'SELECT * FROM usuarios WHERE correo = ? LIMIT 1';

    const stmt = db.prepare(query);
    return new Promise(async (resolve, reject) => {
      try {
        const user = (await stmt.get(correo)) as IUsuario;
        const verified = await verify(contrasena, user.contrasena);
        if (verified) {
          resolve(user);
        } else {
          reject('Fallo de autenticación');
        }
      } catch (e) {
        const message = `No se encontró correo ${correo} `;
        Logger.warn(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  createUser(
    nombre: string,
    apellidos: string,
    correo: string,
    contrasena: string,
    OTP: string,
    roles:string
  ): Promise<void> {
    const id = generateId();
    const contrasenaHash = hashSync(contrasena, 10);

    const fecha_creacion = new Date().toISOString();
    const fecha_modificacion = fecha_creacion;

    const query = `
    INSERT INTO usuarios (
      contrasena,
      id_usuario, 
      nombre, 
      apellidos,
      correo,
      fecha_creacion,
      fecha_modificacion,
      buffer,
      OTP,
      roles
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        stmt.run(
          id,
          id,
          nombre,
          apellidos,
          correo,
          fecha_creacion,
          fecha_modificacion,
          contrasenaHash,
          OTP,
          roles
        );
        resolve();
      } catch (error) {
        const message = `Usuario ${correo} ya existe`;
        Logger.warn(message, JSON.stringify(error));
        reject(message);
      }
    });
  }

  findByOTP(OTP: string): Promise<IUsuario> {
    const query = 'SELECT * FROM usuarios where OTP = ? LIMIT 1';
    return new Promise(async (resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        const result = (await stmt.get(OTP)) as IUsuario;
        resolve(result);
      } catch (e) {
        const message = `No se pudo econtrar OTP en db`;
        Logger.warn(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  swapContrasenaAndBuffer(id_usuario: string, buffer: string): Promise<void> {
    const query = `
    UPDATE usuarios
    SET 
      OTP = NULL, 
      contrasena = ?,
      buffer = NULL
    WHERE id_usuario = ?;
  `;
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        const result = stmt.run(buffer, id_usuario);
        if (result.changes > 0) {
          resolve();
        } else {
          reject();
        }
      } catch (e) {
        const message = `no se puediron procesar los datos`;
        reject(message);
        Logger.error(message, JSON.stringify(e));
      }
    });
  }

  verifyAndSwapOTP(OTP: string): Promise<IUsuario> {
    return new Promise(async (resolve, reject) => {
      try {
        const userBeforeSwap = await this.findByOTP(OTP);
        await this.swapContrasenaAndBuffer(
          userBeforeSwap.id_usuario,
          userBeforeSwap.buffer
        );
        resolve(userBeforeSwap);
      } catch (e) {
        const message = `No se pudo verificar usuario`;
        reject(e);
        Logger.error(message, JSON.stringify(e));
      }
    });
  }

  getAdmins(): Promise<string[]> {
    const query = `SELECT id_usuario FROM usuarios WHERE roles = 'admin';`;
    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        const adminsObjects=stmt.all() as {id_usuario:string}[]
        const adminsStrings=adminsObjects.map((admin)=>admin.id_usuario)
        resolve(adminsStrings)
      } catch (e) {
        const message = 'No se pudieron obtener los administradores';
        Logger.error(message, JSON.stringify(e));
        reject(message);
      }
    });
  }

  updateRoles(id_usuario: string, roles: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (roles !== 'admin') {
          const admins = await this.getAdmins();
          if (admins.length < 2) {
            if (admins.includes(id_usuario)) {
              reject('Debe haber al menos 1 admin');
              return
            }
          }
        }

        const fecha_modificacion = new Date().toISOString();
        const query = `
          UPDATE usuarios
          SET roles = ?,
          fecha_modificacion = ?
          WHERE id_usuario = ?;
        `;

        const stmt = db.prepare(query);
        const result = stmt.run(roles, fecha_modificacion, id_usuario);
        if (result.changes > 0) {
          resolve();
          return
        }
        reject(`No se encontró usuario ${id_usuario}`);
      } catch (error) {
        const message = `No se pudo actualizar ${id_usuario}`;
        Logger.error(message, JSON.stringify(error));
        reject(message);
      }
    });
  }

  setPassordInBuffer(id_usuario: string, contrasena: string): Promise<void> {
    const contrasenaHash = hashSync(contrasena, 10);
    const fecha_modificacion = new Date().toISOString(); // Update the modification timestamp
    const query = `
    UPDATE usuarios
    SET buffer = ?,
    fecha_modificacion = ?
    WHERE id_usuario = ?;
  `;

    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        const result = stmt.run(contrasenaHash, fecha_modificacion, id_usuario);
        if (result.changes > 0) {
          resolve();
        }
        reject(`No se encontró usuario ${id_usuario}`);
      } catch (error) {
        const message = `No se pudo actualizar ${id_usuario}`;
        Logger.error(message, JSON.stringify(error));
        reject(message);
      }
    });
  }

  updatePassword(id_usuario: string, password: string): Promise<void> {
    const fecha_modificacion = new Date().toISOString(); // Update the modification timestamp
    const passwordHash = hashSync(password, 10);
    const query = `
    UPDATE usuarios
    SET contrasena = ?,
    fecha_modificacion = ?,
    WHERE id_usuario = ?;
  `;

    return new Promise((resolve, reject) => {
      try {
        const stmt = db.prepare(query);
        const result = stmt.run(passwordHash, fecha_modificacion, id_usuario);
        if (result.changes > 0) {
          resolve();
        }
        reject();
      } catch (error) {
        const message = `failed to update user ${id_usuario}`;
        Logger.error(message, JSON.stringify(error));
        reject(message);
      }
    });
  }

  deleteUser(id: string): Promise<void> {
    return new Promise(async(resolve, reject) => {
      try {

        const admins = await this.getAdmins();
        if (admins.length < 2) {
          if (admins.includes(id)) {
            reject('Debe haber al menos 1 admins');
            return
          }
        }
        
        const query = db.prepare('DELETE FROM usuarios WHERE id_usuario = ?');
        query.run(id);
        resolve();
      } catch (err) {
        const message = `no se pudo borrar ${id}`;
        Logger.error(message, JSON.stringify(err));
        reject(message);
      }
    });
  }
}

export class GetRolesSqlite implements IGetRoles{
  async getRoles(id_usuario: string): Promise<string>{
    const query = `
      SELECT roles FROM usuarios WHERE id_usuario = ?;
    `;
  
    try {
      const stmt = db.prepare(query);
      const result = stmt.get(id_usuario) as IUsuario;
  
      if (!result) {
        throw new Error(`Usuario con ID ${id_usuario} no encontrado`);
      }
  
      return result.roles;
    } catch (e) {
      const message = `No se pudo obtener el rol de ${id_usuario}`;
      Logger.error(message, JSON.stringify(e));
      throw new Error(message);
    }
  }
}

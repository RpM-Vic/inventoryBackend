import type { NextFunction, Response } from "express"
import type { AuthRequest } from "./middlewares/jwt"

export interface IUsuario{
  id_usuario:string,
  nombre:string,
  apellidos:string,
  correo:string,
  contrasena:string,
  activo:boolean,
  fecha_creacion:Date,
  fecha_modificacion:Date,
  roles:string
  OTP:string,
  buffer:string
}

export interface IpurchaseList{
  id_producto:string,
  precio:number,
  cantidad:number,
  descripcion:string,
  marca:string,
  subtotal:number
}

export interface IProductoNuevo{ 
  descripcion:string,
  precio:number,
  categoria:string,
  codigo_externo:string,
  marca:string,
  proveedor:string,
  stock:number,
  minimo:number,
  maximo:number,
  codigo_barras:string,
  ubicacion:string,
  contenido:number,
}
interface IserverOnly{
  id_producto:string,
  fecha_modificacion:Date,
  activo:boolean
}

export type IProducto=IProductoNuevo& IserverOnly 

export const defaultNewProduct={
  descripcion:"null",
  precio:0,
  categoria:"null",
  codigo_externo:"null",
  marca:"null",
  proveedor:"null",
  stock:0,
  minimo:0,
  maximo:0,
  codigo_barras:"null",
  ubicacion:"null",
  contenido:0,
  en_transito:0
}

export interface IpurchaseList{
  id_producto:string,
  precio:number,
  cantidad:number,
  descripcion:string,
  marca:string,
  subtotal:number
}

export interface IRecibidosList{
  id_compra:string,
  id_producto:string,
  proveedor:string,
  precio:number,
  cantidad:number,
  descripcion:string,
  marca:string,
  subtotal:number,
}

export interface IProductosPatch{
  id_producto:string,
  updates:IProducto
}

export interface IdbProductos{
  aumentarStock(id_producto: string, cantidad: number): Promise<void>,
  customQuery(query: string, params: any[]): Promise<any[]>,
  createProduct(producto:typeof defaultNewProduct):Promise<string>,
  deleteProduct(id: string): Promise<{ changes: number }>,
  insertCSVData(products: typeof defaultNewProduct[]) :void

}

export interface HistorialesQueries{
  getHistorialEdiciones(numberPage: number): Promise<any[]>,
  getProductosVendidos(numberPage: number): Promise<any[]>,
  getProductosRecibidos(numberPage: number): Promise<any[]>,
  recordEdition(
    operacion: string,
    id_usuario: string,
    productos_afectados: number,
    descripcion:any
  ): Promise<void>,
  recordVendidos(
    id_venta: string,
    id_usuario: string,
    id_producto: string,
    cantidad: number
  ): Promise<void>
  recordRecibidos(
    id_compra: string,
    id_usuario: string,
    id_producto: string,
    proveedor: string,
    cantidad: number
  ): Promise<void> 
  getHistorialEdicion(column: string, value: string): Promise<any[]>
  deleteOldLogs(): Promise<void> 
  deleteOldEdits(): Promise<void>

}


export interface ProductQueries{
  aumentarStock(id_producto: string, cantidad: number): Promise<void>
  getProducts():Promise<any[]>
  customQuery(query: string, params: any[]): Promise<any[]>
  createProduct(producto:typeof defaultNewProduct):Promise<string> 
  deleteProduct(id: string): Promise<{ changes: number }>
  updateProduct(
    id_producto:string,
    updates:IProducto):Promise<string>
  insertCSVData(products: typeof defaultNewProduct[]):void

}

export interface UserQueries{
  getUsers():Promise<IUsuario[]>
  setOTP(id_usuario: string, OTP: string): Promise<void>
  findByEmail(email:string):Promise<IUsuario>
  findById(id_user:string):Promise<IUsuario>
  validatePassword(correo: string,contrasena:string):Promise<IUsuario>
  createUser(
    nombre:string,
    apellidos:string,
    correo:string,
    contrasena:string,
    OTP:string,
    roles:string
  ):Promise<void> 
  findByOTP(OTP:string):Promise<IUsuario>
  swapContrasenaAndBuffer(
    id_usuario:string,buffer:string
  ):Promise<void>                
  verifyAndSwapOTP(OTP:string):Promise<IUsuario>
  updateRoles(
    id_usuario:string, 
    roles:string
   ):Promise<void> 
  setPassordInBuffer(
    id_usuario:string, 
    contrasena:string
   ):Promise<void> 
   updatePassword(
    id_usuario:string, 
    password:string
   ):Promise<void> 
   deleteUser(id: string): Promise<void> 
}

export interface IGetRoles{
  getRoles(id_usuario: string): Promise<string>
}

export interface IMiddlewares{
  validateUserRol(req:AuthRequest, res:Response,next:NextFunction):void,
  validateAdminRol(req:AuthRequest, res:Response,next:NextFunction):void
  autoLogin(req:AuthRequest, res:Response,next:NextFunction):void
}

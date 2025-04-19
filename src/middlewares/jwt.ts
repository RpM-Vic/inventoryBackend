import { serialize } from 'cookie';
import type { NextFunction, Request, Response } from "express"
import  Jwt from 'jsonwebtoken';
import { SECRET } from '../env';
import type { IGetRoles, IMiddlewares } from '../interfaces';

export interface AuthRequest extends Request {
  user?:{
    id_usuario:string
    correo:string,
    nombre:string,
    apellidos:string,
    ValidFrontEnd:string,
    roles:string
  }
}


export class Middlewares implements IMiddlewares{
  getRoles
  constructor(getRoles:IGetRoles){
    this.getRoles=getRoles
  }

  validateUserRol=async(req:AuthRequest, res:Response,next:NextFunction)=>{

    const denyAccess=()=>{
      if(req.method=='GET'){
        res.redirect('/')
      }
      else{
        res.json({
          ok:false,
          message:"No tienes permisos suficientes"
        })
      }
    }

    const token =req.cookies.MyTokenName
    if(!token){
      denyAccess()
      return;
    }
  
    const payload=Jwt.verify(token,SECRET) as AuthRequest['user']
  
    if(payload==undefined){
      denyAccess()
      return;
    }
    if (payload?.ValidFrontEnd!== 'ValidFrontEnd') {
      denyAccess()
      return;
    }
    if (!payload?.id_usuario) {
      denyAccess()
      return;
    }
  
    const realRoles=await this.getRoles.getRoles(payload.id_usuario)
  
    if(realRoles!=="user"&&realRoles!=="admin"){
      denyAccess()
    }
  
    req.user=payload
  
    next()
  }

  validateAdminRol=async(req:AuthRequest, res:Response,next:NextFunction)=>{

    const denyAccess=()=>{
      if(req.method=='GET'){
        res.redirect('/')
      }
      else{
        res.json({
          ok:false,
          message:"No tienes permisos suficientes"
        })
      }
    }

    const token =req.cookies.MyTokenName
    if(!token){
      denyAccess()
      return;
    }
  
    const payload=Jwt.verify(token,SECRET) as AuthRequest['user']
  
    if(payload==undefined){
      denyAccess()
      return;
    }
    if (payload?.ValidFrontEnd!== 'ValidFrontEnd') {
      denyAccess()
      return;
    }
    if (!payload?.id_usuario) {
      denyAccess()
      return;
    }
  
    const realRoles=await this.getRoles.getRoles(payload.id_usuario)
  
    if(realRoles!=="admin"){
      denyAccess()
      return
    }
  
    req.user=payload
  
    next()
  }

  //This one doesn't require sql queries 
  //but I want to have all the middlewares in the same place
  autoLogin=(req:AuthRequest, res:Response,next:NextFunction)=>{
    const token =req.cookies.MyTokenName
    if(token){
      res.json({
        ok:true//the front end handless the redirection
      })
      return
    }else{
      next()
    }
  }

}

export const generateToken=async(id_usuario:string,correo:string
)=>{
  const payload = {
    ValidFrontEnd:"ValidFrontEnd",
    id_usuario,
    correo
  };
  const token = Jwt.sign(payload,SECRET,{
    expiresIn:"48h"
  })   

  const serialized=serialize("MyTokenName",token,{
    path:"/",
    maxAge: 60*60*48, //this are secconds, don't trust anyone telling the opposite
    sameSite:'strict', //prevents cross site reques forgery
    secure: false
    //httpsOnly: true   //ideally have to check the .env to see if I'm in production environment
  })

  return serialized;
}


import { Router, type Request, type Response } from 'express';
import { serialize } from 'cookie';

import {
  generateToken,
  type AuthRequest,
} from '../middlewares/jwt';
import { sendEmail } from '../helpers/resend';
import { twoSteps } from '../templates/twoSteps.html';
import { getLocalIpAddress } from '../helpers/getLocalIpAddres';
import { generateId } from '../db/ids';
import { Logger } from '../db/bunSqlite/Logger';
import type { HistorialesQueries, IMiddlewares, UserQueries } from '../interfaces';
import { loginLimiter } from '../middlewares/rateLimiter';
import { PORT } from '../env';


export class LoginEndPoints {
  router = Router();
  historiales;
  middlewares
  queries;

  constructor(historiales: HistorialesQueries, queries: UserQueries,middlewares:IMiddlewares) {
    this.historiales = historiales;
    this.middlewares=middlewares
    this.queries = queries;
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.post('/', [this.middlewares.autoLogin,
      loginLimiter], async (req: Request, res: Response) => {
      const { contrasena, correo } = req.body;

      try {
        const usuario = await this.queries.validatePassword(correo, contrasena);

        const token = await generateToken(
          usuario.id_usuario,
          usuario.correo
        );
        res.setHeader('Set-Cookie', token).json({
          ok: true,
          message: 'Usuario valido',
        });
         
      } catch (e) {
        res.json({
          ok: false,
          message: e,
        });
      }
      this.historiales.deleteOldLogs();
    });

    this.router.post('/registrar', loginLimiter,async (req, res) => {
      const { nombre, apellidos, correo, contrasena } = req.body;

      if (!correo || !contrasena || !nombre || !apellidos) {
        res.json({
          ok: false,
          message: 'No llegaron todos los datos',
        });
        return;
      }

      try {
        const allUsers=await this.queries.getUsers()
        const OTP = generateId();
        if(allUsers.length<2){
          await this.queries.createUser(
            nombre,
            apellidos,
            correo,
            contrasena,
            OTP,
            "admin"
          );
        }
        else{
          await this.queries.createUser(
            nombre,
            apellidos,
            correo,
            contrasena,
            OTP,
            "postulante"
          );
        }
        const baseurl = getLocalIpAddress();
        const url = `https://${baseurl}:${PORT}/login/secondstep/${OTP}`;
        const html = twoSteps(url);

        await sendEmail(correo, 'Autenticación en dos pasos', html);
        res.json({
          ok: true,
          message: 'Revisa tu correo electrónico',
        });
      } catch (e) {
        res.json({
          ok: false,
          message: e,
        });
      }
    });


    this.router.get('/secondstep/:OTP', loginLimiter,async (req, res) => {
      const { OTP } = req.params;
    
      if (!OTP) {
        res.json({
          ok: false,
          message: 'No se recibio la contraseña desechable',
        });
      }
      try {
        const usuario = await this.queries.verifyAndSwapOTP(OTP);

        try{     
          const strongToken = await generateToken(
            usuario.id_usuario,
            usuario.correo
          );
          res.setHeader('Set-Cookie', strongToken).redirect('/venderproductos');
        }
        catch(e){
          res.json({
            ok: false,
            message: e,
          });
        }
      } catch (e) {
        res.json({
          ok: false,
          message: e,
        });
        Logger.error(JSON.stringify(e));
      }
    });

    this.router.post('/forgottenpassword', loginLimiter,async (req, res) => {
      const { correo, contrasena } = req.body;
      if (!correo || !contrasena) {
        res.json({
          ok: false,
          message: 'No se recibieron los datos',
        });
      }
      const OTP = generateId();
      try {
        const usuario = await this.queries.findByEmail(correo);
        await this.queries.setOTP(usuario.id_usuario, OTP);
        await this.queries.setPassordInBuffer(usuario.id_usuario, contrasena);

        const baseurl = getLocalIpAddress();
        const url = `httos://${baseurl}:${PORT}/login/secondstep/${OTP}`;
        const html = twoSteps(url);

        await sendEmail(correo, 'Confirmación de cambio de contraseña', html);
        res.json({
          ok: true,
          message: 'Revisa tu correo electrónico',
        });
      } catch (e) {
        res.json({
          ok: false,
          message: 'No concide la contraseña desechable',
        });
        Logger.error(JSON.stringify(e));
      }
    });

    this.router.get('/logout', (req, res) => {
      // Clear the cookie by setting it with an expired date
      const serialized = serialize('MyTokenName', '', {
        path: '/', // Ensure the path matches the original cookie
        maxAge: 0, // Expire the cookie immediately
        httpOnly: true, // Match the original cookie settings
        // sameSite: 'strict', // Match the original cookie settings
      });

      // Set the cleared cookie in the response header
      res.setHeader('Set-Cookie', serialized);

      // Send a response
      res.redirect('/');
    });

    this.router.get('/user',this.middlewares.validateUserRol,(req:AuthRequest,res)=>{
      const correo=req.user?.correo
      
      res.json({
        ok:true,
        message:"hello",
        correo
      })
    })

  }
}

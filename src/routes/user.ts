import { Router, type Response } from 'express';
import {  type AuthRequest } from '../middlewares/jwt';
import type { IMiddlewares, UserQueries } from '../interfaces';
import { sendEmail } from '../helpers/resend';

export class UserEndpoints {
  router = Router();
  queries;
  middlewares

  constructor(queries: UserQueries, middlewares:IMiddlewares) {
    this.middlewares=middlewares
    this.queries = queries;
    this.setupRoutes();
  }

  setupRoutes() {
    
    this.router.get('/',// this.middlewares.validateUserRol,
      async (req: AuthRequest, res: Response) => {
      const users = await this.queries.getUsers();
      res.json(users);
    });

    this.router.patch('/updateroles',
      this.middlewares.validateAdminRol,
      async (req, res) => {
        const nuevosRoles = req.body;

        if(!Array.isArray(nuevosRoles)){
          res.json({
            ok:false,
            message:"El input no es valido"
          })
          return;
        }

        if (!nuevosRoles || nuevosRoles.length == 0) {
          res.json({
            ok: false,
            message: 'no se recibieron cambios',
          });
          return;
        }

        try{
          for (const update of nuevosRoles) {
            await this.queries.updateRoles(update.id_usuario, update.roles);
          }
          
        res.json({
          ok: true,
          message: 'roles actualizados',
        });
        }
        catch(e){
          res.json({
            ok:false,
            message:e
          })
        }
      }
    );

    this.router.delete('/:id_usuario',
      this.middlewares.validateAdminRol,
      async (req: AuthRequest, res: Response) => {
        const { id_usuario } = req.params;
        if (id_usuario) {
          this.queries
            .deleteUser(id_usuario)
            .then(() => {
              res.json({
                ok: true,
                message: 'usuario borrado',
              });
            })
            .catch((e) => {
              res.json({
                ok: false,
                message:e,
              });
            });
        }
      }
    );

    this.router.post('/contacto',
      async (req: AuthRequest, res: Response) => {
        const { correo,message } = req.body;
        if(!correo||!message){
          res.json({
            ok:false,
            message:"Solicitud incompleta"
          })
        }
        try{
          const body=`email: ${correo} has this concern: ${message}`
          await sendEmail("rpm.vic.developer@gmail.com","Contacto",body)
          res.json({
            ok:true,
            message:"Su mensaje se envió con éxito, me comunicaré con usted a la brevedad posible"
          })
        }
        catch(e){
          res.json({
            ok:false,
            message:e
          })
        }
      }
    );


  }
}

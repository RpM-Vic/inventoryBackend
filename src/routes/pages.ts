import {Router, type Request, type Response} from 'express'
import path from 'path';
import mime from 'mime-types';
import express from 'express';
import { type AuthRequest } from '../middlewares/jwt';
import type { IMiddlewares } from '../interfaces';

const __dirname=process.cwd()

export class Pages{
  middlewares
  router=Router()
  constructor(middlewares:IMiddlewares){
    this.middlewares=middlewares
    this.setupRoutes()
  }
  setupRoutes(){

    this.router.use(express.static(path.join(__dirname,
      'public'), {
      setHeaders: (res, path) => {
        res.setHeader('Content-Type', mime.lookup(path) || 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-store, max-age=0'); // Disable caching
      }
    }));

    
    this.router.get('/contacto',async  (req, res) => {
      res.sendFile(path.join(__dirname,
        'public', 'contacto.html'));
    });    

    
    this.router.get('/contrasenanueva',async  (req, res) => {
      res.sendFile(path.join(__dirname,
        'public', 'contrasenanueva.html'));
    });    
    
    this.router.get('/',async  (req:AuthRequest, res:Response) => {
      // res.setHeader('Cache-Control', 'no-store');
      res.sendFile(path.join(__dirname, 
        'public', 'index.html'));
    });  
    
    this.router.get('*',// this.middlewares.validateUserRol,
      async(req:AuthRequest, res:Response) => {
        const filePath = path.join(__dirname, 'public', `${req.path}.html`);
        // const filePath = path.join(__dirname, 'public', `index.html`);
        res.sendFile(filePath ,(err) => {
          if (err) {
            res.sendFile(path.join(__dirname,'public', '404.html'));
          }
        }) 
      }
    );
  }
}

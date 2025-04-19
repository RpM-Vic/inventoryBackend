import { Router, type Response } from 'express';
import { type AuthRequest } from '../middlewares/jwt';
import type { HistorialesQueries } from '../interfaces';

export class HistorialesEndpoints {
  router = Router();
  historiales;
  constructor(historiales: HistorialesQueries) {
    this.historiales = historiales;
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.get('/historialediciones/:page',
      async (req: AuthRequest, res: Response) => {
        console.log("historial ediciones")
        let { page } = req.params;
        if (!page) {
          page = '1';
        }
        let numberPage = Number(page);
        if (isNaN(numberPage)) {
          numberPage = 1;
        }
        numberPage = Math.abs(numberPage);
        numberPage = Math.round(numberPage);
        numberPage = Math.max(1, numberPage);

        const historial_ediciones =
          await this.historiales.getHistorialEdiciones(numberPage);
        res.json({
          ok: true,
          message: 'Resultados obtenidos',
          historial_ediciones,
        });

        this.router.get('/productosvendidos/:page',
          async (req: AuthRequest, res: Response) => {
            console.log("flag 1")
            let { page } = req.params;
            if (!page) {
              page = '1';
            }
            let numberPage = Number(page);
            if (isNaN(numberPage)) {
              numberPage = 1;
            }
            numberPage = Math.abs(numberPage);
            numberPage = Math.round(numberPage);
            numberPage = Math.max(1, numberPage);
            try{
              const productosvendidos =await this.historiales.getProductosVendidos(numberPage);
              res.json({
                ok: true,
                message: 'Resultados obtenidos',
                productosvendidos,
              });
            }
            catch(e){
              res.json({
                ok: true,
                message: e
              });
            }
          }
        );

        this.router.get('/productosrecibidos/:page',
          async (req: AuthRequest, res: Response) => {
            let { page } = req.params;
            if (!page) {
              page = '1';
            }
            let numberPage = Number(page);
            if (isNaN(numberPage)) {
              numberPage = 1;
            }
            numberPage = Math.abs(numberPage);
            numberPage = Math.round(numberPage);
            numberPage = Math.max(1, numberPage);

            const productosrecibidos =
              await this.historiales.getProductosRecibidos(numberPage);
            res.json({
              ok: true,
              message: 'Resultados obtenidos',
              productosrecibidos,
            });
          }
        );
      }
    );
  }
}

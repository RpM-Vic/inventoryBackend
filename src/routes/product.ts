import { Router, type Response } from 'express';

import {
  defaultNewProduct,
  type HistorialesQueries,
  type IProductosPatch,
  type IpurchaseList,
  type IRecibidosList,
  type ProductQueries,
} from '../interfaces';
import { generateId } from '../db/ids';
import { type AuthRequest } from '../middlewares/jwt';

import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const upload = multer({ dest: 'uploads/' });

export class ProductEndpoints {
  router = Router();
  historiales;
  queries;

  constructor(historiales: HistorialesQueries, queries: ProductQueries) {
    this.historiales = historiales;
    this.queries = queries;
    this.setupRoutes();
  }

  setupRoutes() {
    //this works well for small ammounts 1000~500
    //syncronously will be faster but less demanding to the server resourses
    //for transactions (faster)upload a csv
    this.router.post('/', async (req: AuthRequest, res: Response) => {
      const products: (typeof defaultNewProduct)[] = req.body;
      const productIds:string[] = [];
      const failures: { product: string; error: any }[] = [];

      try {
        // Create an array of promises for crearProductos
        const createProductPromises = products.map(async (product1) => {
          if (product1.descripcion) {
            try {
              const id=await this.queries.createProduct(product1);
              productIds.push(id);
            } catch (e) {
              // Track failed products
              failures.push({ product: product1.descripcion, error: e });
            }
          }
        });

        // Wait for all crearProductos operations to complete
        await Promise.allSettled(createProductPromises);

        // Record the edition
        try {
          if (productIds.length>0) {
            const id_usuario = req.user?.id_usuario;
            id_usuario &&
              (await this.historiales.recordEdition(
                'creacion',
                id_usuario,
                productIds.length,
                productIds
              ));
          }
        } catch (e) {
          failures.push({ product: '', error: 'Failed to record edition' });
        }

        // Send response with success and failure details
        if (failures.length === 0) {
          res.json({
            res: true,
            message: `${productIds.length} productos creados con éxito`,
          });
        } else {
          res.status(207).json({
            // 207 Multi-Status
            res: false,
            message: `${productIds.length} productos creados con éxito, pero ${failures.length} operaciones fallaron`,
            failures,
          });
        }
      } catch (e) {
        console.error('Unexpected error:', e);
        res.status(500).json({
          ok: false,
          message: 'Error inesperado al procesar la solicitud',
        });
      }
      this.historiales.deleteOldEdits();
    });

    this.router.post('/completarventa', async (req: AuthRequest, res: Response) => {
      const purchaseList: IpurchaseList[] = req.body;
      const id_venta = generateId();

      try {
        // Use a loop to process each item in the purchase list
        for (const item of purchaseList) {
          const id_usuario = req.user?.id_usuario;
          id_usuario &&
            (await this.historiales.recordVendidos(
              id_venta,
              id_usuario,
              item.id_producto,
              item.cantidad
            ));
          await this.queries.aumentarStock(item.id_producto, -item.cantidad); // Use negative cantidad to reduce stock
        }

        res.json({
          ok: true,
          message: 'La venta se completó con éxito 😎',
        });
      } catch (error) {
        console.error('Error completing sale:', error);
        res.json({
          ok: false,
          message: error || 'Error al completar la venta',
        });
      }
    });

    this.router.post('/recibirproductos',
      async (req: AuthRequest, res: Response) => {
        const purchaseList: IRecibidosList[] = req.body;
        const id_compra = generateId();

        try {
          // Use a loop to process each item in the purchase list
          for (const item of purchaseList) {
            const id_usuario = req.user?.id_usuario;
            id_usuario &&
              (await this.historiales.recordRecibidos(
                id_compra,
                id_usuario,
                item.id_producto,
                item.proveedor,
                item.cantidad
              ));
            await this.queries.aumentarStock(item.id_producto, item.cantidad); // Use negative cantidad to reduce stock
          }

          res.json({
            ok: true,
            message: 'Se recibieron los productos con exito 😎',
          });
        } catch (error) {
          console.error('Error completing:', error);
          res.json({
            ok: false,
            message: error || 'Error al recibir',
          });
        }
      }
    );

    this.router.post('/queryvender', async (req: AuthRequest, res: Response) => {
      const { isPartial, searchIn, valueToSearch } = req.body;

      //Sanitizing...
      //right now isPartial doens't
      //sanitization

      if (typeof valueToSearch !== 'string' || typeof searchIn !== 'string') {
        res.json({
          ok: false,
          message: 'El valor a buscar no es valido',
        });
        return;
      }

      if (!(searchIn in defaultNewProduct)&&searchIn!=="id_producto") {
        res.json({
          ok: false,
          message: 'No se recibió en dónde buscar',
        });
        return;
      }

      let query;
      let searchValue;

      if (!isPartial) {
        query = `SELECT id_producto, descripcion, marca, precio, categoria FROM productos WHERE ${searchIn} = ? AND activo = 1 LIMIT 6`;
        searchValue = valueToSearch; // Use the value as-is
      } else {
        query = `SELECT id_producto, descripcion, marca, precio, categoria FROM productos WHERE ${searchIn} LIKE ? AND activo = 1 LIMIT 6`;
        searchValue = `%${valueToSearch}%`; // Add wildcards for partial search
      }

      const results = await this.queries.customQuery(query, [searchValue]);

      res.json({
        ok: true,
        message: 'lista obtenida',
        results,
      });
    });

    this.router.post('/query', async (req: AuthRequest, res: Response) => {
      const { columns, isPartial, searchIn, valueToSearch } = req.body;
      let {page}=req.body

      // Validate inputs to ensure they are safe
      if (
        !Array.isArray(columns) ||
        typeof searchIn !== 'string' ||
        typeof valueToSearch !== 'string'||
        typeof page !== "number"
      ) {
        res.status(400).json({ ok: false, error: 'Invalid input' });
        return;
      }

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
      const limit = 30;
      const offset = (numberPage - 1) * limit;



      if (!(searchIn in defaultNewProduct)&&searchIn!=="id_producto") {

        res.json({
          ok: false,
          message: 'No se recibió en dónde buscar',
        });
        return;
      }

      let query;
      let searchValue;

      if (columns.length == 0 && valueToSearch == '') {
        query = `SELECT id_producto FROM productos WHERE activo = 1 LIMIT ${limit} OFFSET ${offset};`;
        searchValue = valueToSearch; // Use the value as-is
      } else if (columns.length == 0) {
        query = `SELECT id_producto FROM productos WHERE ${searchIn} = ? AND activo = 1 LIMIT ${limit} OFFSET ${offset}; `;
        searchValue = valueToSearch; // Use the value as-is
      } else if (valueToSearch == '') {
        query = `SELECT id_producto, ${columns.join(
          ', '
        )} FROM productos WHERE activo = 1 LIMIT ${limit} OFFSET ${offset};`;
        searchValue = valueToSearch; // Use the value as-is
      } else if (!isPartial) {
        // Exact match
        query = `SELECT id_producto, ${columns.join(
          ', '
        )} FROM productos WHERE ${searchIn} = ? AND activo = 1 LIMIT ${limit} OFFSET ${offset};`;
        searchValue = valueToSearch; // Use the value as-is
      } else {
        // Partial match: Add wildcards to the search value
        query = `SELECT id_producto, ${columns.join(
          ', '
        )} FROM productos WHERE ${searchIn} LIKE ? AND activo = 1 LIMIT ${limit} OFFSET ${offset}; `;
        searchValue = `%${valueToSearch}%`; // Add wildcards for partial search
      }

      //Use parameterized queries to prevent SQL injection
      const results = await this.queries.customQuery(query, [searchValue]);

      res.json({
        ok: true,
        message: 'lista obtenida',
        results,
      });
    });

    this.router.patch('/', async (req: AuthRequest, res: Response) => {
      const allUpdates: IProductosPatch[] = req.body;
    
      if (allUpdates.length < 1) {
        res.json({
          ok: false,
          message: 'No se recibieron productos a editar',
        });
        return
      }
    
      let ediciones = 0;
      const failures: { id_producto: string; error: string }[] = [];
    
      // Use a for loop to ensure synchronous updates to `ediciones`
      for (const product of allUpdates) {
        const { id_producto, updates } = product;
  
        try {
          await this.queries.updateProduct(id_producto, updates);
          ediciones++; // Increment only if the update is successful
        } catch (error) {
          failures.push({ id_producto, error: JSON.stringify(error) });
        }
      }
    
      const id_usuario = req.user?.id_usuario;
    
      // Early return if the user is invalid
      if (typeof id_usuario === 'undefined') {
        res.json({
          ok: false,
          message: 'Usuario no válido',
        });
        return
      }
    
      try {
        // Record the edition in the history
        await this.historiales.recordEdition('edicion', id_usuario, ediciones,allUpdates);
    
        // Respond with success message
        res.json({
          ok: true,
          message: `${ediciones} productos actualizados`,
        });
      } catch (e) {
        // Handle unexpected errors
        console.error('Error recording edition:', e);
    
        if (failures.length > 0) {
          res.json({
            ok: false,
            message: 'Error inesperado, intente más tarde',
          });
        } else {
          res.json({
            ok: false,
            message: 'Error inesperado',
          });
        }
      }
    
      // Clean up old edits (this should likely be done in the background)
      this.historiales.deleteOldEdits();
    });

    this.router.delete('/:id_producto', async (req: AuthRequest, res: Response) => {
      const { id_producto } = req.params;

      if (!id_producto) {
        res
          .status(200)
          .json({ ok: false, message: 'ID del producto es requerido' });
        return;
      }

      try {
        const result = await this.queries.deleteProduct(id_producto); // Ensure it's awaited

        if (result.changes > 0) {
          res.json({ 
            ok: true, 
            message: 'Producto borrado', 
            id_producto 
          });
          const id_usuario = req.user?.id_usuario;
          id_usuario &&
            (await this.historiales.recordEdition('borrado', id_usuario, 1,id_producto));
        } else {
          res
            .status(204)
            .json({
              ok: false,
              message: 'Producto no encontrado',
              id_producto,
            });
          return;
        }
      } catch (error) {
        console.error('Error al borrar producto:', error);
        res
          .status(200)
          .json({ ok: false, message: 'Error interno', id_producto });
        return;
      }
    });

    this.router.post('/upload-csv', upload.single('csv'), (req, res) => {
      console.log("file upload requested")
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded.' });
        return;
      }

      const filePath = req.file.path;
      const results: any[] = [];

      // Read and parse the CSV file
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          this.queries.insertCSVData(results);

          // Delete the temporary file
          fs.unlinkSync(filePath);

          res.json({
            ok: true,
            message: 'CSV se guardo con éxito',
          });
        })
        .on('error', (error) => {
          console.error('Error parsing CSV:', error);
          res.json({
            ok: false,
            message: JSON.stringify(error),
          });
        });
    });
  }
}

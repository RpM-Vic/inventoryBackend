import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import fs from "fs";
import https from "https";
import open from "open";
import path from "path";

import { getLocalIpAddress } from "./helpers/getLocalIpAddres";
import {limiter } from "./middlewares/rateLimiter";
import { Pages} from "./routes/pages";
import { Middlewares} from "./middlewares/jwt";
import { HistorialesSqlite2 } from "./db/bunSqlite/historiales";
import { HistorialesEndpoints } from "./routes/historiales";
import { LoginEndPoints } from "./routes/login";
import { GetRolesSqlite, UserSqlite } from "./db/bunSqlite/user";
import { ProductSqlite } from "./db/bunSqlite/product";
import { ProductEndpoints } from "./routes/product";
import { UserEndpoints } from "./routes/user";
import { PORT } from "./env";

const app = express();

const getRoles=new GetRolesSqlite()
const middlewares= new Middlewares(getRoles)

const historiales= new HistorialesSqlite2()
const historialesEndpoints=new HistorialesEndpoints(historiales)

const userSqlite=new UserSqlite()
const loginEndpoints=new LoginEndPoints(historiales,userSqlite,middlewares)

const productSqlite=new ProductSqlite()
const productEndpoints=new ProductEndpoints(historiales,productSqlite)

const userEndpoints=new UserEndpoints(userSqlite,middlewares)

const pages=new Pages(middlewares)

app.use(cors(), express.json(), limiter, cookieParser());

app.use('/login',limiter,loginEndpoints.router);
app.use('/historiales',limiter,middlewares.validateUserRol, 
  historialesEndpoints.router);
app.use('/product',limiter,middlewares.validateUserRol, 
  productEndpoints.router);
app.use('/user', limiter,userEndpoints.router);
app.use('/',pages.router);

// Function to get the IP address of the device
const ipAddress = getLocalIpAddress();

const options = {
  key: fs.readFileSync(path.join(process.cwd(), "key.pem"), "utf-8"),
  cert: fs.readFileSync(path.join(process.cwd(), "cert.pem"), "utf-8"),
};

https.createServer(options, app).listen(PORT, () => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  console.log(
    `=============================================================================================`
  );
  console.log(`Server started at ${timeString}`);
  const url=`https://${ipAddress}:${PORT}`
  console.log(`HTTPS server running on ${url}`);
  open(url).catch(err => {
    console.error("Failed to open browser:", err);
  });

});

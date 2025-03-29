//to be continued
import pg from "pg"

export const pool= new pg.Pool({
  user:,
  host:,
  password:,
  database:,
  port:5432
})


pool.query('SELECT NOW()')
.then(result=>console.log(result))

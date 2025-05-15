import { createClient } from "@libsql/client";

const con = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const rows_n = await con.execute("select count(*) from readings");
const rows = parseInt(rows_n.rows[0]["0"]);
console.log(`🛫 There are ${rows} rows and ${rows * 3} meteorological readings!`)

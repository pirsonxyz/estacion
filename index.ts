import { type Serve } from "bun";
import path from "path";
import { createClient } from "@libsql/client";
import type { Client } from "@libsql/client";

async function create_con(): Promise<Client | undefined> {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (url && token) {
    const con = createClient({
      url: url,
      authToken: token,
    });

    await con.execute("create table if not exists readings (temp REAL, hum REAL,lpg REAL,co REAL,smoke REAL, pressure REAL, alt REAL, update_at datetime default current_timestamp)");
    return con;
  }
  return undefined;
}

const allowedOrigin = "*";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
let latestSensorData = {
  temp: 0.0,
  humidity: 0.0,
  lpg: 0.0,
  co: 0.0,
  smoke: 0.0,
  pressure: 0.0,
  alt: 0.0
};
const con = await create_con();
console.log(con);
const data = await con?.execute("SELECT temp, hum, lpg, co, smoke, pressure, alt ,update_at FROM readings ORDER BY update_at DESC LIMIT 1");
const rows = data?.rows;
if (rows && rows[0] && rows[0]["0"] && rows[0]["1"] && rows[0]["2"] && rows[0]["3"] && rows[0]["4"] && rows[0]["5"] && rows[0]["6"]) {
  const temp = rows[0]["0"].toString()
  const humidity = rows[0]["1"].toString();
  const lpg = rows[0]["2"].toString();
  const co = rows[0]["3"].toString();
  const smoke = rows[0]["4"].toString();
  const pressure = rows[0]["5"].toString();
  const alt = rows[0]["6"].toString();

  if (temp && humidity) {
    latestSensorData = {
      temp: parseFloat(temp),
      humidity: parseFloat(humidity),
      lpg: parseFloat(lpg),
      co: parseFloat(co),
      smoke: parseFloat(smoke),
      pressure: parseFloat(pressure),
      alt: parseFloat(alt),
    };
  }
}
console.log("Starting Bun server...");

export default {
  hostname: "0.0.0.0",
  port: 3000, // Specify the port
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;
    console.log(`Request: ${method} ${pathname}`);

    if (method === "OPTIONS") {
      console.log("Handling OPTIONS preflight request");
      return new Response(null, {
        status: 204, // No Content
        headers: corsHeaders,
      });
    }

    let response: Response;

    // API route for updating data and sending to db
    if (pathname === "/api/sensor-update" && method === "POST") {
      const con = await create_con();
      console.log(con);

      try {
        const data = await request.json();
        console.log(data);
        if (
          typeof data.temp === "number" && typeof data.humidity === "number" && typeof data.lpg === "number" && typeof data.co === "number" && typeof data.smoke === "number" && typeof data.pressure === "number" && typeof data.alt === "number"

        ) {
          latestSensorData = {
            temp: data.temp,
            humidity: data.humidity,
            lpg: data.lpg,
            co: data.co,
            smoke: data.smoke,
            pressure: data.pressure,
            alt: data.alt,
          };
          console.log("going to update now");
          await con?.execute({ sql: "insert into readings (temp, hum, lpg, co, smoke, pressure, alt)  values(?, ?, ?, ?, ?, ?, ?)", args: [latestSensorData.temp, latestSensorData.humidity, latestSensorData.lpg, latestSensorData.co, latestSensorData.smoke, latestSensorData.pressure, latestSensorData.alt] });


          console.log("Updated sensor data:", latestSensorData);
          // Create base response without CORS headers yet
          response = new Response(
            JSON.stringify({ success: true, data: latestSensorData }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        } else {
          response = new Response(
            JSON.stringify({ success: false, error: "Invalid data format" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      } catch (error) {
        response = new Response(
          JSON.stringify({ success: false, error: "Invalid JSON" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    } // API route to get the latest data
    else if (pathname === "/api/latest" && method === "GET") {
      console.log("Handling GET /api/latest");
      // Create base response without CORS headers yet
      response = new Response(JSON.stringify(latestSensorData), {
        headers: { "Content-Type": "application/json" },
      });
    } // Serve index.html for the root path
    else if (pathname === "/" && method === "GET") {
      const htmlPath = path.join(import.meta.dir, "index.html");
      console.log(`Serving HTML: ${htmlPath}`);
      const file = Bun.file(htmlPath);
      if (await file.exists()) {
        response = new Response(file); // Bun sets Content-Type
      } else {
        console.error(`HTML file not found at: ${htmlPath}`);
        response = new Response("Not Found: index.html missing", {
          status: 404,
        });
      }
    } else if (pathname === "/dist/index.js" && method === "GET") {
      const buildPath = path.join(import.meta.dir, "dist", "index.js");
      console.log(`Serving JS: ${buildPath}`);
      const file = Bun.file(buildPath);
      if (await file.exists()) {
        response = new Response(file, {
          headers: { "Content-Type": "application/javascript" },
        });
      } else {
        console.error(`JS bundle not found at: ${buildPath}`);
        response = new Response("Not Found: bundle.js missing", {
          status: 404,
        });
      }
    } // Fallback for other requests
    else {
      console.log(`Path not handled: ${pathname}`);
      response = new Response("Not Found", { status: 404 });
    }

    const finalHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      finalHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: finalHeaders,
    });
  },
  error(error) {
    console.error("Server Error:", error);
    const errorHeaders = new Headers({ "Content-Type": "text/plain" });
    Object.entries(corsHeaders).forEach(([key, value]) => {
      errorHeaders.set(key, value);
    });
    return new Response("Internal Server Error", {
      status: 500,
      headers: errorHeaders,
    });
  },
} satisfies Serve;

console.log(
  `Bun server configured with CORS origin: ${allowedOrigin}. Listening on http://0.0.0.0:3000`,
);

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

    await con.execute("create table if not exists readings (temp real, hum real,lpg real,co real,smoke real, pressure real, alt real, readed_at datetime default current_timestamp)");
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

const UPLOAD_SECRET_TOKEN = process.env.UPLOAD_SECRET_TOKEN;
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
const data = await con?.execute("select temp, hum, lpg, co, smoke, pressure, alt ,readed_at from readings order by readed_at desc limit 1");
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


    if (pathname === "/api/sensor-update" && method === "POST") {

      if (!UPLOAD_SECRET_TOKEN) {
        console.error(
          "UPLOAD_SECRET_TOKEN is not configured on the server. Denying request.",
        );
        return new Response(
          JSON.stringify({
            success: false,
            error: "Server configuration error: Missing upload token.",
          }),
          {
            status: 500, // Internal Server Error
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("Missing or malformed Authorization header");
        return new Response(
          JSON.stringify({
            success: false,
            error: "Unauthorized: Missing or malformed token",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const token = authHeader.substring(7); // Remove "Bearer "
      if (token !== UPLOAD_SECRET_TOKEN) {
        console.warn("Invalid token received");
        return new Response(
          JSON.stringify({ success: false, error: "Forbidden: Invalid token" }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      console.log("Authorization successful for /api/sensor-update.");

      const con = await create_con();

      try {
        const data = await request.json();
        if (
          typeof data.temp === "number" &&
          typeof data.humidity === "number" &&
          typeof data.lpg === "number" &&
          typeof data.co === "number" &&
          typeof data.smoke === "number" &&
          typeof data.pressure === "number" &&
          typeof data.alt === "number"
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
          await con?.execute({ sql: "insert into readings (temp, hum, lpg, co, smoke, pressure, alt)  values(?, ?, ?, ?, ?, ?, ?)", args: [latestSensorData.temp, latestSensorData.humidity, latestSensorData.lpg, latestSensorData.co, latestSensorData.smoke, latestSensorData.pressure, latestSensorData.alt] });


          console.log("Updated sensor data:", latestSensorData);
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
    }
    else if (pathname === "/api/latest" && method === "GET") {
      console.log("Handling GET /api/latest");
      response = new Response(JSON.stringify(latestSensorData), {
        headers: { "Content-Type": "application/json" },
      });
    }
    else if (pathname === "/" && method === "GET") {
      const htmlPath = path.join(import.meta.dir, "index.html");
      console.log(`Serving HTML: ${htmlPath}`);
      const file = Bun.file(htmlPath);
      if (await file.exists()) {
        response = new Response(file);
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
    }
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

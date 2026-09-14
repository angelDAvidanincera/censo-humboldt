const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");

//const pool = require("./database/db");
const db = require("./database/sqlite");
const categoriasRoutes = require("./routes/categoriasRoutes");
const mediosPagoRoutes = require("./routes/mediosPagoRoutes");
const equipamientosRoutes = require("./routes/equipamientosRoutes");
const censosRoutes = require("./routes/censosRoutes");
const metricasRoutes = require("./routes/metricasRoutes");
const mercadosRoutes = require("./routes/mercadosRoutes");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/categorias", categoriasRoutes);
app.use("/api/medios-pago", mediosPagoRoutes);
app.use("/api/equipamientos", equipamientosRoutes);
app.use("/api/censos", censosRoutes);
app.use("/api/metricas", metricasRoutes);
app.use("/api/mercados", mercadosRoutes);

app.get("/", (req, res) => {
  res.json({
    mensaje: "API Censo Humboldt funcionando",
  });
});

app.get("/api/health", (req, res) => {
  try {
    const resultado = db
      .prepare("SELECT datetime('now', 'localtime') AS fecha")
      .get();

    res.json({
      estado: "ok",
      conexion: "SQLite conectado",
      fecha: resultado.fecha,
      baseDatos: "censo-humboldt.db",
    });
  } catch (error) {
    console.error("Error de SQLite:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "No se pudo conectar con SQLite",
    });
  }
});

let servidor = null;

function iniciarServidor() {
  if (servidor) {
    return servidor;
  }

  servidor = app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  });

  return servidor;
}

function detenerServidor() {
  if (servidor) {
    servidor.close();
    servidor = null;
  }
}

/*
  Si ejecutamos:
  node src/server.js
  o npm run dev

  el servidor se inicia normalmente.

  Si Electron importa este archivo,
  no arranca hasta que Electron llame iniciarServidor().
*/
if (require.main === module) {
  iniciarServidor();
}

module.exports = {
  app,
  iniciarServidor,
  detenerServidor,
};
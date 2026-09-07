const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");

const pool = require("./database/db");
const categoriasRoutes = require("./routes/categoriasRoutes");
const mediosPagoRoutes = require("./routes/mediosPagoRoutes");
const equipamientosRoutes = require("./routes/equipamientosRoutes");
const censosRoutes = require("./routes/censosRoutes");
const metricasRoutes = require("./routes/metricasRoutes");

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/categorias", categoriasRoutes);
app.use("/api/medios-pago", mediosPagoRoutes);
app.use("/api/equipamientos", equipamientosRoutes);
app.use("/api/censos", censosRoutes);
app.use("/api/metricas", metricasRoutes);

app.get("/", (req, res) => {
  res.json({
    mensaje: "API Censo Humboldt funcionando",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        NOW() AS fecha,
        current_database() AS base_datos
    `);

    res.json({
      estado: "ok",
      conexion: "PostgreSQL conectado",
      fecha: resultado.rows[0].fecha,
      baseDatos: resultado.rows[0].base_datos,
    });
  } catch (error) {
    console.error("Error de PostgreSQL:", error);

    res.status(500).json({
      estado: "error",
      mensaje: "No se pudo conectar con PostgreSQL",
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
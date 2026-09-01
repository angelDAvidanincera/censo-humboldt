require("dotenv").config();


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

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
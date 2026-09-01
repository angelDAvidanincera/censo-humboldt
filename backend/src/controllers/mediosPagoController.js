const pool = require("../database/db");

const obtenerMediosPago = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id_medio_pago,
        nombre
      FROM medios_pago
      ORDER BY id_medio_pago
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error("Error al obtener medios de pago:", error);

    res.status(500).json({
      mensaje: "Error al obtener los medios de pago",
    });
  }
};

module.exports = {
  obtenerMediosPago,
};
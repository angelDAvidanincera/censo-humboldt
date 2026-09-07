const db = require("../database/sqlite");

const obtenerMediosPago = (req, res) => {
  try {
    const mediosPago = db.prepare(`
      SELECT
        id_medio_pago,
        nombre
      FROM medios_pago
      ORDER BY id_medio_pago
    `).all();

    res.json(mediosPago);
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
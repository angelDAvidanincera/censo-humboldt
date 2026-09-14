const db = require("../database/sqlite");

const obtenerMercados = (req, res) => {
  try {
    const mercados = db
      .prepare(`
        SELECT
          id_mercado,
          nombre
        FROM mercados
        WHERE activo = 1
        ORDER BY nombre ASC
      `)
      .all();

    res.json(mercados);
  } catch (error) {
    console.error("Error al obtener mercados:", error);

    res.status(500).json({
      mensaje: "Error al obtener mercados",
    });
  }
};

module.exports = {
  obtenerMercados,
};
const db = require("../database/sqlite");

const obtenerEquipamientos = (req, res) => {
  try {
    const equipamientos = db.prepare(`
      SELECT
        id_equipamiento,
        nombre
      FROM equipamientos
      ORDER BY id_equipamiento
    `).all();

    res.json(equipamientos);
  } catch (error) {
    console.error("Error al obtener equipamientos:", error);

    res.status(500).json({
      mensaje: "Error al obtener los equipamientos",
    });
  }
};

module.exports = {
  obtenerEquipamientos,
};
const pool = require("../database/db");

const obtenerEquipamientos = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id_equipamiento,
        nombre
      FROM equipamientos
      ORDER BY id_equipamiento
    `);

    res.json(resultado.rows);

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
const pool = require("../database/db");

const obtenerCategorias = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id_categoria,
        codigo,
        nombre
      FROM categorias_giro
      ORDER BY id_categoria
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error("Error al obtener categorías:", error);

    res.status(500).json({
      mensaje: "Error al obtener las categorías",
    });
  }
};

module.exports = {
  obtenerCategorias,
};
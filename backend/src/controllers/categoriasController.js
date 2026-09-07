const db = require("../database/sqlite");

const obtenerCategorias = (req, res) => {
  try {
    const categorias = db.prepare(`
      SELECT
        id_categoria,
        codigo,
        nombre
      FROM categorias_giro
      ORDER BY id_categoria
    `).all();

    res.json(categorias);
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
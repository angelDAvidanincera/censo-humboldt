const express = require("express");

const {
  obtenerCategorias,
} = require("../controllers/categoriasController");

const router = express.Router();

router.get("/", obtenerCategorias);

module.exports = router;
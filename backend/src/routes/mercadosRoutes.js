const express = require("express");

const {
  obtenerMercados,
} = require("../controllers/mercadosController");

const router = express.Router();

router.get("/", obtenerMercados);

module.exports = router;
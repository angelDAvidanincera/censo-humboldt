const express = require("express");

const {
  obtenerMediosPago,
} = require("../controllers/mediosPagoController");

const router = express.Router();

router.get("/", obtenerMediosPago);

module.exports = router;
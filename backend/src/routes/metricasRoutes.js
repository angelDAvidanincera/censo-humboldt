const express = require("express");

const {
  obtenerMetricas,
} = require("../controllers/metricasController");

const router = express.Router();

router.get("/", obtenerMetricas);

module.exports = router;
const express = require("express");

const {
  obtenerEquipamientos,
} = require("../controllers/equipamientosController");

const router = express.Router();

router.get("/", obtenerEquipamientos);

module.exports = router;
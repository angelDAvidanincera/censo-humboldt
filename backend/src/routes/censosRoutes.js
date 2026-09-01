const express = require("express");

const {
  crearCenso,
  obtenerCensos,
  obtenerCensoPorId,
  actualizarCenso
} = require("../controllers/censosController");

const router = express.Router();

router.post("/", crearCenso);
router.get("/", obtenerCensos);
router.get("/:id", obtenerCensoPorId);
router.put("/:id", actualizarCenso);

module.exports = router;
const express = require("express");

const {
  obtenerAsistencias,
  registrarAsistencia,
  obtenerHistorialParticipante,
  obtenerResumenCurso,
} = require("../controllers/asistenciasController");

const router = express.Router();

router.get("/", obtenerAsistencias);

router.post("/", registrarAsistencia);

router.get(
  "/participante/:id", obtenerHistorialParticipante);

router.get(
  "/resumen/:id_curso", obtenerResumenCurso);

module.exports = router;
const express = require("express");

const {
  obtenerCursos,
  crearCurso,
} = require("../controllers/cursosController");

const router = express.Router();

// Obtener todos los cursos
router.get("/", obtenerCursos);

// Crear un curso
router.post("/", crearCurso);

module.exports = router;
const express = require("express");

const {
  obtenerParticipantes,
  crearParticipante,
} = require("../controllers/participantesController");

const router = express.Router();

router.get("/", obtenerParticipantes);
router.post("/", crearParticipante);

module.exports = router;
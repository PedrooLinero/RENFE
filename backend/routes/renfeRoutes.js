// renfeRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const renfeController = require("../controller/renfeController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/");

    cb(null, uploadPath); // Establecer la ruta de destino
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Nombre del archivo guardado
  },
});

const upload = multer({ storage });

// router.get('/', platoController.getAllPlato);
// router.get('/:idplato', platoController.getPlatoById);
router.post(
  "/",
  upload.fields([{ name: "fichero1", maxCount: 1 }]),
  renfeController.guardarExcels
);
// router.delete('/:idplato', platoController.deletePlato);
// router.put('/:idplato', platoController.updatePlato);

module.exports = router;

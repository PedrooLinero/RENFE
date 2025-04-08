// renfeRoutes.js
const express = require('express');
const router = express.Router();
const renfeController = require('../controller/renfeController');

// router.get('/', platoController.getAllPlato);
// router.get('/:idplato', platoController.getPlatoById);
router.post('/', renfeController.leerExcel);
// router.delete('/:idplato', platoController.deletePlato);
// router.put('/:idplato', platoController.updatePlato);


module.exports = router;
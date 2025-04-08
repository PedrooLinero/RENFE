// Importar libreria para respuestas
const Respuesta = require("../utils/respuesta");
const { logMensaje } = require("../utils/logger.js");
const XLSX = require("sheetjs-style");
const path = require("path");
const fs = require("fs");
class RenfeController {
  static leerExcel(nombreExcel) {
    console.log("Ha entrado en leerExcel");

    try {
      const filePath = path.join(__dirname, "../uploads/", nombreExcel);

      // Leer el archivo Excel
      const workbook = XLSX.readFile(filePath);

      // Obtener la primera hoja de trabajo
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convertir la hoja a JSON
      const data = XLSX.utils.sheet_to_json(sheet);

      return data;
    } catch (error) {
      console.error("Error al leer el archivo Excel:", error);
      throw new Error("Error al leer el archivo Excel.");
    }
  }

  async guardarExcels(req, res) {
    const fichero1 = req.files["fichero1"]
      ? req.files["fichero1"][0].filename
      : null;

    console.log("Fichero 1:", fichero1);

    if (!fichero1) {
      return res.status(400).json({ message: "Se debe subir varios ficheros" });
    }

    try {
      const excelData1 = RenfeController.leerExcel(fichero1);

      console.log("Datos del Excel 1:", excelData1);
    } catch (error) {
      console.error("Error al procesar el archivo:", error);
      res.status(500).json({ message: "Error al procesar el archivo Excel." });
    }
  }

  //   async createPlato(req, res) {
  //     // Implementa la lógica para crear un nuevo plato
  //     const plato = req.body;
  //     try {
  //       const platoNuevo = await Plato.create(plato);
  //       res.status(201).json(Respuesta.exito(platoNuevo, "Plato insertado"));
  //     } catch (err) {
  //       logMensaje("Error :" + err);
  //       res
  //         .status(500)
  //         .json(Respuesta.error(null, `Error al crear un plato nuevo: ${plato}`));
  //     }
  //   }
  //   async getAllPlato(req, res) {
  //     try {
  //       const data = await Plato.findAll(); // Recuperar todos los platos
  //       res.json(Respuesta.exito(data, "Datos de platos recuperados"));
  //     } catch (err) {
  //       // Handle errors during the model call
  //       res
  //         .status(500)
  //         .json(
  //           Respuesta.error(
  //             null,
  //             `Error al recuperar los datos de los platos: ${req.originalUrl}`
  //           )
  //         );
  //     }
  //   }
  //   async deletePlato(req, res) {
  //     const idplato = req.params.idplato;
  //     try {
  //       const numFilas = await Plato.destroy({
  //         where: {
  //           idplato: idplato,
  //         },
  //       });
  //       if (numFilas == 0) {
  //         // No se ha encontrado lo que se quería borrar
  //         res
  //           .status(404)
  //           .json(Respuesta.error(null, "No encontrado: " + idplato));
  //       } else {
  //         res.status(204).send();
  //       }
  //     } catch (err) {
  //       logMensaje("Error :" + err);
  //       res
  //         .status(500)
  //         .json(
  //           Respuesta.error(
  //             null,
  //             `Error al eliminar los datos: ${req.originalUrl}`
  //           )
  //         );
  //     }
  //   }
  //   async getPlatoById(req, res) {
  //     // El id plato viene en la ruta /api/platos/:idplato
  //     const idplato = req.params.idplato;
  //     try {
  //       const fila = await Plato.findByPk(idplato);
  //       if (fila) {
  //         // Si se ha recuprado un plato
  //         res.json(Respuesta.exito(fila, "Plato recuperado"));
  //       } else {
  //         res.status(404).json(Respuesta.error(null, "Plato no encontrado"));
  //       }
  //     } catch (err) {
  //       logMensaje("Error :" + err);
  //       res
  //         .status(500)
  //         .json(
  //           Respuesta.error(
  //             null,
  //             `Error al recuperar los datos: ${req.originalUrl}`
  //           )
  //         );
  //     }
  //   }
  //   async updatePlato(req, res) {
  //     const plato = req.body; // Recuperamos datos para actualizar
  //     const idplato = req.params.idplato; // dato de la ruta
  //     // Petición errónea, no coincide el id del plato de la ruta con el del objeto a actualizar
  //     if (idplato != plato.idplato) {
  //       return res
  //         .status(400)
  //         .json(Respuesta.error(null, "El id del plato no coincide"));
  //     }
  //     try {
  //       const numFilas = await Plato.update({ ...plato }, { where: { idplato } });
  //       if (numFilas == 0) {
  //         // No se ha encontrado lo que se quería actualizar o no hay nada que cambiar
  //         res
  //           .status(404)
  //           .json(
  //             Respuesta.error(null, "No encontrado o no modificado: " + idplato)
  //           );
  //       } else {
  //         // Al dar status 204 no se devuelva nada
  //         // res.status(204).json(Respuesta.exito(null, "Plato actualizado"));
  //         res.status(204).send();
  //       }
  //     } catch (err) {
  //       logMensaje("Error :" + err);
  //       res
  //         .status(500)
  //         .json(
  //           Respuesta.error(
  //             null,
  //             `Error al actualizar los datos: ${req.originalUrl}`
  //           )
  //         );
  //     }
  //   }
}

module.exports = new RenfeController();

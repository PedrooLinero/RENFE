// Importar libreria para respuestas
const Respuesta = require("../utils/respuesta");
const { logMensaje } = require("../utils/logger.js");

class RenfeController {

    async leerExcel(req, res) {
        
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

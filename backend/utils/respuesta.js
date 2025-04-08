module.exports = {
  exito: (datos, mensaje = "Operación realizada correctamente") => ({
    ok: true,
    datos: datos,
    mensaje: mensaje,
  }),

  error: (datos, mensaje = "Error en la operación") => ({
    ok: false,
    datos: null,
    mensaje: mensaje,
  }),
};

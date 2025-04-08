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

      // Verificar si el archivo existe
      if (!fs.existsSync(filePath)) {
        throw new Error(`El archivo no existe en la ruta: ${filePath}`);
      }

      // Leer el archivo Excel
      const workbook = XLSX.readFile(filePath, { cellDates: true });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("No se encontraron hojas en el workbook");
      }

      const sheet = workbook.Sheets[sheetName];

      // Convertir la hoja a JSON con opciones personalizadas
      const data = XLSX.utils.sheet_to_json(sheet, {
        header: 1, // Usar la primera fila como encabezado sin procesar
        raw: false, // Convertir valores a strings o números según corresponda
        blankrows: false, // Ignorar filas completamente vacías
        defval: 0, // Usar 0 como valor por defecto para celdas vacías
      });

      // Procesar los datos manualmente
      const processedData = [];
      let currentCity = null;
      let currentCode = null;

      data.forEach((row) => {
        // Detectar nuevas secciones (como "CIUDAD REAL - 449")
        if (typeof row[0] === "string" && row[0].includes(" - ")) {
          const [city, code] = row[0].split(" - ");
          currentCity = city.trim();
          currentCode = code.trim();
          return; // Saltar esta fila de título
        }

        // Ignorar filas de resumen o vacías
        if (!row[0] || row[0].includes("Resumen por fechas")) {
          return;
        }

        // Estructurar los datos útiles
        processedData.push({
          city: currentCity, // Nombre de la ciudad
          code: currentCode, // Código
          category: row[0], // Ej: "LR", "DOT", "LF"
          dailyValues: row.slice(1, 32), // Valores diarios (31 días)
          total: row[32], // Columna "Total"
          totalEuros: row[33], // Columna "Total €"
          unitPrice: row[34], // Columna "Precio unitario"
        });
      });

      return processedData;
    } catch (error) {
      console.error("Error al leer el archivo Excel:", error.message);
      throw new Error(`Error al leer el archivo Excel: ${error.message}`);
    }
  }

  async guardarExcels(req, res) {
    try {
      const fichero1 = req.files["fichero1"]
        ? req.files["fichero1"][0].filename
        : null;

      console.log("Fichero 1:", fichero1);

      if (!fichero1) {
        return res
          .status(400)
          .json({ message: "Se debe subir al menos un fichero" });
      }

      const excelData1 = await RenfeController.leerExcel(fichero1);

      console.log("Datos del Excel 1:", excelData1);
      
      return res.status(200).json({
        message: "Archivo procesado correctamente",
        data: excelData1,
      });
    } catch (error) {
      console.error("Error al procesar el archivo:", error.message);
      return res.status(500).json({
        message: "Error al procesar el archivo Excel",
        error: error.message,
      });
    }
  }
}

module.exports = new RenfeController();

// Importar librerías necesarias
const Respuesta = require("../utils/respuesta");
const { logMensaje } = require("../utils/logger.js");
const ExcelJS = require("exceljs");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

class RenfeController {
  // Constantes para índices de columnas del segundo Excel
  static COLUMN_INDEXES = {
    NAME: 12, // Columna "NOMBRE"
    TRAIN: 13, // Columna "Tren"
  };

  static COLUMN_LOADS = {
    L0: 14,
    LC: 15,
    LN2: 16,
    LN1: 17,
    LCAB: 18,
    LR: 19,
    EV: 20,
    DOT: 21,
    LE: 22,
    LET: 23,
    LF: 24,
    LP: 25,
    LT: 26,
    N1: 27,
    N2: 28,
    N3: 29,
    "Vehículos Taller": 30,
  };

  // Método para limpiar cadenas de texto (nombres)
  static cleanString(value) {
    if (!value) return "";
    return String(value)
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Eliminar caracteres de control
      .replace(/[^\x20-\x7E]/g, "") // Eliminar caracteres no ASCII (excepto espacio)
      .trim() // Eliminar espacios al inicio y al final
      .replace(/\s+/g, " ") // Reemplazar múltiples espacios por un solo espacio
      .toUpperCase();
  }

  // Método para limpiar valores de "Tren"
  static cleanTrain(value) {
    if (!value) return "";
    return String(value)
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Eliminar caracteres de control
      .trim() // Eliminar espacios al inicio y al final
      .replace(/\s+/g, "") // Eliminar todos los espacios
      .toUpperCase();
  }

  // Método para leer el primer Excel (resumenFechas)
  static async leerExcel(nombreExcel) {
    console.log(`Leyendo Excel: ${nombreExcel}`);
    const filePath = path.join(__dirname, "../uploads/", nombreExcel);

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe en la ruta: ${filePath}`);
    }

    try {
      const workbook = XLSX.readFile(filePath, { cellDates: true });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("No se encontraron hojas en el workbook");

      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        blankrows: false,
        defval: "",
      });

      console.log("Primeras 5 filas del Excel 1 (crudo):", data.slice(0, 5));

      const processedData = [];
      let currentName = "";
      let currentTrain = "";
      let currentRowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        console.log(`Procesando fila ${i + 1} (crudo):`, row);

        const nameValue = RenfeController.cleanString(row[0]);
        console.log(
          `Fila ${i + 1}: nameValue después de cleanString="${nameValue}"`
        );

        // Detectar un nuevo bloque (como "PUERTOLLANO   - 599")
        if (nameValue && nameValue.includes(" - ")) {
          const normalizedName = nameValue.replace(/\s+-\s+/g, " - ");
          console.log(`Fila ${i + 1}: normalizedName="${normalizedName}"`);
          const parts = normalizedName.split(" - ");
          if (parts.length === 2) {
            currentName = RenfeController.cleanString(parts[0]); // Ej: "PUERTOLLANO"
            currentTrain = RenfeController.cleanTrain(parts[1]); // Ej: "599"
            currentRowIndex = i;
            console.log(
              `Nuevo bloque en fila ${
                i + 1
              }: name="${currentName}", train="${currentTrain}"`
            );
          } else {
            console.log(
              `Fila ${i + 1} ignorada: Formato de nombre inválido: ${nameValue}`
            );
          }
          continue;
        }

        // Si no hay bloque definido, ignorar la fila
        if (!currentName || !currentTrain) {
          console.log(
            `Fila ${i + 1} ignorada: No se ha definido un bloque de nombre/tren`
          );
          continue;
        }

        // Leer la categoría desde la primera columna
        const category = RenfeController.cleanString(row[0]);
        console.log(`Fila ${i + 1}: category="${category}"`);

        // Ignorar filas de total o vacías
        if (category === "TOTAL €") {
          console.log(`Fila ${i + 1} ignorada: Es una fila de TOTAL €`);
          continue;
        }
        if (!category) {
          console.log(`Fila ${i + 1} ignorada: Categoría vacía`);
          continue;
        }

        // Obtener la longitud de la fila actual
        const rowLength = row.length;
        // La antepenúltima columna será rowLength - 3 (ya que el índice empieza en 0)
        const totalColumnIndex = rowLength - 3;
        const totalValue = parseFloat(row[totalColumnIndex]) || 0;
        console.log(
          `Fila ${
            i + 1
          }: totalValue=${totalValue} (índice ${totalColumnIndex}, longitud fila=${rowLength})`
        );

        // Crear la entrada procesada
        const entry = {
          city: currentName,
          code: currentTrain,
          category: category,
          total: totalValue,
          _rowIndex: currentRowIndex,
        };

        console.log(
          `Fila ${
            i + 1
          }: name="${currentName}", train="${currentTrain}", category="${category}", total=${totalValue}`
        );
        processedData.push(entry);
      }

      console.log("Datos procesados del Excel 1:", processedData);
      return processedData;
    } catch (error) {
      console.error(`Error al leer el archivo ${nombreExcel}:`, error.message);
      throw new Error(
        `Error al leer el archivo ${nombreExcel}: ${error.message}`
      );
    }
  }

  // Método para leer el segundo Excel (Fichero Seguimiento)
  static async leerExcel2(nombreExcel) {
    console.log(`Leyendo Excel: ${nombreExcel} con ExcelJS`);
    const filePath = path.join(__dirname, "../uploads/", nombreExcel);
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe en la ruta: ${filePath}`);
    }
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("No se encontraron hojas en el workbook");

      const processedData = [];
      // Asumiendo que las dos primeras filas son encabezados
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) return; // Ignorar encabezados
        const nameCell = row.getCell(RenfeController.COLUMN_INDEXES.NAME + 1);
        const trainCell = row.getCell(RenfeController.COLUMN_INDEXES.TRAIN + 1);
        const nameValue = RenfeController.cleanString(nameCell.value);
        const trainValue = RenfeController.cleanTrain(trainCell.value);
        if (!nameValue || !trainValue) return;
        processedData.push({
          name: nameValue,
          train: trainValue,
          _rowIndex: rowNumber, // Usar rowNumber directamente
        });
      });
      console.log("Datos procesados del Excel 2:", processedData);
      return processedData;
    } catch (error) {
      console.error(
        `Error al leer el archivo ${nombreExcel} con ExcelJS:`,
        error.message
      );
      throw new Error(
        `Error al leer el archivo ${nombreExcel}: ${error.message}`
      );
    }
  }

  // Método principal para procesar y guardar los Excels
  async guardarExcels(req, res) {
    try {
      const fichero1 = req.files["fichero1"]
        ? req.files["fichero1"][0].filename
        : null;
      const fichero2 = req.files["fichero2"]
        ? req.files["fichero2"][0].filename
        : null;

      if (!fichero1 || !fichero2) {
        return res
          .status(400)
          .json({ message: "Se deben subir ambos ficheros" });
      }

      const excelData1 = await RenfeController.leerExcel(fichero1);
      const excelData2 = await RenfeController.leerExcel2(fichero2);

      // Mapa para almacenar las actualizaciones por fila del segundo archivo
      const updatesMap = {};

      // Comparar datos
      for (let i = 0; i < excelData1.length; i++) {
        const city1 = RenfeController.cleanString(excelData1[i].city || "");
        const train1 = RenfeController.cleanTrain(excelData1[i].code || "");
        const category = RenfeController.cleanString(
          excelData1[i].category || ""
        );
        const total = parseFloat(excelData1[i].total) || 0;

        if (!city1 || !train1 || !category) {
          console.log(
            `Excel 1 - Fila ${i + 1} ignorada: city, train o category vacíos`
          );
          continue;
        }

        console.log(
          `Procesando Excel 1 - Fila ${
            i + 1
          }: city="${city1}", train="${train1}", category="${category}", total=${total}`
        );

        // Buscar la fila correspondiente en excelData2
        const matchingRow = excelData2.find(
          (row) => row.name === city1 && row.train === train1
        );

        if (!matchingRow) {
          console.log(
            `No se encontró una fila en Excel 2 para la combinación: ${city1}-${train1}`
          );
          continue;
        }

        const rowIndex = matchingRow._rowIndex;

        console.log(
          `Coincidencia encontrada: ${city1} - Tren: ${train1} - Category: ${category} - Total: ${total} (Fila ${rowIndex})`
        );

        // Inicializar la actualización si no existe
        if (!updatesMap[rowIndex]) {
          updatesMap[rowIndex] = {
            rowIndex: rowIndex,
            name: city1,
            train: train1,
            newValue: 0, // Para "Importe según CARGAS" (columna 31)
            loads: {
              L0: 0,
              LC: 0,
              LN2: 0,
              LN1: 0,
              LCAB: 0,
              LR: 0,
              EV: 0,
              DOT: 0,
              LE: 0,
              LET: 0,
              LF: 0,
              LP: 0,
              LT: 0,
              N1: 0,
              N2: 0,
              N3: 0,
              "Vehículos Taller": 0,
            },
          };
        }

        // Sumar el total a "Importe según CARGAS" (columna 31, índice 32 en Excel)
        updatesMap[rowIndex].newValue += total;

        // Asignar el total a la categoría correspondiente
        if (updatesMap[rowIndex].loads.hasOwnProperty(category)) {
          updatesMap[rowIndex].loads[category] = total;
          console.log(
            `Asignando total ${total} a la categoría ${category} en la fila ${rowIndex}`
          );
        } else {
          console.log(
            `Categoría ${category} no encontrada en COLUMN_LOADS, se ignorará`
          );
        }
      }

      const updates = Object.values(updatesMap);
      console.log("Actualizaciones encontradas:", updates);

      let updatedFilePath = null;
      if (updates.length > 0) {
        const filePath2 = path.join(__dirname, "../uploads/", fichero2);
        updatedFilePath = await RenfeController.actualizarExcel2(
          filePath2,
          updates
        );
      } else {
        console.log("No se encontraron coincidencias para actualizar.");
        return res.status(200).json({
          message: "No se encontraron coincidencias para actualizar.",
          updates: [],
          updatedFile: null,
        });
      }

      // Enviar el archivo modificado como descarga
      res.download(
        updatedFilePath, // Ruta del archivo modificado
        "resultado.xlsx", // Nombre sugerido para el archivo
        (err) => {
          if (err) {
            console.error("Error al enviar el archivo:", err);
            res.status(500).json({ message: "Error al descargar el archivo" });
          }
          // Opcional: Eliminar el archivo temporal después de enviarlo
          // fs.unlinkSync(updatedFilePath);
        }
      );
    } catch (error) {
      console.error("Error al procesar los archivos:", error.message);
      return res.status(500).json({
        message: "Error al procesar los archivos Excel",
        error: error.message,
      });
    }
  }

  // Método para actualizar el segundo Excel con los datos procesados
  static async actualizarExcel2(filePath, updates) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("No se encontraron hojas en el workbook");

      updates.forEach((update) => {
        const rowIndex = update.rowIndex;
        const row = sheet.getRow(rowIndex);

        if (!row) {
          console.error(`Error: La fila ${rowIndex} no existe en la hoja.`);
          return;
        }

        const nameInRow = RenfeController.cleanString(
          row.getCell(RenfeController.COLUMN_INDEXES.NAME + 1).value
        );
        const trainInRow = RenfeController.cleanTrain(
          row.getCell(RenfeController.COLUMN_INDEXES.TRAIN + 1).value
        );

        if (nameInRow !== update.name || trainInRow !== update.train) {
          console.error(
            `Error: La fila ${rowIndex} no coincide: Esperado ${update.name}-${update.train}, Encontrado ${nameInRow}-${trainInRow}`
          );
          return;
        }

        console.log(
          `Actualizando fila ${rowIndex} (NOMBRE: ${nameInRow}, Tren: ${trainInRow})`
        );

        // Actualizar columnas de "CARGAS"
        Object.keys(RenfeController.COLUMN_LOADS).forEach((loadColumn) => {
          const columnIndex = RenfeController.COLUMN_LOADS[loadColumn];
          const cellLoad = sheet.getCell(rowIndex, columnIndex + 1);
          const loadValue = update.loads[loadColumn] || 0;
          cellLoad.value = loadValue === 0 ? "" : loadValue;
        });

        // Actualizar "Importe según CARGAS" (columna 31, índice 32 en Excel)
        const importeCargasCell = sheet.getCell(rowIndex, 32); // Índice 32 = columna 31 + 1
        importeCargasCell.value = update.newValue === 0 ? "" : update.newValue;
      });

      await workbook.xlsx.writeFile(filePath);
      console.log("Archivo Excel actualizado correctamente:", filePath);
      return filePath;
    } catch (error) {
      console.error("Error al actualizar el archivo Excel:", error.message);
      throw new Error(`Error al actualizar el archivo Excel: ${error.message}`);
    }
  }
}

module.exports = new RenfeController();

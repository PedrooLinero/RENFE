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

        // Leer el total desde la columna 33 (índice 32)
        const totalColumnIndex = 32;
        const totalValue = parseFloat(row[totalColumnIndex]) || 0;
        console.log(
          `Fila ${i + 1}: totalValue=${totalValue} (índice ${totalColumnIndex})`
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

      console.log("Fichero 1:", fichero1);
      console.log("Fichero 2:", fichero2);

      if (!fichero1 || !fichero2) {
        return res
          .status(400)
          .json({ message: "Se deben subir ambos ficheros" });
      }

      const excelData1 = await RenfeController.leerExcel(fichero1);
      const excelData2 = await RenfeController.leerExcel2(fichero2);

      console.log("Datos del Excel 1:", excelData1);
      console.log("Datos del Excel 2:", excelData2);

      // Mapa para almacenar las actualizaciones por fila del segundo archivo
      const updatesMap = {};

      // Mapa para mapear combinaciones de NOMBRE y Tren a su rowIndex
      const rowIndexMap = new Map();

      // Construir el mapa de rowIndex para cada combinación de NOMBRE y Tren
      for (let j = 0; j < excelData2.length; j++) {
        const name2 = excelData2[j].name;
        const train2 = excelData2[j].train;
        const rowIndex = excelData2[j]._rowIndex;
        const key = `${name2}-${train2}`;
        rowIndexMap.set(key, rowIndex);
      }

      console.log("Mapa de rowIndex:", Object.fromEntries(rowIndexMap));

      // Comparar datos
      for (let i = 0; i < excelData1.length; i++) {
        const city1 = excelData1[i].city
          ? RenfeController.cleanString(excelData1[i].city)
          : "";
        const train1 = excelData1[i].code
          ? RenfeController.cleanTrain(excelData1[i].code)
          : "";
        const category = excelData1[i].category;
        const total = excelData1[i].total || 0;

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

        // Buscar el rowIndex correspondiente a la combinación city1-train1
        const key = `${city1}-${train1}`;
        const rowIndex = rowIndexMap.get(key);

        if (rowIndex === undefined) {
          console.log(
            `No se encontró una fila en Excel 2 para la combinación: ${city1}-${train1}`
          );
          continue;
        }

        console.log(
          `Coincidencia encontrada: ${city1} - Tren: ${train1} - Category: ${category} - Total: ${total} (Fila ${rowIndex})`
        );

        // Inicializar la actualización si no existe
        if (!updatesMap[rowIndex]) {
          updatesMap[rowIndex] = {
            rowIndex: rowIndex,
            name: city1,
            train: train1,
            newValue: 0, // Para "Importe según CARGAS"
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

        // Sumar el total a "Importe según CARGAS"
        updatesMap[rowIndex].newValue += total;

        // Asignar el total a la categoría correspondiente
        if (updatesMap[rowIndex].loads.hasOwnProperty(category)) {
          updatesMap[rowIndex].loads[category] = total; // Usar asignación directa
          console.log(
            `Asignando total ${total} a la categoría ${category} en la fila ${rowIndex}`
          );
        } else {
          console.log(
            `Categoría ${category} no encontrada en COLUMN_LOADS, se ignorará`
          );
        }
      }

      // Convertir el mapa de actualizaciones a un array
      const updates = Object.values(updatesMap);

      // Depurar el contenido de updates
      console.log("Actualizaciones encontradas:", updates);

      updates.forEach((update, index) => {
        console.log(`Update ${index}:`, {
          rowIndex: update.rowIndex,
          name: update.name,
          train: update.train,
          newValue: update.newValue,
          loads: update.loads,
        });
      });

      // Si hay actualizaciones, modificar el segundo archivo
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

      return res.status(200).json({
        message: "Archivos procesados correctamente",
        updates: updates,
        updatedFile: updatedFilePath ? path.basename(updatedFilePath) : null,
      });
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
      if (!sheet) {
        throw new Error("No se encontraron hojas en el workbook");
      }

      // Solo actualizar las filas que están en updates
      updates.forEach((update) => {
        // Validar que rowIndex sea un número válido
        if (typeof update.rowIndex !== "number" || update.rowIndex < 0) {
          console.error(`Error: rowIndex inválido en update:`, update);
          return; // Saltar este update si rowIndex no es válido
        }

        const rowIndex = update.rowIndex; // _rowIndex ya es el índice real de la fila (basado en 1)

        // Verificar si la fila existe en la hoja
        const row = sheet.getRow(rowIndex);
        if (!row) {
          console.error(`Error: La fila ${rowIndex} no existe en la hoja.`);
          return; // Saltar este update si la fila no existe
        }

        // Leer el nombre y el tren de la fila para validación
        const nameInRow = RenfeController.cleanString(
          row.getCell(RenfeController.COLUMN_INDEXES.NAME + 1).value
        );
        const trainInRow = RenfeController.cleanTrain(
          row.getCell(RenfeController.COLUMN_INDEXES.TRAIN + 1).value
        );

        // Validar que la fila corresponde a la combinación esperada
        if (nameInRow !== update.name || trainInRow !== update.train) {
          console.error(
            `Error: La fila ${rowIndex} no coincide con la combinación esperada. ` +
              `Esperado: NOMBRE=${update.name}, Tren=${update.train}, ` +
              `Encontrado: NOMBRE=${nameInRow}, Tren=${trainInRow}`
          );
          return; // Saltar esta actualización
        }

        console.log(
          `Actualizando fila ${rowIndex} (NOMBRE: ${nameInRow}, Tren: ${trainInRow})`
        );

        // Actualizar las columnas de "CARGAS" (14 a 30)
        Object.keys(RenfeController.COLUMN_LOADS).forEach((loadColumn) => {
          const columnIndex = RenfeController.COLUMN_LOADS[loadColumn];
          // Validar que columnIndex sea un número y esté en el rango correcto
          if (
            typeof columnIndex !== "number" ||
            columnIndex < 14 ||
            columnIndex > 30
          ) {
            console.error(
              `Error: columnIndex inválido para ${loadColumn}:`,
              columnIndex
            );
            return; // Saltar esta columna si el índice no es válido
          }

          // ExcelJS usa columnas basadas en 1, por lo que sumamos 1 al columnIndex
          const cellLoad = sheet.getCell(rowIndex, columnIndex + 1);
          const loadValue =
            update.loads && update.loads[loadColumn] !== undefined
              ? update.loads[loadColumn]
              : 0;

          console.log(
            `Actualizando fila ${rowIndex}, columna ${loadColumn} (índice ${columnIndex}) con valor: ${loadValue}`
          );
          // Asignar la celda: si es 0, ponerla en blanco.
          cellLoad.value = loadValue === 0 ? "" : loadValue;
        });
      });

      // Guardar el archivo sobrescribiendo el original
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

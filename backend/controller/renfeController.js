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
    CODE: 11, // Columna "CÓDIGO"
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
    "Importe CÍCLICAS": 50, // Columna AY (52 en Excel)
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

  // Método para normalizar texto
  static normalizarTexto(texto) {
    if (typeof texto !== "string") return "";
    return texto
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Elimina tildes y diacríticos
      .replace(/\s+/g, " "); // Normaliza espacios múltiples a uno solo
  }

  // Método para leer el primer Excel (resumenFechas)
  static async leerExcel(nombreExcel) {
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

      const processedData = [];
      let currentName = "";
      let currentTrain = "";
      let currentRowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const nameValue = RenfeController.cleanString(row[0]);

        if (nameValue && nameValue.includes(" - ")) {
          const normalizedName = nameValue.replace(/\s+-\s+/g, " - ");
          const parts = normalizedName.split(" - ");
          if (parts.length === 2) {
            currentName = RenfeController.cleanString(parts[0]);
            currentTrain = RenfeController.cleanTrain(parts[1]);
            currentRowIndex = i;
          }
          continue;
        }

        if (!currentName || !currentTrain) {
          continue;
        }

        const category = RenfeController.cleanString(row[0]);

        if (category === "TOTAL €" || !category) {
          continue;
        }

        const rowLength = row.length;
        const totalColumnIndex = rowLength - 3;
        const totalValue = parseFloat(row[totalColumnIndex]) || 0;

        const entry = {
          city: currentName,
          code: currentTrain,
          category: category,
          total: totalValue,
          _rowIndex: currentRowIndex,
        };

        processedData.push(entry);
      }

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
    const filePath = path.join(__dirname, "../uploads/" + nombreExcel);
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe en la ruta: ${filePath}`);
    }
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("No se encontraron hojas en el workbook");

      const processedData = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) return; // Ignorar encabezados
        const codeCell = row.getCell(RenfeController.COLUMN_INDEXES.CODE + 1);
        const nameCell = row.getCell(RenfeController.COLUMN_INDEXES.NAME + 1);
        const trainCell = row.getCell(RenfeController.COLUMN_INDEXES.TRAIN + 1);
        const codeValue = RenfeController.cleanString(codeCell.value);
        const nameValue = RenfeController.cleanString(nameCell.value);
        const trainValue = RenfeController.cleanTrain(trainCell.value);

        processedData.push({
          code: codeValue,
          name: nameValue,
          train: trainValue,
          isEmptyTrain: !trainValue,
          _rowIndex: rowNumber,
        });
      });
      // console.log("Datos de excelData2:", processedData.slice(0, 5)); // Mostrar primeras 5 filas
      return processedData;
    } catch (error) {
      console.error(`Error al leer el archivo ${nombreExcel}:`, error.message);
      throw new Error(
        `Error al leer el archivo ${nombreExcel}: ${error.message}`
      );
    }
  }

  // Método para leer el tercer Excel
  static async leerExcel3(nombreExcel) {
    const filePath = path.join(__dirname, "../uploads/" + nombreExcel);
    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe en la ruta: ${filePath}`);
    }
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("No se encontraron hojas en el workbook");

      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: true,
        blankrows: false,
        defval: "",
      });

      const targetHeaders = [
        "Estación/Dependencia",
        "Código",
        "Recinto",
        "Elemento",
        "Operación",
        "Frecuencia",
        "Sem",
        "Precio",
      ];

      let headerRowIndex = -1;
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const matchesHeaders = targetHeaders.every(
          (header, idx) =>
            String(row[idx] || "")
              .trim()
              .toLowerCase() === header.trim().toLowerCase()
        );
        if (matchesHeaders) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        throw new Error("No se encontró la fila de encabezados esperada");
      }

      let filteredData = data.slice(headerRowIndex + 1);
      filteredData = filteredData.filter((row) =>
        row.some((cell) => cell !== "" && cell !== undefined && cell !== null)
      );

      filteredData = filteredData.slice(0, -3);
      // console.log("Datos de excelData3:", filteredData.slice(0, 5)); // Mostrar primeras 5 filas
      return filteredData;
    } catch (error) {
      console.error(`Error al leer el archivo ${nombreExcel}:`, error.message);
      throw new Error(
        `Error al leer el archivo ${nombreExcel}: ${error.message}`
      );
    }
  }

  // Método para comparar arrays de Excel 3 y Excel 2
  static compararArrays(arrayExcel3, arrayExcel2) {
    const resultados = [];

    for (const excel2 of arrayExcel2) {
      const codigoExcel2 = String(excel2.code).trim();
      const nombreExcel2 = RenfeController.normalizarTexto(excel2.name).trim();

      if (codigoExcel2 === "CDIGO") continue;
      let suma = 0;

      for (const excel3 of arrayExcel3) {
        const codigoExcel3 = String(excel3[1]).trim();
        const nombreExcel3 = RenfeController.normalizarTexto(excel3[0]).trim();

        // console.log(`Comparando: excel2=${nombreExcel2}-${codigoExcel2}, excel3=${nombreExcel3}-${codigoExcel3}`);

        if (codigoExcel2 === codigoExcel3 && nombreExcel2 === nombreExcel3) {
          const precio = parseFloat(excel3[7]) || 0;
          suma += precio;
          // console.log(`Coincidencia: ${nombreExcel2}-${codigoExcel2}, Precio: ${precio}, Suma: ${suma}`);
        }
      }

      if (suma !== 0) {
        resultados.push({
          name: nombreExcel2,
          code: codigoExcel2,
          suma: suma,
        });
      }
    }

    console.log("Resultados de compararArrays:", resultados);
    return resultados;
  }

  // Método principal para procesar y guardar los Excels
  async guardarExcels(req, res) {
    try {
      const fichero1 = req.files["fichero1"]
        ? req.files["fichero1"][0].filename
        : null;
      const fichero2 = "Base.xlsx";
      const fichero3 = req.files["fichero3"]
        ? req.files["fichero3"][0].filename
        : null;

      if (!fichero1 || !fichero3) {
        return res.status(400).json({ message: "Se debe subir el archivo" });
      }

      const excelData1 = await RenfeController.leerExcel(fichero1);
      const excelData2 = await RenfeController.leerExcel2(fichero2);
      const excelData3 = await RenfeController.leerExcel3(fichero3);

      const resultadosComparacion = RenfeController.compararArrays(
        excelData3,
        excelData2
      );

      // console.log("Resultados Comparación (antes de mapeo):", resultadosComparacion);

      // Mapa para almacenar las actualizaciones por fila del segundo archivo
      const updatesMap = {};

      // Procesar resultados de la comparación (excelData3 vs excelData2)
      for (const totalEntry of resultadosComparacion) {
        const code1 = totalEntry.code?.toString().trim();
        const total = totalEntry.suma;
        const name1 = totalEntry.name?.toString().trim();

        const matchingRow = excelData2.find((rowData2) => {
          const code2 = rowData2.code?.toString().trim();
          return code1 === code2;
        });

        if (matchingRow) {
          const rowIndex = matchingRow._rowIndex;
          if (!updatesMap[rowIndex]) {
            updatesMap[rowIndex] = {
              rowIndex: rowIndex,
              name: matchingRow.name,
              train: matchingRow.train,
              importeCiclicas: 0,
            };
          }
          updatesMap[rowIndex].importeCiclicas = total;
          // console.log(`Asignando importeCiclicas=${total} a fila ${rowIndex} (${matchingRow.name}-${matchingRow.train})`);
        } else {
          // console.log(`No se encontró coincidencia para código ${code1} (nombre: ${name1})`);
        }
      }

      // Procesar datos de excelData1 (lógica original)
      for (let i = 0; i < excelData1.length; i++) {
        const city1 = RenfeController.cleanString(excelData1[i].city || "");
        const train1 = RenfeController.cleanTrain(excelData1[i].code || "");
        const category = RenfeController.cleanString(
          excelData1[i].category || ""
        );
        const total = parseFloat(excelData1[i].total) || 0;

        if (!city1 || !train1 || !category) {
          // console.log(
          //   `Excel 1 - Fila ${i + 1} ignorada: city, train o category vacíos`
          // );
          continue;
        }

        const matchingRow = excelData2.find(
          (row) => row.name === city1 && row.train === train1
        );

        if (!matchingRow) {
          // console.log(
          //   `No se encontró una fila en Excel 2 para la combinación: ${city1}-${train1}`
          // );
          continue;
        }

        const rowIndex = matchingRow._rowIndex;

        if (!updatesMap[rowIndex]) {
          updatesMap[rowIndex] = {
            rowIndex: rowIndex,
            name: city1,
            train: train1,
            newValue: 0,
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

        updatesMap[rowIndex].newValue =
          (updatesMap[rowIndex].newValue || 0) + total;

        if (updatesMap[rowIndex].loads.hasOwnProperty(category)) {
          updatesMap[rowIndex].loads[category] = total;
        }
      }

      const updates = Object.values(updatesMap);
      // console.log("Updates para actualizarExcel2:", updates);

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

      res.download(updatedFilePath, "resultado.xlsx", (err) => {
        if (err) console.error("Error al descargar:", err);
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
      if (!sheet) throw new Error("No se encontraron hojas en el workbook");

      updates.forEach((update) => {
        const rowIndex = update.rowIndex;
        const row = sheet.getRow(rowIndex);

        if (!row) {
          console.error(`Error: La fila ${rowIndex} no existe en la hoja.`);
          return;
        }

        // Validar name y train solo si están definidos (para actualizaciones de excelData1)
        if (update.name && update.train) {
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
        }

        // Actualizar columnas de "CARGAS" si existen
        if (update.loads) {
          Object.keys(RenfeController.COLUMN_LOADS).forEach((loadColumn) => {
            if (loadColumn !== "Importe CÍCLICAS") {
              const columnIndex = RenfeController.COLUMN_LOADS[loadColumn];
              const cellLoad = sheet.getCell(rowIndex, columnIndex + 1);
              const loadValue = update.loads[loadColumn] || 0;
              cellLoad.value = loadValue === 0 ? "" : loadValue;
              // console.log(`Escribiendo ${loadColumn}=${loadValue} en fila ${rowIndex}, columna ${columnIndex + 1}`);
            }
          });
        }

        // Actualizar "Importe según CARGAS" (columna 31, índice 32 en Excel)
        if (update.newValue !== undefined) {
          const importeCargasCell = sheet.getCell(rowIndex, 32);
          importeCargasCell.value =
            update.newValue === 0 ? "" : update.newValue;
          // console.log(`Escribiendo Importe según CARGAS=${update.newValue} en fila ${rowIndex}, columna 32`);
        }

        // Actualizar "Importe CÍCLICAS"
        if (update.importeCiclicas !== undefined) {
          const columnIndex = RenfeController.COLUMN_LOADS["Importe CÍCLICAS"];
          const cellCiclicas = sheet.getCell(rowIndex, columnIndex + 1);
          cellCiclicas.value =
            update.importeCiclicas === 0 ? "" : update.importeCiclicas;
          // console.log(`Escribiendo Importe CÍCLICAS=${update.importeCiclicas} en fila ${rowIndex}, columna ${columnIndex + 1} (AY)`);
        }
      });

      const updatedFilePath = filePath.replace(".xlsx", "_updated.xlsx");
      await workbook.xlsx.writeFile(updatedFilePath);
      console.log("Archivo Excel actualizado correctamente:", updatedFilePath);
      return updatedFilePath;
    } catch (error) {
      console.error("Error al actualizar el archivo Excel:", error.message);
      throw new Error(`Error al actualizar el archivo Excel: ${error.message}`);
    }
  }

  async generarPDF(req, res) {
    const { anexo } = req.body;

    console.log("Numero de anexo: " + anexo);

    try {
    } catch (error) {}
  }
}

module.exports = new RenfeController();

// Importar librerías necesarias
const Respuesta = require("../utils/respuesta");
const { logMensaje } = require("../utils/logger.js");
const ExcelJS = require("exceljs");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

class RenfeController {
  // Constantes para índices de columnas del segundo Excel
  static COLUMN_INDEXES = {
    F: 8,
    CODE: 11,
    NAME: 12,
    TRAIN: 13,
    IMP_L0: 31,
    IMP_LC: 32,
    IMP_LN2: 33,
    IMP_LN1: 34,
    IMP_LCAB: 35,
    IMP_LR: 36,
    IMP_EV: 37,
    IMP_DOT: 38,
    IMP_LE: 39,
    IMP_LET: 40,
    IMP_LF: 41,
    IMP_LP: 42,
    IMP_LT: 43,
    IMP_N1: 44,
    IMP_N2: 45,
    IMP_N3: 46,
    IMP_VEHICULOS: 47,
    NUMERO_PEDIDO: 76,
    FACTURA_80: 62,
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
            currentName = parts[0];
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

  static async leerResultado(nombreExcel, numeroF) {
    const filePath = path.join(__dirname, "../uploads/", nombreExcel);

    const excelResumenFechas = path.join(
      __dirname,
      "../uploads/resumenFechas.xls"
    );

    if (!fs.existsSync(filePath)) {
      throw new Error(`El archivo no existe en la ruta: ${filePath}`);
    }

    console.log(numeroF);

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];
      if (!sheet) throw new Error("No se encontraron hojas en el workbook");

      const workbook2 = XLSX.readFile(excelResumenFechas, { cellDates: true });
      const sheetName = workbook2.SheetNames[0];
      if (!sheetName) throw new Error("No se encontraron hojas en el workbook");

      const sheet2 = workbook2.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet2, {
        header: 1,
        raw: false,
        blankrows: false,
        defval: "",
      });

      let currentName = "";
      let currentTrain = "";
      let currentRowIndex = -1;

      const mapaTotal = new Map();

      const processedData = [];
      const processedKeys = new Set(); // Para controlar duplicados

      // Primer bucle: Procesar data para llenar mapaTotal
      for (let i = 1; i < data.length; i++) {
        let fila = data[i];
        const nameValue = fila[0];

        if (nameValue && nameValue.includes(" - ")) {
          const normalizedName = nameValue.replace(/\s+-\s+/g, " - ");
          const parts = normalizedName.split(" - ");
          if (parts.length === 2) {
            currentName = parts[0].trim();
            currentTrain = RenfeController.cleanTrain(parts[1]);
            currentRowIndex = i;
          }
        }

        const category = fila[0];
        const rowLength = fila.length;
        const totalColumnIndex = rowLength - 3;
        const totalValue = parseFloat(fila[totalColumnIndex]);

        if (!isNaN(totalValue)) {
          const clave = `${currentName} - ${currentTrain}`;

          if (!mapaTotal.has(clave)) {
            mapaTotal.set(clave, {});
          }

          const categorias = mapaTotal.get(clave);
          categorias[category] = (categorias[category] || 0) + totalValue;
        }
      }

      // Segundo bucle: Procesar filas de Excel
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber <= 2) return; // Saltar cabeceras

        const fValue = row.getCell(RenfeController.COLUMN_INDEXES.F + 1).value;
        if (fValue !== numeroF) return;

        const excelName = row
          .getCell(RenfeController.COLUMN_INDEXES.NAME + 1)
          .value.trim();
        const excelTrain = RenfeController.cleanTrain(
          row.getCell(RenfeController.COLUMN_INDEXES.TRAIN + 1).value
        );

        const clave = `${excelName} - ${excelTrain}`;

        // Verificar coincidencia y no duplicados
        if (mapaTotal.has(clave) && !processedKeys.has(clave)) {
          const categorias = mapaTotal.get(clave);

          processedData.push({
            f: RenfeController.cleanString(fValue),
            code: RenfeController.cleanString(
              row.getCell(RenfeController.COLUMN_INDEXES.CODE + 1).value
            ),
            name: excelName,
            train: excelTrain,
            L0: categorias.L0 || 0,
            LC: categorias.LC || 0,
            LN2: categorias.LN2 || 0,
            LN1: categorias.LN1 || 0,
            LR: categorias.LR || 0,
            LE: categorias.LE || 0,
            LF: categorias.LF || 0,
            LP: categorias.LP || 0,
            EV: categorias.EV || 0,
            DOT: categorias.DOT || 0,
            IMP_L0: row.getCell(RenfeController.COLUMN_INDEXES.IMP_L0 + 1)
              .value,
            IMP_LC: row.getCell(RenfeController.COLUMN_INDEXES.IMP_LC + 1)
              .value,
            IMP_LN2: row.getCell(RenfeController.COLUMN_INDEXES.IMP_LN2 + 1)
              .value,
            IMP_LN1: row.getCell(RenfeController.COLUMN_INDEXES.IMP_LN1 + 1)
              .value,
            IMP_LCAB: row.getCell(RenfeController.COLUMN_INDEXES.IMP_LCAB + 1)
              .value,
            IMP_LR: row.getCell(RenfeController.COLUMN_INDEXES.IMP_LR + 1)
              .value,
            IMP_EV: row.getCell(RenfeController.COLUMN_INDEXES.IMP_EV + 1)
              .value,
            IMP_DOT: row.getCell(RenfeController.COLUMN_INDEXES.IMP_DOT + 1)
              .value,
            IMP_LE: row.getCell(RenfeController.COLUMN_INDEXES.IMP_LE + 1)
              .value,
            IMP_LET: row.getCell(RenfeController.COLUMN_INDEXES.IMP_LET + 1)
              .value,
            IMP_LF: row.getCell(RenfeController.COLUMN_INDEXES.IMP_LF + 1)
              .value,
            IMP_LP: row.getCell(RenfeController.COLUMN_INDEXES.IMP_LP + 1)
              .value,
            IMP_LT: row.getCell(RenfeController.COLUMN_INDEXES.IMP_LT + 1)
              .value,
            FACTURA_80: row.getCell(
              RenfeController.COLUMN_INDEXES.FACTURA_80 + 1
            ).value,
            NUMERO_PEDIDO: RenfeController.cleanString(
              row.getCell(RenfeController.COLUMN_INDEXES.NUMERO_PEDIDO + 1)
                .value
            ),
          });

          processedKeys.add(clave); // Registrar clave como procesada
        }
      });

      return processedData;
    } catch (error) {
      console.error(`Error al leer el archivo ${nombreExcel}:`, error.message);
      throw new Error(
        `Error al leer el archivo ${nombreExcel}: ${error.message}`
      );
    }
  }

  async generarPDF(req, res) {
    const { anexo } = req.body;

    const resultado = await RenfeController.leerResultado(
      "Base_updated.xlsx",
      anexo
    );

    const opciones = { year: "numeric", month: "long" };
    const fechaFormateada = new Date().toLocaleDateString("es-ES", opciones);

    const imagePath = path.resolve(__dirname, "../public/images/Logo.png");

    let centroActual = "";
    let totalCentro = 0;
    let total = 0;
    let totalFactura80 = 0;
    let codigoCentroActual = "";

    (async () => {
      // Crear HTML con los datos
      let html = `
        <html>
          <head>
            <style>
              * {
                font-family: Arial;
                font-size: 12px;
              }
              table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
              th, td { border: 1px solid black; text-align: left;}
              td {font-size: 12px; padding: 0.1rem;}
              th { background-color: #bdd7ee; padding: 0.2rem;}
              .encabezado {
                display: flex; justify-content: space-between; align-items: center;
              }
              .resaltado {
                background-color: yellow;
                font-style: normal;
              }
              .informacion {
                display: inline-block;
                font-style: oblique;
                font-weight: bold;
                margin-bottom: 0.3rem;
                margin-top: 0.3rem;
              }
              h4 {
                margin-top: 1rem;
                margin-bottom: 0.8rem;
              }
              .totalTren {
                 background-color: #ddebf7;
              }

              .totalCentro {
                text-align: right; background-color: #ededed;
              }

              .totalCentro_datos {
                padding: 4px;
              }

              .datos {
                text-align: right;
              }

              .totales {
                display: flex; flex-direction: row;
              }

              .vacio {
                width: 60%;
              }

              .nombreTotal, .nombreTotal80, .nombreTotal20 {
                font-weight: bold;
                width: 20%;
                border: 1px solid black;
                text-align: center;
                font-style: oblique;
              }

              .nombreTotal {
                background-color: #d9e1f2;
              }

              .nombreTotal80 {
                background-color: #ededed;
              }

              .nombreTotal20 {
                background-color: #f8cbad;
              }

              .total {
                width: 20%;
                text-align: right;
                background-color: #d9e1f2;
                border: 1px solid black;
              }

              .total80 {
                width: 20%;
                text-align: right;
                background-color: #ededed;
                border: 1px solid black;
              }

              .total20 {
                width: 20%;
                text-align: right;
                background-color: #f8cbad;
                border: 1px solid black;
              }
            </style>
          </head>
          <body>
            <div class='encabezado'>
              <p class='informacion'>Nº de pedido <span class='resaltado'>${resultado[0]["NUMERO_PEDIDO"]}</span></p>
              <img src="http://localhost:3000/public/images/logo.svg" style="width: 150px; margin-bottom: 20px;" />
            </div>

            <h4>ANEXO FACTURACION</h4>
            <p class='informacion'>Resumen mensual de operaciones de limpieza</p></br>
            <p class='informacion'>Mes/año | ${fechaFormateada} | <span class='resaltado'>${resultado[0]["f"]}</span></p></br>
            `;
      resultado.forEach((item, index) => {
        let sumaTren = (
          parseFloat(item["L0"] * item["IMP_L0"]) +
          parseFloat(item["LC"] * item["IMP_LC"]) +
          parseFloat(item["LN2"] * item["IMP_LN2"]) +
          parseFloat(item["LN1"] * item["IMP_LN1"]) +
          parseFloat(item["LR"] * item["IMP_LR"]) +
          parseFloat(item["LE"] * item["IMP_LE"]) +
          parseFloat(item["LF"] * item["IMP_LF"]) +
          parseFloat(item["LP"] * item["IMP_LP"]) +
          parseFloat(item["EV"] * item["IMP_EV"]) +
          parseFloat(item["DOT"] * item["IMP_DOT"])
        ).toFixed(2);

        total += parseFloat(sumaTren);

        totalFactura80 += parseFloat(item["FACTURA_80"]);

        // Si es un nuevo centro
        if (codigoCentroActual !== item["code"]) {
          // Si no es el primer elemento, mostrar el total del centro anterior
          if (index > 0) {
            html += `
            <div class="totalCentro">
              <p class='totalCentro_datos'>${centroActual} | <span class='resaltado'>TOTAL CENTRO ${codigoCentroActual} | ${totalCentro.toFixed(
              2
            )}</span></p>
            </div></br>
      `;
          }

          centroActual = item["name"];
          codigoCentroActual = item["code"];
          totalCentro = 0;
        }

        // Sumar al total del centro actual
        totalCentro += parseFloat(sumaTren);

        html += `
        <table>
              <tr>
                <th>CENTRO</th>
                <th>CODIGO dependencia o SERIE tren</th>
                <th>TIPO DE OPERACIÓN</th>
                <th>Nº DE OPERACIONES</th>
                <th>IMPORTE UNITARIO</th>
                <th>IMPORTE TOTAL</th>
              </tr>
              <tr>
                <td>${item["code"]}</td>
                <td>${item["train"]}</td>
                <td>Literal de la operación de limpieza realizada</td>
                <td>Nº de operaciones realizadas</td>
                <td>Importe unitario del tipo de operación realizada</td>
                <td>Nº de operaciones x importe unitario</td>
              </tr>
              <tr>
                <td>${item["name"]}</td>
                <td></td>
                <td>L0</td>
                <td class='datos'>${item["L0"]}</td>
                <td class='datos'>${item["IMP_L0"]}</td>
                <td class='datos'>${parseFloat(
                  (item["L0"] * item["IMP_L0"]).toFixed(2)
                )}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>LC</td>
                <td class='datos'>${item["LC"]}</td>
                <td class='datos'>${item["IMP_LC"]}</td>
                <td class='datos'>${parseFloat(
                  (item["LC"] * item["IMP_LC"]).toFixed(2)
                )}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>LN2</td>
                <td class='datos'>${item["LN2"]}</td>
                <td class='datos'>${item["IMP_LN2"]}</td>
                <td class='datos'>${parseFloat(
                  (item["LN2"] * item["IMP_LN2"]).toFixed(2)
                )}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>LN1</td>
                <td class='datos'>${item["LN1"]}</td>
                <td class='datos'>${item["IMP_LN1"]}</td>
                <td class='datos'>${parseFloat(
                  (item["LN1"] * item["IMP_LN1"]).toFixed(2)
                )}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>LR</td>
                <td class='datos'>${item["LR"]}</td>
                <td class='datos'>${item["IMP_LR"]}</td>
                <td class='datos'>${parseFloat(
                  (item["LR"] * item["IMP_LR"]).toFixed(2)
                )}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>LE</td>
                <td class='datos'>${item["LE"]}</td>
                <td class='datos'>${item["IMP_LE"]}</td>
                <td class='datos'>${parseFloat(
                  (item["LE"] * item["IMP_LE"]).toFixed(2)
                )}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>LF</td>
                <td class='datos'>${item["LF"]}</td>
                <td class='datos'>${item["IMP_LF"]}</td>
                <td class='datos'>${parseFloat(
                  (item["LF"] * item["IMP_LF"]).toFixed(2)
                )}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>LP</td>
                <td class='datos'>${item["LP"]}</td>
                <td class='datos'>${item["IMP_LP"]}</td>
                <td class='datos'>${parseFloat(
                  (item["LP"] * item["IMP_LP"]).toFixed(2)
                )}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>EV</td>
                <td class='datos'>${item["EV"]}</td>
                <td class='datos'>${item["IMP_EV"]}</td>
                <td class='datos'>${parseFloat(
                  (item["EV"] * item["IMP_EV"]).toFixed(2)
                )}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td>DOT</td>
                <td class='datos'>${item["DOT"]}</td>
                <td class='datos'>${item["IMP_DOT"]}</td>
                <td class='datos'>${parseFloat(
                  (item["DOT"] * item["IMP_DOT"]).toFixed(2)
                )}</td>
              </tr>
              <tr class='totalTren'>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td class='datos'>SUBTOTAL SERIE ${item["train"]} del CENTRO ${
          item["name"]
        }</td>
                <td class='datos'>${sumaTren}</td>
              </tr>
          </table></br>
        `;

        // Si es el último elemento, mostrar el total del último centro
        if (index === resultado.length - 1) {
          html += `
            <div class="totalCentro">
              <p class='totalCentro_datos'>${centroActual} | <span class='resaltado'>TOTAL CENTRO ${codigoCentroActual} | ${totalCentro.toFixed(
            2
          )}</span></p>
            </div></br>    
          `;
        }
      });

      html += `
        <div class='totales'>
        <p class='vacio'></p>
        <p class='nombreTotal'>${anexo}</p>
        <p class='total'>${total.toFixed(2)}</p>
        </div>
        <div class='totales'>
        <p class='vacio'></p>
        <p class='nombreTotal80'>FACTURA DEL 80%</p>
        <p class='total80'>${totalFactura80.toFixed(2)}</p>
        </div>
        <div class='totales'>
        <p class='vacio'></p>
        <p class='nombreTotal20'>FACTURA DEL 20%</p>
        <p class='total20'>${(total - totalFactura80).toFixed(2)}</p>
        </div>
      `;

      html += `</body></html>`;

      // Generar PDF
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: true, // Asegúrate de que sea en modo headless (sin interfaz gráfica)
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      // Ruta relativa a la carpeta uploads
      const pdfPath = path.join(__dirname, "../uploads", "archivo.pdf");

      const pdf = await page.pdf({
        path: pdfPath, // Cambiado para usar la nueva ruta
        format: "A4",
        margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
        printBackground: true,
      });

      await browser.close();
      console.log(`PDF generado con Puppeteer y guardado en: ${pdfPath}`);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=archivo.pdf");
      res.send(pdf);
    })();

    try {
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al generar PDF");
    }
  }
}

module.exports = new RenfeController();

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
    CODE: 11,
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
    "Importe CÍCLICAS": 51,
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
    // console.log(`Leyendo Excel: ${nombreExcel}`);
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
        // console.log(`Procesando fila ${i + 1} (crudo):`, row);

        const nameValue = RenfeController.cleanString(row[0]);
        // console.log(
        //   `Fila ${i + 1}: nameValue después de cleanString="${nameValue}"`
        // );

        // Detectar un nuevo bloque (como "PUERTOLLANO   - 599")
        if (nameValue && nameValue.includes(" - ")) {
          const normalizedName = nameValue.replace(/\s+-\s+/g, " - ");
          // console.log(`Fila ${i + 1}: normalizedName="${normalizedName}"`);
          const parts = normalizedName.split(" - ");
          if (parts.length === 2) {
            currentName = RenfeController.cleanString(parts[0]); // Ej: "PUERTOLLANO"
            currentTrain = RenfeController.cleanTrain(parts[1]); // Ej: "599"
            currentRowIndex = i;
            // console.log(
            //   `Nuevo bloque en fila ${
            //     i + 1
            //   }: name="${currentName}", train="${currentTrain}"`
            // );
          } else {
            // console.log(
            //   `Fila ${i + 1} ignorada: Formato de nombre inválido: ${nameValue}`
            // );
          }
          continue;
        }

        // Si no hay bloque definido, ignorar la fila
        if (!currentName || !currentTrain) {
          // console.log(
          //   `Fila ${i + 1} ignorada: No se ha definido un bloque de nombre/tren`
          // );
          continue;
        }

        // Leer la categoría desde la primera columna
        const category = RenfeController.cleanString(row[0]);
        // console.log(`Fila ${i + 1}: category="${category}"`);

        // Ignorar filas de total o vacías
        if (category === "TOTAL €") {
          // console.log(`Fila ${i + 1} ignorada: Es una fila de TOTAL €`);
          continue;
        }
        if (!category) {
          // console.log(`Fila ${i + 1} ignorada: Categoría vacía`);
          continue;
        }

        // Obtener la longitud de la fila actual
        const rowLength = row.length;
        // La antepenúltima columna será rowLength - 3 (ya que el índice empieza en 0)
        const totalColumnIndex = rowLength - 3;
        const totalValue = parseFloat(row[totalColumnIndex]) || 0;
        // console.log(
        //   `Fila ${
        //     i + 1
        //   }: totalValue=${totalValue} (índice ${totalColumnIndex}, longitud fila=${rowLength})`
        // );

        // Crear la entrada procesada
        const entry = {
          city: currentName,
          code: currentTrain,
          category: category,
          total: totalValue,
          _rowIndex: currentRowIndex,
        };

        // console.log(
        //   `Fila ${
        //     i + 1
        //   }: name="${currentName}", train="${currentTrain}", category="${category}", total=${totalValue}`
        // );
        processedData.push(entry);
      }

      // console.log("Datos procesados del Excel 1:", processedData);
      return processedData;
    } catch (error) {
      console.error(`Error al leer el archivo ${nombreExcel}:`, error.message);
      throw new Error(
        `Error al leer el archivo ${nombreExcel}: ${error.message}`
      );
    }
  }

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

        // Incluir todos los registros, marcando si el tren está vacío
        processedData.push({
          code: codeValue,
          name: nameValue,
          train: trainValue,
          isEmptyTrain: !trainValue, // Nuevo campo booleano
          _rowIndex: rowNumber,
        });
      });

      return processedData;
    } catch (error) {
      console.error(`Error al leer el archivo ${nombreExcel}:`, error.message);
      throw new Error(
        `Error al leer el archivo ${nombreExcel}: ${error.message}`
      );
    }
  }

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

      // Buscar la fila que contiene los encabezados esperados
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
        // Verificar si la fila actual coincide con los encabezados esperados
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

      // Cortar desde la fila de encabezados + 1 (para incluir los datos siguientes)
      let filteredData = data.slice(headerRowIndex + 1);

      // Eliminar filas vacías o que no tengan datos relevantes
      filteredData = filteredData.filter((row) =>
        row.some((cell) => cell !== "" && cell !== undefined && cell !== null)
      );

      // Eliminar las 2 últimas filas (totales y firmas)
      filteredData = filteredData.slice(0, -3);

      return filteredData;
    } catch (error) {
      console.error(`Error al leer el archivo ${nombreExcel}:`, error.message);
      throw new Error(
        `Error al leer el archivo ${nombreExcel}: ${error.message}`
      );
    }
  }

  static normalizarTexto(texto) {
    if (typeof texto !== "string") return "";

    return texto
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Elimina tildes y diacríticos
      .replace(/\s+/g, " "); // Normaliza espacios múltiples a uno solo
  }

  static compararArrays(arrayExcel3, arrayExcel2) {
    const resultados = [];

    for (const excel2 of arrayExcel2) {
      const codigoExcel2 = String(excel2.code).trim(); // Asegurar que es string
      const nombreExcel2 = RenfeController.normalizarTexto(excel2.name).trim();

      if (codigoExcel2 === "CDIGO") continue;
      let suma = 0;

      for (const excel3 of arrayExcel3) {
        const codigoExcel3 = String(excel3[1]).trim(); // Asegurar que es string
        const nombreExcel3 = RenfeController.normalizarTexto(excel3[0]).trim();

        if (codigoExcel2 === codigoExcel3 && nombreExcel2 === nombreExcel3) {
          console.log(parseFloat(excel3[7]));
          
          suma += parseFloat(excel3[7]) || 0; // Sumar el valor de la columna 7 (índice 6)
          // console.log(
          //   "Coincidencia de codigo encontrado:",
          //   codigoExcel2 + " " + nombreExcel2
          // );
        }
      }

      if (suma != 0) {
        resultados.push({
          name: nombreExcel2,
          code: codigoExcel2,
          suma: suma,
        });
      }
    }

    return resultados;
  }

  
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
        return res
          .status(400)
          .json({ message: "Se debe subir el archivo" });
      }

      const excelData1 = await RenfeController.leerExcel(fichero1);
      const excelData2 = await RenfeController.leerExcel2(fichero2);
      const excelData3 = await RenfeController.leerExcel3(fichero3);

      const resultadosComparacion = RenfeController.compararArrays(
        excelData3,
        excelData2
      );

      console.log("Resultados de la comparación:", resultadosComparacion);

      // Obtener los totales usando el método existente
      // console.log(
      //   "Contenido de totalsData:",
      //   JSON.stringify(resultadosComparacion, null, 2)
      // );

      // Mapa para almacenar las actualizaciones por fila del segundo archivo
      const updatesMap = {};

      // Nueva lógica: Comparar totalsData con excelData2 y actualizar Importe CÍCLICAS
      // Nueva lógica: Comparar totalsData con excelData2 y actualizar Importe CÍCLICAS
      for (const totalEntry of resultadosComparacion) {
        const code1 = totalEntry.code?.toString().trim();
        const total = totalEntry.suma; // Ajustado según la propiedad real

        // Buscar una coincidencia en excelData2 basada solo en código
        const matchingRow = excelData2.find((rowData2) => {
          const code2 = rowData2.code?.toString().trim();
          return code1 === code2; // Solo comparar el código (temporalmente)
        });

        // Si hay coincidencia, preparar la actualización
        if (matchingRow) {
          const rowIndex = matchingRow._rowIndex - 1; // Restar 2 para corregir el desplazamiento

          // Inicializar updatesMap[rowIndex] si no existe
          if (!updatesMap[rowIndex]) {
            updatesMap[rowIndex] = {
              rowIndex: rowIndex,
            };
          }

          // Asignar el valor de total a importeCiclicas
          updatesMap[rowIndex].importeCiclicas = total;

          // Depuración: Mostrar la asignación
          // console.log(`Coincidencia encontrada para código ${code1}:`);
          // console.log(`  Fila en excelData2: ${rowIndex + 1}`);
          // console.log(
          //   `  Importe CÍCLICAS: ${updatesMap[rowIndex].importeCiclicas}`
          // );
        } else {
          console.log(`No se encontró coincidencia para código ${code1}`);
        }
      }

      // Comparar datos (lógica original, sin cambios)
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

        // console.log(
        //   `Procesando Excel 1 - Fila ${
        //     i + 1
        //   }: city="${city1}", train="${train1}", category="${category}", total=${total}`
        // );

        // Buscar la fila correspondiente en excelData2
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

        // console.log(
        //   `Coincidencia encontrada: ${city1} - Tren: ${train1} - Category: ${category} - Total: ${total} (Fila ${rowIndex})`
        // );

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
          // console.log(
          //   `Asignando total ${total} a la categoría ${category} en la fila ${rowIndex}`
          // );
        } else {
          // console.log(
          //   `Categoría ${category} no encontrada en COLUMN_LOADS, se ignorará`
          // );
        }
      }

      const updates = Object.values(updatesMap);
      // console.log("Actualizaciones encontradas:", updates);

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
        updatedFilePath,
        "resultado.xlsx", // Nombre sugerido (el usuario puede cambiarlo en la ventana de guardado)
        (err) => {
          if (err) console.error("Error al descargar:", err);
          // Eliminar archivos temporales si es necesario
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

  
  static async actualizarExcel2(filePath, updates) {
    const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);

    // console.log(`Total de updates a procesar: ${updates.length}`);
    // console.log(
    //   `COLUMN_LOADS["Importe CÍCLICAS"]: ${RenfeController.COLUMN_LOADS["Importe CÍCLICAS"]}`
    // ); // Debería ser 51

    for (const update of updates) {
      // console.log(
      //   `Procesando update para fila ${update.rowIndex + 1}:`,
      //   JSON.stringify(update, null, 2)
      // );

      const row = worksheet.getRow(update.rowIndex + 1);

      // Actualizar "Importe CÍCLICAS" (columna 51, AY)
      if (update.importeCiclicas !== undefined) {
        const columnIndex = RenfeController.COLUMN_LOADS["Importe CÍCLICAS"];
        // console.log(
        //   `Valor de importeCiclicas para la fila ${update.rowIndex + 1}: ${
        //     update.importeCiclicas
        //   }`
        // );
        row.getCell(columnIndex).value = update.importeCiclicas;
        // console.log(
        //   `Escribiendo ${
        //     update.importeCiclicas
        //   } en la columna ${columnIndex} (Importe CÍCLICAS) de la fila ${
        //     update.rowIndex + 1
        //   }`
        // );
        const writtenValue = row.getCell(columnIndex).value;
        // console.log(
        //   `Valor escrito en la celda (columna ${columnIndex}, fila ${
        //     update.rowIndex + 1
        //   }): ${writtenValue}`
        // );
      }

      row.commit();
    }

    const updatedFilePath = filePath.replace(".xlsx", "_updated.xlsx");
    await workbook.xlsx.writeFile(updatedFilePath);
    console.log(`Archivo guardado en: ${updatedFilePath}`);

    return updatedFilePath;
  }
}

module.exports = new RenfeController();

import React, { useState } from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
} from "@mui/material";
import { apiUrl } from "../config"; // Ajusta la ruta según la estructura de tu proyecto

function CargarArchivos() {
  const [formData, setFormData] = useState({
    fichero1: null,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    if (formData.fichero1) {
      formDataToSend.append("fichero1", formData.fichero1);
    }

    try {
      const response = await fetch(apiUrl + "/datos", {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });

      // Verificar tipo de contenido
      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en la solicitud");
      }

      if (contentType.includes("application/json")) {
        // Caso sin actualizaciones
        const data = await response.json();
        setDialogOpen(true);
        setDialogMessage(data.message);
      } else {
        // Mostrar diálogo con "Guardando Archivo" mientras se procesa
        setDialogOpen(true);
        setDialogMessage("Procesando...");

        const blob = await response.blob();

        // Intentar usar showSaveFilePicker si está disponible
        if (window.showSaveFilePicker) {
          const suggestedName = "resultado.xlsx"; // Nombre sugerido por defecto
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: suggestedName,
            types: [
              {
                description: "Archivo Excel",
                accept: {
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    [".xlsx"],
                },
              },
            ],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          setDialogMessage("Archivo guardado con éxito");
        } else {
          // Respaldo para navegadores sin soporte a showSaveFilePicker
          const defaultName = "resultado.xlsx";
          const userFileName = prompt(
            "Introduce el nombre del archivo (incluye .xlsx):",
            defaultName
          );
          const fileName =
            userFileName && userFileName.trim() ? userFileName : defaultName;

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          setDialogMessage("Archivo guardado con éxito");
        }
      }
    } catch (error) {
      setDialogOpen(true);
      setDialogMessage(
        error.message || "Error de red. Inténtalo de nuevo más tarde."
      );
    }
  };

  const handleFileChange1 = (e) => {
    setFormData({ ...formData, fichero1: e.target.files[0] });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Box sx={{ height: "72vh" }}>
        <Typography variant="h4" align="center" sx={{ margin: 3 }}>
          Insertar archivos
        </Typography>

        <Paper sx={{ padding: 4, boxShadow: 3 }}>
          <Box
            component="form"
            sx={{ "& > :not(style)": { m: 1, width: "100%" } }}
            noValidate
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <Grid container spacing={3}>
              {/* Fichero 1 */}
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ fontWeight: "700" }}
                >
                  Archivo ResumenFechas:
                </Typography>
                <TextField
                  id="fichero1"
                  variant="outlined"
                  type="file"
                  fullWidth
                  onChange={handleFileChange1}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  required
                />
              </Grid>

              <Box
                sx={{ display: "flex", justifyContent: "left", marginLeft: 1 }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  sx={{ marginTop: 2, marginLeft: 3 }}
                >
                  Actualizar Plantilla
                </Button>
              </Box>
            </Grid>
          </Box>
        </Paper>
      </Box>

      {/* Diálogo para mostrar mensajes */}
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Guardando Archivo</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialogMessage}</DialogContentText>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CargarArchivos;

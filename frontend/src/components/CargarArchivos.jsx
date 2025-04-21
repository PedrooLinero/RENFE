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
  IconButton,
  styled,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save"; // Ícono para el título del modal
import CloseIcon from "@mui/icons-material/Close"; // Ícono para cerrar el modal
import { apiUrl } from "../config"; // Ajusta la ruta según la estructura de tu proyecto

// Definimos StyledPaper con un tamaño más grande
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
  background: "linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)",
  width: "100%",
}));

// Definimos StyledButton con color rojo
const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: "8px",
  padding: theme.spacing(1.5, 4),
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "0 2px 10px rgba(211, 47, 47, 0.3)",
  backgroundColor: "#d32f2f",
  "&:hover": {
    boxShadow: "0 4px 15px rgba(211, 47, 47, 0.5)",
    backgroundColor: "#b71c1c",
  },
}));

// Definimos un StyledDialog para el modal
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.98)", // Fondo blanco con ligera transparencia
    padding: theme.spacing(2),
    animation: "fadeIn 0.3s ease-in-out", // Animación de entrada
  },
  "@keyframes fadeIn": {
    "0%": {
      opacity: 0,
      transform: "scale(0.95)",
    },
    "100%": {
      opacity: 1,
      transform: "scale(1)",
    },
  },
}));

function CargarArchivos() {
  const [formData, setFormData] = useState({
    fichero1: null,
    fichero3: null,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    if (formData.fichero1 && formData.fichero3) {
      formDataToSend.append("fichero1", formData.fichero1);
      formDataToSend.append("fichero3", formData.fichero3);
    }

    try {
      const response = await fetch(apiUrl + "/datos", {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error en la solicitud");
      }

      if (contentType.includes("application/json")) {
        const data = await response.json();
        setDialogOpen(true);
        setDialogMessage(data.message);
      } else {
        setDialogOpen(true);
        setDialogMessage("Procesando...");

        const blob = await response.blob();

        if (window.showSaveFilePicker) {
          const suggestedName = "resultado.xlsx";
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

  const handleFileChange2 = (e) => {
    setFormData({ ...formData, fichero3: e.target.files[0] });
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Box
        sx={{
          height: "72vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "800px" }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              marginBottom: 4,
              fontWeight: 700,
              color: "#d32f2f",
              letterSpacing: "0.5px",
            }}
          >
            Cargar y Actualizar Datos
          </Typography>

          <StyledPaper elevation={3}>
            <Box
              component="form"
              sx={{ width: "100%" }}
              noValidate
              autoComplete="off"
              onSubmit={handleSubmit}
            >
              <Grid container spacing={3} justifyContent="center">
                {/* Fichero 1 */}
                <Grid item xs={12} sm={8} md={6}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        color: "#424242",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                      }}
                    >
                      <CloudUploadIcon sx={{ mr: 1, color: "#d32f2f" }} />
                      Archivo ResumenFechas
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
                      sx={{
                        width: "100%",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                          width: "100%",
                          "& fieldset": {
                            borderColor: "#d32f2f",
                          },
                          "&:hover fieldset": {
                            borderColor: "#b71c1c",
                          },
                        },
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      marginTop: 2,
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        color: "#424242",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                      }}
                    >
                      <CloudUploadIcon sx={{ mr: 1, color: "#d32f2f" }} />
                      Archivo Cíclicas
                    </Typography>
                    <TextField
                      id="fichero3"
                      variant="outlined"
                      type="file"
                      fullWidth
                      onChange={handleFileChange2}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      required
                      sx={{
                        width: "100%",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "8px",
                          backgroundColor: "#fff",
                          width: "100%",
                          "& fieldset": {
                            borderColor: "#d32f2f",
                          },
                          "&:hover fieldset": {
                            borderColor: "#b71c1c",
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    mt: 2,
                  }}
                >
                  <StyledButton
                    variant="contained"
                    type="submit"
                    startIcon={<CloudUploadIcon />}
                  >
                    Actualizar Plantilla
                  </StyledButton>
                </Box>
              </Grid>
            </Box>
          </StyledPaper>
        </Box>
      </Box>

      {/* Diálogo para mostrar mensajes */}
      <StyledDialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#d32f2f",
            fontWeight: 600,
            borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
            pb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <SaveIcon sx={{ mr: 1, color: "#d32f2f" }} />
            Guardando Archivo
          </Box>
          <IconButton onClick={handleDialogClose} sx={{ color: "#d32f2f" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText
            sx={{
              color: "#424242",
              fontSize: "1.1rem",
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {dialogMessage}
          </DialogContentText>
        </DialogContent>
      </StyledDialog>
    </>
  );
}

export default CargarArchivos;

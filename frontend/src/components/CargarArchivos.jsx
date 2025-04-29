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
  FormControl,
  MenuItem,
  Select,
  InputLabel,
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
  const [formData2, setFormData2] = useState({ anexo: "" });

  let listaF = [
    "F003",
    "F007",
    "F008",
    "F020",
    "F024",
    "F097",
    "F110",
    "F113",
    "F130",
    "F141",
    "F142",
    "F143",
    "F144",
    "F145",
    "F147",
    "F148",
    "F149",
    "F150",
    "F151",
    "F152",
    "F153",
    "F154",
    "F165",
    "F166",
    "F167",
    "F187",
    "F188",
    "F189",
    "F190",
    "F194",
    "F199",
    "F230",
    "F233",
    "F234",
    "F243",
    "F244",
    "F248",
    "F287",
    "F288",
    "F305",
    "F306",
    "F307",
    "F309",
    "F310",
    "F311",
    "F312",
    "F313",
    "F314",
    "F315",
    "F316",
    "F318",
    "F319",
    "F320",
    "F331",
    "F332",
    "F355",
    "F365",
    "F508",
  ];

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

  const handleSubmit1 = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(apiUrl + "/datos/descargar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData2),
      });

      if (response.ok) {
        // Obtener el blob del PDF

        setDialogOpen(true);
        setDialogMessage("Procesando...");

        const blob = await response.blob();

        if (window.showSaveFilePicker) {
          const suggestedName = "archivo.pdf";
          const fileHandle = await window.showSaveFilePicker({
            suggestedName: suggestedName,
            types: [
              {
                description: "Archivo Excel",
                accept: {
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                    [".pdf"],
                },
              },
            ],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          setDialogMessage("Archivo guardado con éxito");
        } else {
          const defaultName = "archivo.pdf";
          const userFileName = prompt(
            "Introduce el nombre del archivo (incluye .pdf):",
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
      } else {
        const data = await response.json();
        alert(data.mensaje || "Error al generar el PDF");
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData2({ ...formData2, [name]: value });
  };

  return (
    <>
      <Box
        sx={{
          marginTop: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "1000px" }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              marginBottom: 2,
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
              <Box
                sx={{
                  display: "flex",
                  flexDirection: {xs: "column", lg: "row"},
                  gap: "1rem",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
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
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                  mt: 3,
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
            </Box>
          </StyledPaper>
        </Box>

        {/* Seleccionable para las facturas */}
        <Box sx={{ width: "100%", maxWidth: "1000px", margin: "1.5rem" }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              marginBottom: 2,
              fontWeight: 700,
              color: "#d32f2f",
              letterSpacing: "0.5px",
            }}
          >
            Descargar Anexo de Factura
          </Typography>

          <StyledPaper elevation={3}>
            <Box
              component="form"
              sx={{ width: "100%" }}
              noValidate
              autoComplete="off"
              onSubmit={handleSubmit1}
            >
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
                    width: "100%",
                    marginBottom: "1rem",
                  }}
                >
                  <CloudUploadIcon sx={{ mr: 1, color: "#d32f2f" }} />
                  Selecciona un anexo de factura
                </Typography>
                <FormControl fullWidth>
                  <Select
                    id="select-anexo"
                    name="anexo"
                    value={formData2.anexo}
                    onChange={handleChange}
                    fullWidth
                    required
                  >
                    {listaF.map((tipo) => (
                      <MenuItem value={tipo}>{tipo}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

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
                  Descargar anexo
                </StyledButton>
              </Box>
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

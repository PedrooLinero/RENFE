// Importar libreria para manejo de ficheros de configuración dependiendo de la variable de entorno NODE_ENV
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

// Importar fichero de configuración con variables de entorno
const config = require("./config/config");
// Importar librería express --> web server
const express = require("express");
// Importar librería path, para manejar rutas de ficheros en el servidor
const path = require("path");
// Importar libreria CORS
const cors = require("cors");

// Importar gestores de rutas
const renfeRoutes = require("./routes/renfeRoutes");

// Importar gestores de rutas
const app = express();

// Configurar middleware para analizar JSON en las solicitudes
app.use(express.json());

// Configurar CORS para admitir cualquier origen
app.use(cors()); // No permitite el envío de cookies en una API pública

if (process.env.NODE_ENV !== "production") {
  // Configurar CORS para admitir el origen del frontend en desarrollo
  app.use(
    cors({
      origin: "http://localhost:5173", // Permitir el frontend en desarrollo de React
      credentials: true, // Permitir envío de cookies
    })
  );
}

// Configurar rutas de la API Rest
app.use("/api/datos", renfeRoutes);
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));


//Ruta para manejar las solicitudes al archivo index.html

// app.get('/', (req, res) => {
if (process.env.NODE_ENV !== "production") {
  console.log("Sirviendo ficheros de desarrollo");
  // Configurar el middleware para servir archivos estáticos desde el directorio public/dev en desarrollo
  app.use(express.static(path.join(__dirname, "public/dev")));

//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "public/dev", "index.html"));
//   });
} else {
  console.log("Sirviendo ficheros de producción");
  // Configurar el middleware para servir archivos estáticos desde el directorio public/dev en producción
  app.use(express.static(path.join(__dirname, "public/prod")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public/prod", "index.html"));
  });
}

// Iniciar el servidor solo si no estamos en modo de prueba
// en modo de prueba, el servidor se inicia en el archivo de prueba
if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`Servidor escuchando en el puerto ${config.port}`);
  });
}

// Exportamos la aplicación para poder hacer pruebas
module.exports = app;

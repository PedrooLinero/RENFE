// Importar libreria para manejo de ficheros de configuración dependiendo de la variable de entorno NODE_ENV
require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

module.exports = {
  port: process.env.PORT || 3000,
  secretKey: process.env.SECRET_KEY || "default_secret",
};

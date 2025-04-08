import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";

import Container from "@mui/material/Container";


import logo_acciona_sin_fondo from "../assets/logo_acciona_sin_fondo.png";

function ResponsiveAppBar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  return (
    <>
      
        <AppBar
          position="static"
          sx={{ backgroundColor: "#ff0000", padding: 1 }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters>
              {/* Imagen personalizada */}
              <Box sx={{ display: { xs: "none", md: "flex" }, mr: 1 }}>
                <img src={logo_acciona_sin_fondo} height="70" alt="Acciona" />
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
    </>
  );
}

export default ResponsiveAppBar;

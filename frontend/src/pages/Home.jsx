import { Outlet } from "react-router";
import Menu from "../components/Menu";
import CargarArchivos from "../components/CargarArchivos";
import React from "react";

function Home() {
  return (
    <>
      <Menu />
      <CargarArchivos />
      <Outlet />
    </>
  );
}

export default Home;

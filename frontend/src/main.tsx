import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ItemsApp } from "./app/app/items-app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ItemsApp />
  </StrictMode>,
);

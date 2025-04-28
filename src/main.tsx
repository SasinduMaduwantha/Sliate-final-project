import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import RouterComponent from "./router"; // Import RouterComponent

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterComponent /> {/* Render the RouterComponent that contains routing logic */}
  </StrictMode>
);

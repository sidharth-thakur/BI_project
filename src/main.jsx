import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

import "./styles/variables.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/responsive.css";
import "./styles/pages.css";
import "./styles/quotations.css";
import "./styles/po.css";
import "./styles/crm.css";
import "./styles/admin.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

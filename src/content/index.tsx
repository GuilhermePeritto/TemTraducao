import React from "react";
import ReactDOM from "react-dom/client";
import { InlineTranslationApp } from "@/features/content/InlineTranslationApp";

import contentStyles from "./style.css?inline";

const container = document.createElement("div");
container.id = "traduzir-selecao-root";
document.documentElement.appendChild(container);

const shadowRoot = container.attachShadow({ mode: "open" });
const styleTag = document.createElement("style");
styleTag.textContent = contentStyles;
shadowRoot.appendChild(styleTag);

const mountPoint = document.createElement("div");
shadowRoot.appendChild(mountPoint);

const root = ReactDOM.createRoot(mountPoint);
root.render(
  <React.StrictMode>
    <InlineTranslationApp container={container} />
  </React.StrictMode>,
);

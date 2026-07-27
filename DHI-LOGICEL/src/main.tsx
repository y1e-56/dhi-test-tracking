import Clarity from "@microsoft/clarity";

const origRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function (child) {
  if (child.parentNode !== this) return child;
  return origRemoveChild.call(this, child);
};

import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

Clarity.init("xszwj7abht");

createRoot(document.getElementById("root")!).render(<App />);
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/toaster";

// Global error handler to catch runtime errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent the error from being displayed as "Script error"
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the error from being displayed as "Script error"
  event.preventDefault();
});

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <Toaster />
  </>
);

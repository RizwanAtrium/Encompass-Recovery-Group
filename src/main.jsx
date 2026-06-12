import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <iframe
        title="Encompass Recovery Group"
        src="/snapshot.html?v=quadrants-hover-5"
        className="block h-full w-full border-0"
      />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

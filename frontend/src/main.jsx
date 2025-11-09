// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SkillProvider } from "./context/SkillContext";
import { StudentProvider } from "./context/StudentContext"; // ✅ Import this
import "./styles/company.css";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SkillProvider>
      <StudentProvider> {/* ✅ Wrap StudentProvider around App */}
        <App />
      </StudentProvider>
    </SkillProvider>
  </StrictMode>
);

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add global styles for monospace font in script code blocks
const style = document.createElement('style');
style.textContent = `
  .script-code {
    font-family: Consolas, Monaco, 'Courier New', monospace;
  }
  
  @keyframes modalOpen {
    from {
      opacity: 0;
      transform: translateY(-50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .modal-animation {
    animation: modalOpen 0.3s ease-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }
  
  .animate-slide-up {
    animation: slideUp 0.5s ease-out;
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);

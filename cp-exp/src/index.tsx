import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// createRoot를 사용하여 root를 생성합니다.
const container = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(container);

// React.StrictMode를 사용하여 App 컴포넌트를 렌더링합니다.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 성능 측정을 위해 reportWebVitals를 호출합니다.
reportWebVitals();

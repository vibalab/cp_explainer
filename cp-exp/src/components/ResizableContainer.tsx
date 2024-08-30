import React, { useState, useRef, useEffect } from "react";
import Root from "./graphRoot";
import OverveiwPanel from "./OverviewPanel";
import Accordion from "./Accordion";

const ResizableContainer: React.FC = () => {
  const [leftWidthPercentage, setLeftWidthPercentage] = useState<number>(75);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState<boolean>(true);

  const [showOverview, setShowOverview] = useState({
    overview1: true,
    overview2: false,
    overview3: false,
    overview4: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent) => {
    const container = document.querySelector("#resizable-container");
    if (container) {
      const containerWidth = container.clientWidth;
      const newLeftWidthPercentage = (e.clientX / containerWidth) * 100;
      if (newLeftWidthPercentage > 5 && newLeftWidthPercentage < 95) {
        setLeftWidthPercentage(newLeftWidthPercentage);
      }
    }
  };

  const handleMouseUp = () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = () => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const toggleRightPanel = () => {
    setIsRightPanelVisible((prev) => !prev);
  };

  const toggleOverview = (overview: keyof typeof showOverview) => {
    setShowOverview((prev) => ({
      ...prev,
      [overview]: !prev[overview],
    }));
  };

  return (
    <div
      id="resizable-container"
      style={{ display: "flex", height: "100vh", width: "100%" }}
    >
      <div
        style={{
          flexBasis: isRightPanelVisible ? `${leftWidthPercentage}%` : "100%", // 우측 패널이 없으면 좌측 패널이 전체를 차지
          padding: "10px",
        }}
      >
        <button onClick={toggleRightPanel}>
          {isRightPanelVisible ? "Hide Right Panel" : "Show Right Panel"}
        </button>
        <Root />
      </div>
      {isRightPanelVisible && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: "5px",
            cursor: "col-resize",
            backgroundColor: "#ccc",
            userSelect: "none",
          }}
        />
      )}
      {isRightPanelVisible && (
        <div
          ref={containerRef}
          style={{
            flexBasis: `${100 - leftWidthPercentage}%`,
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            height: "100%",
            overflowY: "auto", // 스크롤을 추가
          }}
        >
          {/* 오버뷰 토글 버튼들 */}
          <div
            style={{
              marginBottom: "0px",
              position: "sticky",
              top: 0,
              backgroundColor: "#fff",
              zIndex: 1,
              padding: "0px",
            }}
          >
            <button onClick={() => toggleOverview("overview1")}>
              Graph Overview Stats
            </button>
            <button onClick={() => toggleOverview("overview2")}>
              Overview 2
            </button>
            <button onClick={() => toggleOverview("overview3")}>
              Overview 3
            </button>
            <button onClick={() => toggleOverview("overview4")}>
              Overview 4
            </button>
          </div>

          {/* 오버뷰들 */}
          {showOverview.overview1 && (
            <div style={{ flexShrink: 0 }}>
              <OverveiwPanel />
            </div>
          )}

          {showOverview.overview2 && (
            <div style={{ flexShrink: 0 }}>
              <OverveiwPanel />
            </div>
          )}

          {showOverview.overview3 && (
            <div style={{ flexShrink: 0 }}>
              <OverveiwPanel />
            </div>
          )}

          {showOverview.overview4 && (
            <div style={{ flexShrink: 0 }}>
              <OverveiwPanel />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ResizableContainer;

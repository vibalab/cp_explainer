import React, { useState, useRef } from "react";
import Root from "./graphRoot";
import OverveiwPanel from "./OverviewPanel";
import Accordion from "./Accordion";
import AdjacencyMatrix from "./AdjacencyPanel";

const ResizableContainer: React.FC = () => {
  const [leftWidthPercentage, setLeftWidthPercentage] = useState<number>(75);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState<boolean>(true);

  const [showOverview, setShowOverview] = useState({
    overview1: true,
    overview2: false,
    overview3: false,
    overview4: false,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

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

  const handleDropdownToggle = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    overview: keyof typeof showOverview
  ) => {
    setShowOverview((prev) => ({
      ...prev,
      [overview]: event.target.checked,
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
        <button className="fancy-button" onClick={toggleRightPanel}>
          {isRightPanelVisible ? "Detail Panel" : "Detail Panel"}
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
          {/* 오버뷰 선택 드롭다운 */}
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
            <button className="fancy-button" onClick={handleDropdownToggle}>
              Select Overviews
            </button>
            {isDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  padding: "10px",
                  zIndex: 10,
                }}
              >
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview1}
                    onChange={(e) => handleCheckboxChange(e, "overview1")}
                  />
                  Graph Overview Stats
                </label>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview2}
                    onChange={(e) => handleCheckboxChange(e, "overview2")}
                  />
                  Overview 2
                </label>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview3}
                    onChange={(e) => handleCheckboxChange(e, "overview3")}
                  />
                  Adjacency Matrix
                </label>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview4}
                    onChange={(e) => handleCheckboxChange(e, "overview4")}
                  />
                  Overview 4
                </label>
              </div>
            )}
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
              <AdjacencyMatrix />
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

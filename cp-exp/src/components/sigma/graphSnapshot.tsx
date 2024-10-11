import React, { useState } from "react";
import { downloadAsImage } from "@sigma/export-image";
import { useSigma } from "@react-sigma/core";
import { BsCamera } from "react-icons/bs";

const GraphSnapshot: React.FC = () => {
  const sigma = useSigma();
  const [showModal, setShowModal] = useState(false); // 모달 상태 관리
  const [isHovered, setIsHovered] = useState(false); // Hover 상태 관리

  const saveSnapshot = () => {
    const layers = ["edges", "nodes", "edgeLabels", "labels"].filter(
      (id) =>
        !!(document.getElementById(`layer-${id}`) as HTMLInputElement)?.checked
    );
    const width = +(document.getElementById(`width`) as HTMLInputElement)
      ?.value;
    const height = +(document.getElementById(`height`) as HTMLInputElement)
      ?.value;
    const fileName = (document.getElementById(`filename`) as HTMLInputElement)
      ?.value;
    const format = (document.getElementById(`format`) as HTMLInputElement)
      ?.value as "png" | "jpeg";
    const resetCameraState = !!(
      document.getElementById(`reset-camera-state`) as HTMLInputElement
    )?.checked;
    const backgroundColor = (
      document.getElementById(`backgroundColor`) as HTMLInputElement
    )?.value;

    downloadAsImage(sigma, {
      layers,
      format,
      fileName,
      backgroundColor,
      width: !width || isNaN(width) ? undefined : width,
      height: !height || isNaN(height) ? undefined : height,
      cameraState: resetCameraState
        ? { x: 0.5, y: 0.5, angle: 0, ratio: 1 }
        : undefined,
    });

    // 모달 닫기
    setShowModal(false);
  };

  return (
    <div>
      {/* 카메라 아이콘 */}
      <button
        onClick={() => setShowModal(true)}
        onMouseEnter={() => setIsHovered(true)} // Hover 상태 감지
        onMouseLeave={() => setIsHovered(false)} // Hover 상태 감지 해제
        style={{
          background: isHovered ? "#D2D2D2" : "none",
          width: "24px", // 버튼 가로 크기 24px
          height: "24px", // 버튼 세로 크기 24px
          border: "none",
          cursor: "pointer",
          color: "black", // Hover 시 회색으로 변경
          transition: "color 0.2s ease", // 색상 변경 애니메이션 추가
          justifyContent: "center", // 가로 중앙 정렬
          alignItems: "center", // 세로 중앙 정렬
        }}
        title="Take Snapshot"
      >
        <BsCamera size={16} />
      </button>

      {/* 모달 창 */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            bottom: "0px", // 화면의 맨 아래에서 20px 위에 위치
            left: "50%", // 수평 가운데
            transform: "translateX(-70%)", // 가운데 정렬
            width: "100vw",
            height: "100vh", // 높이를 자동으로 설정
            display: "flex",
            justifyContent: "center", // 수평 중앙 정렬
            alignItems: "center", // 세로 방향에서 맨 밑으로 정렬
            zIndex: 1000,
          }}
        >
          <form
            style={{
              background: "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              bottom: "200px", // 화면의 맨 아래에서 20px 위에 위치
              width: "250px",
              maxHeight: "90vh",
              overflowY: "auto",
              justifyContent: "space-between",
              alignItems: "center", // 세로 방향에서 맨 밑으로 정렬
              gap: "10px",
              border: "1px solid #ccc", // 외곽선 추가
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // 약간의 그림자 효과 추가
            }}
          >
            <h3>Layers to save</h3>
            <br />
            <div>
              <label htmlFor="layer-edges" style={{ marginRight: "10px" }}>
                Edges
              </label>
              <input type="checkbox" id="layer-edges" defaultChecked />
            </div>
            <div>
              <label htmlFor="layer-nodes" style={{ marginRight: "10px" }}>
                Nodes
              </label>
              <input type="checkbox" id="layer-nodes" defaultChecked />
            </div>
            <div>
              <label htmlFor="layer-edgeLabels" style={{ marginRight: "10px" }}>
                Edge labels
              </label>
              <input type="checkbox" id="layer-edgeLabels" defaultChecked />
            </div>
            <div>
              <label htmlFor="layer-labels" style={{ marginRight: "10px" }}>
                Node labels
              </label>
              <input type="checkbox" id="layer-labels" defaultChecked />
            </div>
            <br />
            <h3>Additional options</h3>
            <br />
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label htmlFor="filename">File name:</label>
              <input type="text" id="filename" defaultValue="graph" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label htmlFor="format">Format:</label>
              <select id="format">
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label htmlFor="backgroundColor">Background color:</label>
              <input type="color" id="backgroundColor" defaultValue="#ffffff" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input type="checkbox" id="reset-camera-state" />
              <label htmlFor="reset-camera-state">Reset camera state</label>
            </div>
            <button
              type="button"
              onClick={saveSnapshot}
              id="save-as-png"
              style={{
                marginTop: "10px",
                backgroundColor: "#4CAF50",
                color: "#fff",
                padding: "0.5em 1em",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Save image snapshot
            </button>{" "}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                marginTop: "10px",
                background: "#f44336",
                color: "#fff",
                padding: "0.5em 1em",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default GraphSnapshot;

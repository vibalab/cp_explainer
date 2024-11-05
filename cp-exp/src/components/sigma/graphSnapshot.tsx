import React, { useState } from "react";
import { downloadAsImage } from "@sigma/export-image";
import { useSigma } from "@react-sigma/core";
import { BsCamera } from "react-icons/bs";
import styled from "styled-components";

const GraphSnapshot: React.FC = () => {
  const sigma = useSigma();
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

    setShowModal(false); // Close modal after saving snapshot
  };

  return (
    <div>
      {/* Camera Icon */}
      <button
        onClick={() => setShowModal(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: isHovered ? "#D2D2D2" : "none",
          width: "24px",
          height: "24px",
          border: "none",
          cursor: "pointer",
          color: "black",
          transition: "color 0.2s ease",
          justifyContent: "center",
          alignItems: "center",
        }}
        title="Take Snapshot"
      >
        <BsCamera size={16} />
      </button>

      {/* Modal Window */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            bottom: "0px",
            left: "50%",
            transform: "translateX(-70%)",
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            pointerEvents: "none", // Allow interaction with the background graph
          }}
        >
          <form
            style={{
              background: "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              width: "250px",
              maxHeight: "90vh",
              overflowY: "auto",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              border: "1px solid #ccc",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              zIndex: 1010,
              pointerEvents: "auto", // Allow interaction within the modal
            }}
          >
            <h3>Layers to save</h3>
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
            <h3>Additional options</h3>
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
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <StyledButton onClick={saveSnapshot}>Save</StyledButton>
              <StyledButton onClick={() => setShowModal(false)}>
                Close
              </StyledButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// StyledButton component for consistent styling
const StyledButton = styled.button<{ isHovered?: boolean }>`
  display: block;
  width: 45%;
  background-color: ${(props) => (props.isHovered ? "#87CEEB" : "#fff")};
  color: ${(props) => (props.isHovered ? "#fff" : "#000")};
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  font-family: "Arial", sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #87ceeb;
    color: #fff;
  }
`;

export default GraphSnapshot;

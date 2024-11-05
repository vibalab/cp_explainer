import React, { useState } from "react";
import { useSigma } from "@react-sigma/core";
import { BsBrush } from "react-icons/bs";
import { Attributes } from "graphology-types";
import { getHSLColor } from "../sub/colorUtils";
import styled from "styled-components";

interface GraphAppearanceControllerProps {
  threshold: number;
  onNodeColorChange: (h: number, s: number, l: number) => void;
  onEdgeColorChange: (h: number, s: number, l: number) => void;
}

const centralityOptions = [
  { label: "Degree Centrality", value: "degree_centrality" },
  { label: "Betweenness Centrality", value: "betweenness_centrality" },
  { label: "Closeness Centrality", value: "closeness_centrality" },
  { label: "Core-Periphery Value", value: "core_periphery" },
];

const GraphAppearanceController: React.FC<GraphAppearanceControllerProps> = ({
  threshold,
  onNodeColorChange,
  onEdgeColorChange,
}) => {
  const sigma = useSigma();
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedCentrality, setSelectedCentrality] = useState(
    centralityOptions[0].value
  );
  const [coreNodeSize, setCoreNodeSize] = useState(1);
  const [peripheryNodeSize, setPeripheryNodeSize] = useState(1);
  const [sizeMultiplier, setSizeMultiplier] = useState(1);
  const [nodeColor, setNodeColor] = useState(getHSLColor(197, 71, 73, 1));
  const [edgeColor, setEdgeColor] = useState("#cccccc");
  const [sizeMin, setSizeMin] = useState(10);
  const [sizeMax, setSizeMax] = useState(100);

  const hexToHSL = (hex: string) => {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };

  const updateNodeSize = () => {
    sigma.getGraph().forEachNode((node, attributes: Attributes) => {
      const corePeripheryValue = attributes.core_periphery || 0;
      const centralityValue = attributes[selectedCentrality] || 1;

      let newSize =
        corePeripheryValue >= threshold
          ? coreNodeSize * centralityValue * sizeMultiplier
          : peripheryNodeSize * centralityValue * sizeMultiplier;

      newSize = Math.max(sizeMin, Math.min(sizeMax, newSize));
      sigma.getGraph().setNodeAttribute(node, "size", newSize);
    });

    sigma.refresh();
  };

  const updateNodeColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setNodeColor(color);
    document.documentElement.style.setProperty(
      "--fancy-button-hover-color",
      color
    );

    const [h, s, l] = hexToHSL(color);
    onNodeColorChange(h, s, l);
    sigma.getGraph().forEachNode((node, attributes: Attributes) => {
      const corePeripheryValue = attributes.core_periphery || 0;
      const newColor =
        corePeripheryValue >= threshold
          ? getHSLColor(h, s, l, corePeripheryValue)
          : "#FFFFFF";
      const borderColor =
        corePeripheryValue < threshold ? getHSLColor(h, s, l, 1) : "#000000";
      sigma.getGraph().setNodeAttribute(node, "color", newColor);
      sigma.getGraph().setNodeAttribute(node, "borderColor", borderColor);
    });
    sigma.refresh();
  };

  const updateEdgeColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setEdgeColor(color);
    sigma.getGraph().forEachEdge((edge, attributes) => {
      sigma.getGraph().setEdgeAttribute(edge, "color", color);
    });
    sigma.refresh();
  };

  const resetToDefault = () => {
    const graph = sigma.getGraph();

    graph.forEachNode((node, attributes) => {
      const nodeHSL = { h: 197, s: 71, l: 73 };
      const nodeSize = Math.min(
        Math.max(attributes.degree_centrality * 100, 10),
        30
      );

      graph.setNodeAttribute(node, "size", nodeSize);
      graph.setNodeAttribute(
        node,
        "color",
        getHSLColor(nodeHSL.h, nodeHSL.s, nodeHSL.l, attributes.core_periphery)
      );

      document.documentElement.style.setProperty(
        "--fancy-button-hover-color",
        "#87ceeb"
      );
      graph.setNodeAttribute(
        node,
        "borderColor",
        attributes.core_periphery < threshold
          ? getHSLColor(nodeHSL.h, nodeHSL.s, nodeHSL.l, 1)
          : "#000000"
      );
    });
    onNodeColorChange(197, 71, 73);

    graph.forEachEdge((edge, attributes) => {
      const edgeWeight = attributes.weight || 1;
      graph.setEdgeAttribute(edge, "size", edgeWeight / 2);
      graph.setEdgeAttribute(edge, "color", "#CED4DA");
    });

    sigma.refresh();
  };

  return (
    <div>
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
        title="Graph Appearance"
      >
        <BsBrush size={16} />
      </button>

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
            pointerEvents: "none",
          }}
        >
          <form
            style={{
              background: "#ffffff",
              padding: "20px",
              borderRadius: "10px",
              width: "300px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "10px",
              border: "1px solid #ccc",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              zIndex: 1010,
              pointerEvents: "auto",
            }}
          >
            <div>
              <h4 style={{ textAlign: "left" }}>Color Configuration</h4>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label htmlFor="nodeColor">Node Color: </label>
                <input
                  type="color"
                  value={nodeColor}
                  onChange={updateNodeColor}
                  style={{ marginLeft: "10px" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label htmlFor="edgeColor">Edge Color: </label>
                <input
                  type="color"
                  value={edgeColor}
                  onChange={updateEdgeColor}
                  style={{ marginLeft: "10px" }}
                />
              </div>
            </div>

            <div>
              <h4 style={{ textAlign: "left" }}>Node Size Configuration</h4>
              <strong> Calc: Criteria X Size Multiplier X Size </strong>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label htmlFor="centrality">Size Criteria: </label>
                <select
                  id="centrality"
                  value={selectedCentrality}
                  onChange={(e) => setSelectedCentrality(e.target.value)}
                  style={{ marginLeft: "10px" }}
                >
                  {centralityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label htmlFor="sizeMultiplier">Size Multiplier: </label>
                <input
                  type="number"
                  id="sizeMultiplier"
                  value={sizeMultiplier}
                  onChange={(e) => setSizeMultiplier(Number(e.target.value))}
                  style={{ marginLeft: "10px", width: "80px" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label htmlFor="sizeMin">Min Size: </label>
                <input
                  type="number"
                  id="sizeMin"
                  value={sizeMin}
                  onChange={(e) => setSizeMin(Number(e.target.value))}
                  style={{ marginLeft: "10px", width: "80px" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label htmlFor="sizeMax">Max Size: </label>
                <input
                  type="number"
                  id="sizeMax"
                  value={sizeMax}
                  onChange={(e) => setSizeMax(Number(e.target.value))}
                  style={{ marginLeft: "10px", width: "80px" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label htmlFor="coreNodeSize">Core Size: </label>
                <input
                  type="number"
                  id="coreNodeSize"
                  min={sizeMin}
                  max={sizeMax}
                  value={coreNodeSize}
                  onChange={(e) => setCoreNodeSize(Number(e.target.value))}
                  style={{ marginLeft: "10px", width: "80px" }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label htmlFor="peripheryNodeSize">Periphery Size: </label>
                <input
                  type="number"
                  id="peripheryNodeSize"
                  min={sizeMin}
                  max={sizeMax}
                  value={peripheryNodeSize}
                  onChange={(e) => setPeripheryNodeSize(Number(e.target.value))}
                  style={{ marginLeft: "10px", width: "80px" }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <StyledButton type="button" onClick={resetToDefault}>
                Default
              </StyledButton>
              <StyledButton type="button" onClick={updateNodeSize}>
                Apply
              </StyledButton>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <StyledButton
                onClick={() => setShowModal(false)}
                style={{ width: "100%" }}
              >
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
const StyledButton = styled.button<{ $isHovered?: boolean }>`
  display: block;
  width: 50%;
  background-color: ${(props) => (props.$isHovered ? "#87CEEB" : "#fff")};
  color: ${(props) => (props.$isHovered ? "#fff" : "#000")};
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

export default GraphAppearanceController;

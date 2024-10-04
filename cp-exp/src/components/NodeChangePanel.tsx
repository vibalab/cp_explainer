import { useSigma } from "@react-sigma/core";
import { FC, useEffect, useState } from "react";
import { Attributes } from "graphology-types";
import { getHSLColor } from "./sub/colorUtils";
import { NodeData, EdgeData } from "../types";
import { createGraphData } from "./sub/metricService"; // metricService 가져오기

const NodeChangePanel: FC<{
  panelPosition: { x: number; y: number } | null;
  selectedNode: Attributes | null;
  onClose: () => void;
  onRefreshPanels: () => void;
  onNodeClick?: (
    nodeAttributes: Attributes,
    neighborDetails: Array<{ label: string; attributes: Attributes }>
  ) => void;
  threshold: number;
  method: string | null;
  setGraphData: React.Dispatch<
    React.SetStateAction<{
      nodes: NodeData[];
      edges: EdgeData[];
      core_indices: number[];
    }>
  >; // setGraphData를 props로 받아옴
}> = ({
  panelPosition,
  selectedNode,
  onClose,
  setGraphData,
  onRefreshPanels,
  onNodeClick,
  threshold,
  method,
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [buttonLabel, setButtonLabel] = useState("Toggle Core/Periphery");
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!selectedNode) return;

    const currentCorePeriphery = graph.getNodeAttribute(
      selectedNode.id,
      "core_periphery"
    );

    // Set button label based on the current core_periphery value
    const label =
      currentCorePeriphery >= threshold
        ? "Toggle to Periphery"
        : "Toggle to Core";
    setButtonLabel(label);
  }, [graph, selectedNode, threshold]);

  const toggleAttributes = () => {
    if (!selectedNode) return;

    const currentCorePeriphery = graph.getNodeAttribute(
      selectedNode.id,
      "core_periphery"
    );

    const newCorePeriphery = currentCorePeriphery === 1 ? 0 : 1;
    graph.setNodeAttribute(selectedNode.id, "core_periphery", newCorePeriphery);

    // Toggle color
    const currentColor = graph.getNodeAttribute(selectedNode.id, "color");
    const newColor =
      currentColor === getHSLColor(197, 71, 73, 1)
        ? "#FFFFFF"
        : getHSLColor(197, 71, 73, 1);
    graph.setNodeAttribute(selectedNode.id, "color", newColor);

    // Set borderColor based on the new core_periphery value
    const currentBorderColor = graph.getNodeAttribute(
      selectedNode.id,
      "borderColor"
    );
    const newBorderColor =
      currentBorderColor === getHSLColor(197, 71, 73, 1)
        ? "#000000"
        : getHSLColor(197, 71, 73, 1);
    graph.setNodeAttribute(selectedNode.id, "borderColor", newBorderColor);
    const graphData = createGraphData(graph);
    setGraphData(graphData);
    // Update the button label
    const newButtonLabel =
      newCorePeriphery >= threshold ? "Toggle to Periphery" : "Toggle to Core";
    setButtonLabel(newButtonLabel);

    onRefreshPanels();

    if (onNodeClick) {
      const neighbors = graph.neighbors(selectedNode.id);
      const neighborDetails = neighbors.map((neighborNode) => {
        const neighborAttributes = graph.getNodeAttributes(neighborNode);
        const neighborLabel = neighborAttributes.label || neighborNode;
        return {
          label: neighborLabel,
          attributes: neighborAttributes,
        };
      });

      onNodeClick(selectedNode, neighborDetails);
    }
  };

  if (!panelPosition || !selectedNode) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: panelPosition.y,
        left: panelPosition.x,
        backgroundColor: "#fff",
        borderWidth: "1px", // Split shorthand
        borderStyle: "solid", // Split shorthand
        borderColor: "#ced4da", // Split shorthand
        borderRadius: "8px",
        padding: "12px",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Conditionally render the button if method is not "Rossa" */}
      {method !== "Rossa" && (
        <button
          onClick={toggleAttributes}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            display: "block",
            width: "100%",
            backgroundColor: isHovered ? "#87CEEB" : "#fff",
            borderWidth: "1px", // Split shorthand
            borderStyle: "solid", // Split shorthand
            borderColor: "#ced4da", // Split shorthand
            color: isHovered ? "#fff" : "#000",
            borderRadius: "4px",
            padding: "8px",
            cursor: "pointer",
            marginBottom: "8px",
            fontFamily: "Arial, sans-serif",
          }}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
};

export default NodeChangePanel;

import { useSigma } from "@react-sigma/core";
import { FC, useEffect, useState } from "react";
import { Attributes } from "graphology-types";

const NodeChangePanel: FC<{
  panelPosition: { x: number; y: number } | null;
  selectedNode: Attributes | null;
  onClose: () => void;
  onRefreshPanels: () => void;
  onNodeClick?: (
    nodeAttributes: Attributes,
    neighborDetails: Array<{ label: string; attributes: Attributes }>
  ) => void;
}> = ({
  panelPosition,
  selectedNode,
  onClose,
  onRefreshPanels,
  onNodeClick,
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
    const currentColor = graph.getNodeAttribute(selectedNode.id, "color");
    const currentBorderColor = graph.getNodeAttribute(
      selectedNode.id,
      "borderColor"
    );

    // Set button label based on the current core_periphery value
    const label =
      currentCorePeriphery === 1 ? "Toggle to Periphery" : "Toggle to Core";
    setButtonLabel(label);
  }, [graph, selectedNode]);

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
    const newColor = currentColor === "#87CEEB" ? "#FFFFFF" : "#87CEEB";
    graph.setNodeAttribute(selectedNode.id, "color", newColor);

    // Set borderColor based on the new core_periphery value
    const currentBorderColor = graph.getNodeAttribute(
      selectedNode.id,
      "borderColor"
    );
    const newBorderColor =
      currentBorderColor === "#87CEEB" ? "#000000" : "#87CEEB";
    graph.setNodeAttribute(selectedNode.id, "borderColor", newBorderColor);

    // Update the button label
    const newButtonLabel =
      newCorePeriphery >= 0.5 ? "Toggle to Periphery" : "Toggle to Core";
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
        border: "1px solid #ced4da",
        borderRadius: "8px",
        padding: "12px",
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* <div style={{ marginBottom: "8px" }}>
        <strong>Node Label: {selectedNode.label}</strong>
      </div> */}
      <button
        onClick={toggleAttributes}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: "block",
          width: "100%",
          backgroundColor: isHovered ? "#87CEEB" : "#fff",
          border: "1px solid #ced4da",
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
    </div>
  );
};

export default NodeChangePanel;

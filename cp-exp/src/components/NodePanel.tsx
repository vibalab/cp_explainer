import React, { useState, useEffect } from "react";
import { Attributes } from "graphology-types";
import { useSigma } from "@react-sigma/core";

interface NodeDetailPanelProps {
  node: Attributes | null;
  onClose: () => void;
}

const NodePanel: React.FC<NodeDetailPanelProps> = ({ node, onClose }) => {
  const [flipped, setFlipped] = useState(false);
  const [neighborCount, setNeighborCount] = useState(0);
  const sigma = useSigma();
  const graph = sigma.getGraph();

  if (!node) return null;

  const neighbors = graph
    .neighbors(node.label)
    .filter(
      (neighbor) => graph.getNodeAttribute(neighbor, "filter_hidden") === false
    );

  return <div></div>;
};

export default NodePanel;

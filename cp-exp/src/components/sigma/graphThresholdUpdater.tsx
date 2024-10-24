import { FC, useEffect } from "react";
import { useSigma } from "@react-sigma/core";
import { getHSLColor } from "../sub/colorUtils";

interface GraphThresholdUpdaterProps {
  threshold: number;
  nodeHSL: { h: number; s: number; l: number };
}

const GraphThresholdUpdater: FC<GraphThresholdUpdaterProps> = ({
  threshold,
  nodeHSL,
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  useEffect(() => {
    if (!graph) {
      console.error("Graph not available");
      return;
    }

    try {
      // Update node attributes based on the threshold value
      graph.forEachNode((nodeId, attributes) => {
        const corePeriphery = attributes.core_periphery;
        const borderColor =
          corePeriphery < threshold
            ? getHSLColor(nodeHSL.h, nodeHSL.s, nodeHSL.l, 1)
            : "#000000";
        graph.setNodeAttribute(nodeId, "borderColor", borderColor);
      });

      // Trigger a re-render for the sigma instance
      sigma.refresh();
    } catch (error) {
      console.error("Error updating graph attributes:", error);
    }
  }, [threshold, graph, sigma]);

  return null;
};

export default GraphThresholdUpdater;

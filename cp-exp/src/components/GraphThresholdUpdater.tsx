import { FC, useEffect } from "react";
import { useSigma } from "@react-sigma/core";

interface GraphThresholdUpdaterProps {
  threshold: number;
}

const GraphThresholdUpdater: FC<GraphThresholdUpdaterProps> = ({
  threshold,
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  useEffect(() => {
    if (!graph) {
      console.error("Graph not available");
      return;
    }

    try {
      console.log(threshold);
      // Update node attributes based on the threshold value
      graph.forEachNode((nodeId, attributes) => {
        const corePeriphery = attributes.core_periphery;
        const newColor = corePeriphery < threshold ? "#87CEEB" : "#000000";
        graph.setNodeAttribute(nodeId, "borderColor", newColor);
      });

      // Trigger a re-render for the sigma instance
      sigma.refresh();

      console.log("Graph attributes updated based on threshold:", threshold);
    } catch (error) {
      console.error("Error updating graph attributes:", error);
    }
  }, [threshold, graph, sigma]);

  return null;
};

export default GraphThresholdUpdater;

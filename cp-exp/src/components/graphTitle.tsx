import { useSigma } from "@react-sigma/core";
import { FC, useEffect, useState } from "react";

const GraphTitle: FC = () => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  const [visibleItems, setVisibleItems] = useState<{
    nodes: number;
    corePeripheryNodes: number;
    corePeripheryRatio: number;
  }>({
    nodes: 0,
    corePeripheryNodes: 0,
    corePeripheryRatio: 0,
  });

  const updateCounts = () => {
    const counts = { nodes: 0, corePeripheryNodes: 0, corePeripheryRatio: 0 };

    // Calculate the number of visible nodes and core_periphery > 0 nodes
    graph.forEachNode((_, attributes) => {
      if (!attributes.hidden) {
        counts.nodes++;
        if (attributes.core_periphery && attributes.core_periphery > 0.8) {
          counts.corePeripheryNodes++;
        }
      }
    });

    // Calculate the ratio: only if the total node count is not 0
    if (counts.nodes > 0) {
      counts.corePeripheryRatio =
        (counts.corePeripheryNodes / counts.nodes) * 100;
    }

    setVisibleItems(counts);
  };

  useEffect(() => {
    // Initial calculation
    updateCounts();

    // Add event listeners to update the counts when the graph changes
    const updateHandler = () => updateCounts();
    graph.on("nodeAdded", updateHandler);
    graph.on("nodeDropped", updateHandler);
    graph.on("nodeAttributesUpdated", updateHandler);

    // Clean up event listeners on component unmount
    return () => {
      graph.off("nodeAdded", updateHandler);
      graph.off("nodeDropped", updateHandler);
      graph.off("nodeAttributesUpdated", updateHandler);
    };
  }, [graph]);

  return (
    <div className="graph-title">
      <h1>{"Core-periphery Network"}</h1>
      <h2>
        <i>
          {visibleItems.nodes} node{visibleItems.nodes > 1 ? "s" : ""} with{" "}
          {visibleItems.corePeripheryNodes} core
          {visibleItems.corePeripheryNodes !== 1 ? "s" : ""}
        </i>
      </h2>
      <h2>
        <i> ({visibleItems.corePeripheryRatio.toFixed(1)}%)</i>
      </h2>
    </div>
  );
};

export default GraphTitle;

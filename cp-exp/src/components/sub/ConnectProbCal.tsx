import React, { useEffect, useState } from "react";
import { useSigma } from "@react-sigma/core";

interface ConnectionProbabilities {
  coreCore: { possible: number; actual: number };
  corePeriphery: { possible: number; actual: number };
  peripheryPeriphery: { possible: number; actual: number };
}

interface GraphProps {
  onDataCalculated: (data: ConnectionProbabilities) => void;
}

const ConnectionProbabilityCalculator: React.FC<GraphProps> = ({
  onDataCalculated,
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  useEffect(() => {
    if (!graph) return;

    const calculateConnectionProbabilities = () => {
      const coreNodes: string[] = [];
      const peripheryNodes: string[] = [];

      // Separate nodes into core and periphery
      graph.forEachNode((node) => {
        const corePeriphery = graph.getNodeAttribute(node, "core_periphery");
        if (typeof corePeriphery === "number" && corePeriphery >= 0.5) {
          coreNodes.push(node);
        } else {
          peripheryNodes.push(node);
        }
      });

      let coreCoreEdges = 0;
      let corePeripheryEdges = 0;
      let peripheryPeripheryEdges = 0;

      // Count edges between node groups
      graph.forEachEdge((edge) => {
        const source = graph.source(edge);
        const target = graph.target(edge);

        // Check if source and target exist before proceeding
        if (
          !source ||
          !target ||
          !graph.hasNode(source) ||
          !graph.hasNode(target)
        ) {
          return; // Skip if the source or target node is undefined or doesn't exist in the graph
        }

        const sourceNodeCorePeriphery = graph.getNodeAttribute(
          source,
          "core_periphery"
        );
        const targetNodeCorePeriphery = graph.getNodeAttribute(
          target,
          "core_periphery"
        );

        if (
          typeof sourceNodeCorePeriphery === "number" &&
          typeof targetNodeCorePeriphery === "number"
        ) {
          if (
            sourceNodeCorePeriphery >= 0.5 &&
            targetNodeCorePeriphery >= 0.5
          ) {
            coreCoreEdges++;
          } else if (
            (sourceNodeCorePeriphery >= 0.5 && targetNodeCorePeriphery < 0.5) ||
            (sourceNodeCorePeriphery < 0.5 && targetNodeCorePeriphery >= 0.5)
          ) {
            corePeripheryEdges++;
          } else if (
            sourceNodeCorePeriphery < 0.5 &&
            targetNodeCorePeriphery < 0.5
          ) {
            peripheryPeripheryEdges++;
          }
        }
      });

      // Calculate possible edges
      const possibleCoreCoreEdges =
        (coreNodes.length * (coreNodes.length - 1)) / 2;
      const possibleCorePeripheryEdges =
        coreNodes.length * peripheryNodes.length;
      const possiblePeripheryPeripheryEdges =
        (peripheryNodes.length * (peripheryNodes.length - 1)) / 2;

      return {
        coreCore: { possible: possibleCoreCoreEdges, actual: coreCoreEdges },
        corePeriphery: {
          possible: possibleCorePeripheryEdges,
          actual: corePeripheryEdges,
        },
        peripheryPeriphery: {
          possible: possiblePeripheryPeripheryEdges,
          actual: peripheryPeripheryEdges,
        },
      };
    };

    const result = calculateConnectionProbabilities();
    onDataCalculated(result); // Send calculated data to the parent
  }, [graph, onDataCalculated]);

  return null; // No visual output, just the data processing
};

export default ConnectionProbabilityCalculator;

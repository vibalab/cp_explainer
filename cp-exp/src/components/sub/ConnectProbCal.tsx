import React, { useEffect, useCallback } from "react";
import { useSigma } from "@react-sigma/core";
import throttle from "lodash/throttle";
import { NodeData, EdgeData } from "../../types";

interface ConnectionProbabilities {
  coreCore: { possible: number; actual: number };
  corePeriphery: { possible: number; actual: number };
  peripheryPeriphery: { possible: number; actual: number };
}

interface GraphProps {
  onDataCalculated: (data: ConnectionProbabilities) => void; // Unified callback function
  threshold: number;
  graphData: {
    nodes: NodeData[];
    edges: EdgeData[];
    core_indices: number[];
  };
}

const ConnectionProbabilityCalculator: React.FC<GraphProps> = ({
  onDataCalculated,
  threshold,
  graphData,
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  // Connection probability calculation
  const calculateConnectionProbabilities = useCallback(() => {
    const coreNodes: string[] = [];
    const peripheryNodes: string[] = [];

    // Separate nodes into core and periphery based on the threshold
    graph.forEachNode((node) => {
      const corePeriphery = graph.getNodeAttribute(node, "core_periphery");
      if (typeof corePeriphery === "number" && corePeriphery >= threshold) {
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

      if (!graph.hasNode(source) || !graph.hasNode(target)) return;

      const sourceCorePeriphery = graph.getNodeAttribute(
        source,
        "core_periphery"
      );
      const targetCorePeriphery = graph.getNodeAttribute(
        target,
        "core_periphery"
      );

      if (
        typeof sourceCorePeriphery === "number" &&
        typeof targetCorePeriphery === "number"
      ) {
        if (
          sourceCorePeriphery >= threshold &&
          targetCorePeriphery >= threshold
        ) {
          coreCoreEdges++;
        } else if (
          (sourceCorePeriphery >= threshold &&
            targetCorePeriphery < threshold) ||
          (sourceCorePeriphery < threshold && targetCorePeriphery >= threshold)
        ) {
          corePeripheryEdges++;
        } else if (
          sourceCorePeriphery < threshold &&
          targetCorePeriphery < threshold
        ) {
          peripheryPeripheryEdges++;
        }
      }
    });

    const possibleCoreCoreEdges =
      (coreNodes.length * (coreNodes.length - 1)) / 2;
    const possibleCorePeripheryEdges = coreNodes.length * peripheryNodes.length;
    const possiblePeripheryPeripheryEdges =
      (peripheryNodes.length * (peripheryNodes.length - 1)) / 2;

    const result = {
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

    // Trigger the callback function with the calculated data
    onDataCalculated(result);
  }, [graphData, threshold]);

  // Throttle the calculateConnectionProbabilities function to avoid too many re-calculations
  const throttledCalculate = useCallback(
    throttle(calculateConnectionProbabilities, 500),
    [calculateConnectionProbabilities]
  );

  // Effect to calculate probabilities whenever graphData or threshold changes
  useEffect(() => {
    if (graph && graphData) {
      throttledCalculate(); // Calculate whenever graphData or threshold changes
    }
  }, [graphData, threshold, throttledCalculate]);

  return null; // No visual output, just processing logic
};

export default ConnectionProbabilityCalculator;

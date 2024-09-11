import React, { useEffect, useState, useCallback } from "react";
import { useSigma } from "@react-sigma/core";
import throttle from "lodash/throttle";

interface ConnectionProbabilities {
  coreCore: { possible: number; actual: number };
  corePeriphery: { possible: number; actual: number };
  peripheryPeriphery: { possible: number; actual: number };
}

interface GraphProps {
  onDataCalculated: (data: ConnectionProbabilities) => void; // Unified callback function
  threshold: number;
}

const ConnectionProbabilityCalculator: React.FC<GraphProps> = ({
  onDataCalculated,
  threshold,
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [stateChange, setStateChange] = useState(false);

  const calculateConnectionProbabilities = useCallback(() => {
    const coreNodes: string[] = [];
    const peripheryNodes: string[] = [];

    // Separate nodes into core and periphery
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

    // Trigger the unified callback function with the calculated data
    onDataCalculated(result);
  }, [graph, onDataCalculated]);

  // Throttle the calculateConnectionProbabilities function
  const throttledCalculate = useCallback(
    throttle(calculateConnectionProbabilities, 500),
    [calculateConnectionProbabilities]
  );

  useEffect(() => {
    if (!graph) return;

    // Watch for attribute changes
    const handleAttributesChange = () => {
      throttledCalculate();
    };

    graph.on("nodeAttributesUpdated", handleAttributesChange);

    return () => {
      graph.off("nodeAttributesUpdated", handleAttributesChange);
    };
  }, [graph, throttledCalculate, threshold]);

  useEffect(() => {
    setStateChange(!stateChange);
  }, [sigma, graph]);

  return null; // No visual output, just processing logic
};

export default ConnectionProbabilityCalculator;

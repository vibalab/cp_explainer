import { FC, useEffect, PropsWithChildren } from "react";
import { useSigma } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { Dataset, NodeData, EdgeData } from "../../types";
import { getHSLColor } from "../sub/colorUtils";
import axios from "axios";
import { createGraphData } from "../sub/metricService"; // metricService 가져오기

interface GraphDataControllerProps {
  isMethodChanged: boolean;
  threshold: number;
  setGraphData: React.Dispatch<
    React.SetStateAction<{
      nodes: NodeData[];
      edges: EdgeData[];
      core_indices: number[];
    }>
  >; // setGraphData를 props로 받아옴
}

const GraphCPApplier: FC<PropsWithChildren<GraphDataControllerProps>> = ({
  isMethodChanged,
  threshold,
  children,
  setGraphData,
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  const applyMethod = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/graph/node-edge-json/"
      );
      const dataset: Dataset = res.data;

      dataset.nodes.forEach((node: any) => {
        const borderColor =
          node.core_periphery < threshold
            ? getHSLColor(197, 71, 73, 1)
            : "#000000";

        graph.setNodeAttribute(node.id, "core_periphery", node.core_periphery);
        graph.setNodeAttribute(
          node.id,
          "core_periphery_score",
          node.core_periphery_score
        );
        graph.setNodeAttribute(
          node.id,
          "color",
          getHSLColor(197, 71, 73, node.core_periphery)
        );
        graph.setNodeAttribute(node.id, "borderColor", borderColor);
      });
      const graphData = createGraphData(graph);
      setGraphData(graphData);
    } catch (err) {
      console.error("Error fetching dataset:", err);
    }
  };

  useEffect(() => {
    if (isMethodChanged) {
      applyMethod();
    }
  }, [isMethodChanged]);

  return <>{children}</>;
};

export default GraphCPApplier;

import { FC, useEffect, PropsWithChildren } from "react";
import { useSigma } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { Dataset } from "../../types";
import forceAtlas2 from "graphology-layout-forceatlas2"; // ForceAtlas2 알고리즘 가져옴
import { getHSLColor } from "../sub/colorUtils";

interface GraphDataControllerProps {
  dataset: Dataset;
  threshold: number;
  nodeHSL: { h: number; s: number; l: number };
}

const GraphDataController: FC<PropsWithChildren<GraphDataControllerProps>> = ({
  dataset,
  threshold,
  nodeHSL,
  children,
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  useEffect(() => {
    if (!graph || !dataset) {
      console.error("Graph or dataset not available");
      return;
    } else {
      console.log("Dataset is for Animations");
    }

    try {
      graph.clear();

      dataset.nodes.forEach((node: any) => {
        const nodeSize = Math.min(
          Math.max(node.degree_centrality * 100, 10),
          30
        );
        graph.addNode(node.id, {
          id: node.id,
          key: node.id,
          label: node.label,
          degree: node.degree,
          x: node.x,
          y: node.y,
          degree_centrality: node.degree_centrality,
          betweenness_centrality: node.betweenness_centrality,
          closeness_centrality: node.closeness_centrality,
          eigenvector_centrality: node.eigenvector_centrality,
          core_periphery: node.core_periphery,
          core_periphery_score: node.core_periphery_score,
          group: node.group,
          attributes: node.attributes,
          size: nodeSize,
          color: getHSLColor(
            nodeHSL.h,
            nodeHSL.s,
            nodeHSL.l,
            node.core_periphery
          ),
          borderColor:
            node.core_periphery < threshold
              ? getHSLColor(nodeHSL.h, nodeHSL.s, nodeHSL.l, 1)
              : "#000000",
          pictoColor: "FFFFFF",
          clicked: false,
        });
      });

      dataset.edges.forEach((edge: any) => {
        const edgeWeight = edge.weight || 1; // weight 값이 없으면 기본값 1로 설정
        graph.addEdge(edge.source, edge.target, {
          weight: edgeWeight,
          size: edgeWeight / 2,
          color: "#CED4DA",
        });
      });

      // 노드가 겹치지 않도록 ForceAtlas2 알고리즘 적용
      forceAtlas2.assign(graph, {
        iterations: 200, // 레이아웃 적용 반복 횟수 (더 많으면 더 정교해짐)
        settings: {
          gravity: 1, // 중력 설정
          scalingRatio: 3, // 노드 간 거리 조정
        },
      });

      console.log("Graph data loaded successfully");
    } catch (error) {
      console.error("Error loading graph data:", error);
    }

    return () => graph.clear();
  }, [graph, dataset, sigma]);

  return <>{children}</>;
};

export default GraphDataController;

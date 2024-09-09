import { FC, useEffect, PropsWithChildren, useState } from "react";
import { keyBy } from "lodash";
import { useSigma } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { Dataset } from "../types";
import forceAtlas2 from "graphology-layout-forceatlas2"; // ForceAtlas2 알고리즘 가져옴

interface GraphDataControllerProps {
  dataset: Dataset;
}

const GraphDataController: FC<PropsWithChildren<GraphDataControllerProps>> = ({
  dataset,
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
          attributes: node.attributes,
          size: nodeSize,
          color: node.core_periphery < 0.8 ? "#FFFFFF" : "#87CEEB",
          borderColor: node.core_periphery < 0.8 ? "#87CEEB" : "#000000",
          pictoColor: "FFFFFF",
          clicked: false,
        });
      });

      dataset.edges.forEach((edge: any) => {
        graph.addEdge(edge.source, edge.target, {
          size: edge.weight / 2,
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

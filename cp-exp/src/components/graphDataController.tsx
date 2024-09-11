import { FC, useEffect, PropsWithChildren, useState } from "react";
import { keyBy } from "lodash";
import { useSigma } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { Dataset } from "../types";
import forceAtlas2 from "graphology-layout-forceatlas2"; // ForceAtlas2 알고리즘 가져옴

// HSL -> RGB 변환 함수
const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ];
};

// RGB -> HEX 변환 함수
const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;

// HSL 색상 값 생성 후 HEX 변환
const getHSLColor = (
  HUE: number,
  SAT: number,
  LIGHT: number,
  value: number
): string => {
  const lightness = 100 - (100 - LIGHT) * value;

  const rgb = hslToRgb(HUE, SAT, lightness);
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
};

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
          color: getHSLColor(197, 71, 73, node.core_periphery),
          borderColor: node.core_periphery < 0.5 ? "#87CEEB" : "#000000",
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

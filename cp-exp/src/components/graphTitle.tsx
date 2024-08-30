import { useSigma } from "@react-sigma/core";
import { FC, useEffect, useState } from "react";

const GraphTitle: FC = () => {
  const sigma = useSigma();
  const graph = sigma.getGraph();

  const [visibleItems, setVisibleItems] = useState<{
    nodes: number;
    corePeripheryNodes: number;
    corePeripheryRatio: number; // 비율 추가
  }>({
    nodes: 0,
    corePeripheryNodes: 0,
    corePeripheryRatio: 0, // 초기값 설정
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      const counts = { nodes: 0, corePeripheryNodes: 0, corePeripheryRatio: 0 };

      // 숨겨지지 않은 노드의 개수와 core_periphery > 0 노드의 개수를 셈
      graph.forEachNode((_, attributes) => {
        if (!attributes.hidden) {
          counts.nodes++;
          if (attributes.core_periphery && attributes.core_periphery > 0) {
            counts.corePeripheryNodes++;
          }
        }
      });

      // 비율 계산: 전체 노드 수가 0이 아닌 경우에만 계산
      if (counts.nodes > 0) {
        counts.corePeripheryRatio =
          (counts.corePeripheryNodes / counts.nodes) * 100;
      }

      setVisibleItems(counts); // visibleItems 상태를 업데이트
    });
  }, [graph]);

  return (
    <div className="graph-title">
      <h1>{"Core-periphery Network"}</h1> {/* 제목 */}
      <h2>
        <i>
          {visibleItems.nodes} visible node{visibleItems.nodes > 1 ? "s" : ""}{" "}
          with {visibleItems.corePeripheryNodes} core
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

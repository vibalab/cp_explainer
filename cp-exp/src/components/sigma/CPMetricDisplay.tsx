import { useSetSettings, useSigma } from "@react-sigma/core"; // Sigma 설정 및 인스턴스를 가져옴
import { FC, useState } from "react";
import { NodeData, EdgeData } from "../../types";
import useDebounce from "../../use_debounce"; // 디바운스 훅을 가져옴
import Borgatti from "../algorithms/BorgattiEverett";
import Rossa from "../algorithms/Rossa";
import Brusco from "../algorithms/Brusco";
import Lip from "../algorithms/Lip";
import Holme from "../algorithms/Holme";
import Silva from "../algorithms/Silva";
import Minre from "../algorithms/Minre";
import Rombach from "../algorithms/Rombach";
import LowRankCore from "../algorithms/LowRankCore";

interface CPMetricProps {
  method: string | null;
  hoveredNode: string | null;
  onThresholdChange: (threshold: number) => void; // Add this prop
  setGraphData: React.Dispatch<
    React.SetStateAction<{
      nodes: NodeData[];
      edges: EdgeData[];
      core_indices: number[];
    }>
  >; // setGraphData를 props로 받아옴
}

const CPMetric: FC<CPMetricProps> = ({
  method = null,
  hoveredNode,
  onThresholdChange,
  setGraphData,
}) => {
  const sigma = useSigma(); // Sigma 인스턴스를 가져옴
  const graph = sigma.getGraph(); // Sigma로부터 그래프를 가져옴

  // 마우스를 그래프 위에서 움직일 때 하이라이트 갱신을 너무 자주 하지 않도록 디바운스 처리
  const debouncedHoveredNode = useDebounce(hoveredNode, 3); // 디바운스된 hoveredNode를 설정

  return (
    <div className="cpmetric">
      {method === "BE" && (
        <Borgatti method={method} setGraphData={setGraphData} />
      )}
      {method === "Brusco" && (
        <Brusco method={method} setGraphData={setGraphData} />
      )}
      {method === "Lip" && (
        <Lip
          hoveredNode={debouncedHoveredNode}
          method={method}
          setGraphData={setGraphData}
        />
      )}
      {method === "Holme" && (
        <Holme method={method} setGraphData={setGraphData} />
      )}
      {method === "Silva" && (
        <Silva
          hoveredNode={debouncedHoveredNode}
          method={method}
          setGraphData={setGraphData}
        />
      )}
      {method === "LLC" && (
        <LowRankCore
          hoveredNode={debouncedHoveredNode}
          method={method}
          setGraphData={setGraphData}
        />
      )}
      {method === "Rossa" && (
        <Rossa
          hoveredNode={debouncedHoveredNode}
          method={method}
          onThresholdChange={onThresholdChange}
          setGraphData={setGraphData} // Pass the callback
        />
      )}
      {method === "Minre" && (
        <Minre
          hoveredNode={debouncedHoveredNode}
          method={method}
          onThresholdChange={onThresholdChange}
          setGraphData={setGraphData} // Pass the callback
        />
      )}
      {method === "Rombach" && (
        <Rombach
          hoveredNode={debouncedHoveredNode}
          method={method}
          onThresholdChange={onThresholdChange}
          setGraphData={setGraphData} // Pass the callback
        />
      )}
    </div>
  );
};

export default CPMetric;

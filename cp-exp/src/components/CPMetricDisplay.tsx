import { useSetSettings, useSigma } from "@react-sigma/core"; // Sigma 설정 및 인스턴스를 가져옴
import { FC, useEffect } from "react";
import useDebounce from "../use_debounce"; // 디바운스 훅을 가져옴
import Borgatti from "./algorithms/BorgattiEverett";
import Rossa from "./algorithms/Rossa";

interface CPMetricProps {
  method: string;
  hoveredNode: string | null;
}

const CPMetric: FC<CPMetricProps> = ({ method = "Rossa", hoveredNode }) => {
  const sigma = useSigma(); // Sigma 인스턴스를 가져옴
  const setSettings = useSetSettings(); // Sigma 설정 함수를 가져옴
  const graph = sigma.getGraph(); // Sigma로부터 그래프를 가져옴

  // 마우스를 그래프 위에서 움직일 때 하이라이트 갱신을 너무 자주 하지 않도록 디바운스 처리
  const debouncedHoveredNode = useDebounce(hoveredNode, 3); // 디바운스된 hoveredNode를 설정

  return (
    <div className="cpmetric">
      {method === "BE" && <Borgatti />}
      {method === "Rossa" && <Rossa hoveredNode={debouncedHoveredNode} />}
    </div>
  );
};

export default CPMetric;

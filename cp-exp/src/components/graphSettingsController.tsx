import { useSetSettings, useSigma } from "@react-sigma/core"; // Sigma 설정 및 인스턴스를 가져옴
import { Attributes } from "graphology-types"; // graphology 타입 정의를 가져옴
import { FC, PropsWithChildren, useEffect, useRef } from "react"; // React 훅과 타입을 가져옴

import { drawHover, drawLabel } from "../canvas-utils"; // 커스텀 그리기 유틸리티를 가져옴
import useDebounce from "../use_debounce"; // 디바운스 훅을 가져옴

const NODE_FADE_COLOR = "#eee"; // 노드 페이드 색상
const EDGE_FADE_COLOR = "#eee"; // 엣지 페이드 색상

interface GraphSettingsControllerProps {
  hoveredNode: string | null;
}

const GraphSettingsController: FC<
  PropsWithChildren<GraphSettingsControllerProps>
> = ({ children, hoveredNode }) => {
  // GraphSettingsController 컴포넌트 정의
  const sigma = useSigma(); // Sigma 인스턴스를 가져옴
  const setSettings = useSetSettings(); // Sigma 설정 함수를 가져옴
  const graph = sigma.getGraph(); // Sigma로부터 그래프를 가져옴

  // 마우스를 그래프 위에서 움직일 때 하이라이트 갱신을 너무 자주 하지 않도록 디바운스 처리
  const debouncedHoveredNode = useDebounce(hoveredNode, 5); // 디바운스된 hoveredNode를 설정

  // 캐시된 노드 및 이웃 노드 데이터
  const lastHoveredNodeRef = useRef<string | null>(null);
  const cachedNeighborsRef = useRef<string[]>([]);

  const updateCache = (node: string | null) => {
    if (node && node !== lastHoveredNodeRef.current) {
      lastHoveredNodeRef.current = node;
      cachedNeighborsRef.current = Array.from(graph.neighbors(node))
        .map((neighbor) => ({
          node: neighbor,
          total_art: graph.getNodeAttribute(neighbor, "total_art") || 0,
        }))
        .sort((a, b) => b.total_art - a.total_art)
        .slice(0, 20)
        .map((neighbor) => neighbor.node);
    }
  };

  useEffect(() => {
    const hoveredColor: string =
      (debouncedHoveredNode &&
        sigma.getNodeDisplayData(debouncedHoveredNode)?.color) ||
      ""; // 호버된 노드의 색상을 가져옴

    updateCache(debouncedHoveredNode);

    const nodeReducer = (node: string, data: Attributes) => {
      if (debouncedHoveredNode) {
        const isHoveredNode = node === debouncedHoveredNode;
        const isNeighborNode = cachedNeighborsRef.current.includes(node);

        if (isHoveredNode || isNeighborNode) {
          return {
            ...data,
            zIndex: 1,
            label: data.label || node,
            highlighted: true,
          };
        }

        return {
          ...data,
          zIndex: 0,
          label: "",
          color: NODE_FADE_COLOR,
          image: null,
          highlighted: false,
        };
      }
      return data;
    };

    const edgeReducer = (edge: string, data: Attributes) => {
      if (debouncedHoveredNode) {
        const isConnectedEdge = graph.hasExtremity(edge, debouncedHoveredNode);

        return isConnectedEdge
          ? { ...data, color: hoveredColor, size: 4 }
          : { ...data, color: EDGE_FADE_COLOR, hidden: true };
      }
      return data;
    };

    setSettings({
      defaultDrawNodeLabel: drawLabel,
      defaultDrawNodeHover: drawHover,
      nodeReducer,
      edgeReducer,
    });
  }, [sigma, graph, debouncedHoveredNode, setSettings]); // 의존성 배열에 sigma, graph, debouncedHoveredNode, isContributor, setSettings 포함

  return <>{children}</>; // 자식 요소를 렌더링
};

export default GraphSettingsController; // GraphSettingsController 컴포넌트를 기본 내보내기로 설정

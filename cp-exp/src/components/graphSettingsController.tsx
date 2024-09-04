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
  const debouncedHoveredNode = useDebounce(hoveredNode, 3); // 디바운스된 hoveredNode를 설정

  // 캐시된 노드 및 이웃 노드 데이터
  const lastHoveredNodeRef = useRef<string | null>(null);
  const cachedNeighborsRef = useRef<string[]>([]);

  // 호버된 노드의 이웃 노드를 캐시에 저장하는 함수
  const updateCache = (node: string | null) => {
    if (node && node !== lastHoveredNodeRef.current) {
      // 이전에 저장된 호버 노드와 다른 경우만 처리
      lastHoveredNodeRef.current = node;
      cachedNeighborsRef.current = node
        ? graph.neighbors(node) // 호버된 노드의 이웃 노드를 가져옴
        : [];
    }
  };

  useEffect(() => {
    const hoveredColor: string =
      sigma.getNodeDisplayData(debouncedHoveredNode)?.color === "#FFFFFF"
        ? graph.getNodeAttribute(debouncedHoveredNode, "borderColor")
        : (debouncedHoveredNode &&
            sigma.getNodeDisplayData(debouncedHoveredNode)?.color) ||
          ""; // 호버된 노드의 색상을 가져옴

    updateCache(debouncedHoveredNode);

    const nodeReducer = (node: string, data: Attributes) => {
      if (debouncedHoveredNode) {
        const isHoveredNode = node === debouncedHoveredNode;
        const isNeighborNode = cachedNeighborsRef.current.includes(node);

        if (isHoveredNode) {
          return {
            ...data,
            zIndex: 1, // zIndex를 높게 설정하여 위에 렌더링되도록 함
            label: data.label || node, // 라벨 표시
            highlighted: true, // 하이라이트 적용
            color: data.color, // 원래 색상 유지
          };
        } else if (isNeighborNode) {
          return {
            ...data,
            zIndex: 1, // zIndex를 높게 설정하여 위에 렌더링되도록 함
            label: data.label || node, // 라벨 표시
            color: data.color, // 원래 색상 유지
            forceLabel: true,
          };
        }

        return {
          ...data,
          zIndex: 0,
          label: "", // 라벨 제거
          color: NODE_FADE_COLOR, // 페이드된 색상 적용
          borderColor: NODE_FADE_COLOR,
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
          ? { ...data, color: hoveredColor } // 연결된 엣지 원래 색상 유지
          : { ...data, color: EDGE_FADE_COLOR, hidden: false }; // 페이드된 엣지 색상
      }
      return data;
    };

    setSettings({
      defaultDrawNodeLabel: drawLabel, // 노드 라벨을 그리는 커스텀 함수
      defaultDrawNodeHover: drawHover, // 노드 호버 상태를 그리는 커스텀 함수
      nodeReducer,
      edgeReducer,
    });
  }, [sigma, graph, debouncedHoveredNode, setSettings]); // 의존성 배열에 sigma, graph, debouncedHoveredNode 포함

  return <>{children}</>; // 자식 요소를 렌더링
};

export default GraphSettingsController;

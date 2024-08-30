import { useRegisterEvents, useSigma } from "@react-sigma/core"; // Sigma 이벤트 등록 및 인스턴스를 가져옴
import { FC, PropsWithChildren, useEffect, useState } from "react"; // React 훅과 타입을 가져옴
import NodeDetailPanel from "./nodeDetailPanel";

import { Attributes } from "graphology-types";

function getMouseLayer() {
  return document.querySelector(".sigma-mouse"); // Sigma 마우스 레이어를 가져옴
}

const GraphEventsController: FC<
  PropsWithChildren<{ setHoveredNode: (node: string | null) => void }>
> = ({ setHoveredNode, children }) => {
  // GraphEventsController 컴포넌트 정의
  const sigma = useSigma(); // Sigma 인스턴스를 가져옴
  const graph = sigma.getGraph(); // Sigma로부터 그래프를 가져옴
  const registerEvents = useRegisterEvents(); // Sigma 이벤트 등록 함수를 가져옴
  const [draggedNode, setDraggedNode] = useState<string | null>(null); // 드래그된 노드 상태를 정의
  const [mouseDownTime, setMouseDownTime] = useState<number | null>(null); // 마우스 다운 시간 상태를 정의

  const [selectedNode, setSelectedNode] = useState<Attributes | null>(null); // set state of selected node
  const handleClose = () => setSelectedNode(null);

  /**
   * 그래프 및 Sigma 인스턴스를 알아야 하는 설정 초기화
   */
  useEffect(() => {
    registerEvents({
      clickNode({ node }) {
        // 노드 클릭 이벤트
        if (mouseDownTime && Date.now() - mouseDownTime < 200) {
          // 클릭 시간이 200ms 이하일 때
          if (!graph.getNodeAttribute(node, "hidden")) {
            // 노드가 숨겨져 있지 않다면
            const nodeAttributes = graph.getNodeAttributes(node);
            setSelectedNode(nodeAttributes);

            // 클릭된 노드와 연결된 노드들을 하이라이트 및 숨김 해제
            graph.updateEachNodeAttributes((_, attr) => {
              attr.highlighted = false;
              attr.hidden = true;
              return attr;
            });

            graph.setNodeAttribute(node, "highlighted", true);
            graph.setNodeAttribute(node, "hidden", false);

            graph.forEachNeighbor(node, (neighbor) => {
              graph.setNodeAttribute(neighbor, "highlighted", true);
              graph.setNodeAttribute(neighbor, "hidden", false);
            });
          }
        }
      },
      doubleClickNode(event) {
        // 노드 더블클릭 이벤트

        graph.setNodeAttribute(event.node, "highlighted", true); // 선택된 노드를 하이라이트
        const nodeDisplayData = sigma.getNodeDisplayData(event.node); // 선택된 노드의 디스플레이 데이터 가져옴

        if (nodeDisplayData)
          sigma.getCamera().animate(
            { ...nodeDisplayData, ratio: 0.25 }, // 노드로 카메라 애니메이션 이동
            {
              duration: 600, // 애니메이션 지속 시간 설정
            }
          );

        // 기본 더블 클릭 동작 방지
        event.preventSigmaDefault();
      },
      clickStage() {
        // 그래프의 배경을 클릭했을 때
        graph.forEachNode((node) => {});
        setSelectedNode(null); // 패널 닫기
      },
      enterNode({ node }) {
        // 노드에 마우스가 들어왔을 때
        setHoveredNode(node); // 호버된 노드 설정
        const mouseLayer = getMouseLayer(); // 마우스 레이어 가져오기
        if (mouseLayer) mouseLayer.classList.add("mouse-pointer"); // 마우스 포인터 클래스 추가

        // 호버된 노드와 연결된 노드들을 하이라이트
        graph.setNodeAttribute(node, "highlighted", true);
        graph.forEachNeighbor(node, (neighbor) => {
          graph.setNodeAttribute(neighbor, "highlighted", true);
        });
      },
      leaveNode({ node }) {
        // 노드에서 마우스가 나갔을 때
        setHoveredNode(null); // 호버된 노드를 null로 설정
        const mouseLayer = getMouseLayer(); // 마우스 레이어 가져오기
        if (mouseLayer) mouseLayer.classList.remove("mouse-pointer"); // 마우스 포인터 클래스 제거

        // 호버된 노드와 연결된 노드들의 하이라이트 해제
        graph.setNodeAttribute(node, "highlighted", false);
        graph.forEachNeighbor(node, (neighbor) => {
          graph.setNodeAttribute(neighbor, "highlighted", false);
        });
      },
      downNode: (e) => {
        // 노드를 마우스로 눌렀을 때
        setMouseDownTime(Date.now()); // 마우스 다운 시간 설정
        setDraggedNode(e.node); // 드래그된 노드 설정
        sigma.getGraph().setNodeAttribute(e.node, "highlighted", true); // 노드 하이라이트 설정
      },
      // 마우스 이동 시, 드래그 모드가 활성화된 경우 드래그된 노드의 위치를 변경
      mousemovebody: (e) => {
        if (!draggedNode) return;
        const pos = sigma.viewportToGraph(e); // 노드의 새로운 위치 가져오기
        sigma.getGraph().setNodeAttribute(draggedNode, "x", pos.x);
        sigma.getGraph().setNodeAttribute(draggedNode, "y", pos.y);

        e.preventSigmaDefault(); // Sigma의 기본 동작 방지
        e.original.preventDefault(); // 기본 마우스 동작 방지
        e.original.stopPropagation(); // 이벤트 전파 방지
      },
      // 마우스를 놓을 때, 자동 스케일 및 드래그 모드를 초기화
      mouseup: () => {
        if (draggedNode) {
          setDraggedNode(null);
          sigma.getGraph().removeNodeAttribute(draggedNode, "highlighted");
        }
        setMouseDownTime(null);
      },
      // 첫 번째 마우스 다운 상호작용에서 자동 스케일 비활성화
      mousedown: () => {
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
      },
    });
  }, [registerEvents, sigma, draggedNode, mouseDownTime, graph]); // 의존성 배열에 필요한 상태와 함수 포함

  return (
    <>
      {children}
      <NodeDetailPanel node={selectedNode} onClose={handleClose} />
    </>
  ); // 자식 요소를 렌더링 + node information
};

export default GraphEventsController; // GraphEventsController 컴포넌트를 기본 내보내기로 설정

import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { FC, PropsWithChildren, useEffect, useState } from "react";
import { Attributes } from "graphology-types";

function getMouseLayer() {
  return document.querySelector(".sigma-mouse");
}

const GraphEventsController: FC<
  PropsWithChildren<{
    setHoveredNode: (node: string | null) => void;
    onNodeClick?: (
      nodeAttributes: Attributes,
      neighborDetails: Array<{ label: string; attributes: Attributes }>
    ) => void;
  }>
> = ({ setHoveredNode, onNodeClick, children }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const registerEvents = useRegisterEvents();
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [mouseDownTime, setMouseDownTime] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<Attributes | null>(null);
  const [panelPosition, setPanelPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleClose = () => setSelectedNode(null);

  useEffect(() => {
    // 노드 클릭 시 패널의 위치를 마우스 클릭 위치로 설정
    registerEvents({
      clickNode({ node, event }) {
        if (mouseDownTime && Date.now() - mouseDownTime < 200) {
          const nodeAttributes = graph.getNodeAttributes(node);

          if (graph.getNodeAttribute(node, "clicked") === false) {
            const neighbors = graph.neighbors(node);

            const neighborDetails = neighbors
              .filter((neighborNode) => neighborNode !== node)
              .map((neighborNode) => {
                const neighborAttributes =
                  graph.getNodeAttributes(neighborNode);
                const neighborLabel = neighborAttributes.label || neighborNode;
                return {
                  label: neighborLabel,
                  attributes: neighborAttributes,
                };
              });

            graph.setNodeAttribute(node, "clicked", true);

            // 부모 컴포넌트로 nodeAttributes와 neighborDetails 전달
            if (onNodeClick) {
              onNodeClick(nodeAttributes, neighborDetails);
            }
          } else {
            setSelectedNode(nodeAttributes);

            // 패널 위치를 클릭한 위치로 설정
            setPanelPosition({
              x: event.original.clientX,
              y: event.original.clientY,
            });
          }
        }
      },
      clickStage() {
        graph.forEachNode((node) => {
          graph.setNodeAttribute(node, "clicked", false);
        });
        setSelectedNode(null);
        setPanelPosition(null); // 패널 숨기기
      },
      enterNode({ node }) {
        setHoveredNode(node);
        const mouseLayer = getMouseLayer();
        if (mouseLayer) mouseLayer.classList.add("mouse-pointer");

        graph.setNodeAttribute(node, "highlighted", true);
        graph.forEachNeighbor(node, (neighbor) => {
          graph.setNodeAttribute(neighbor, "highlighted", true);
        });
      },
      leaveNode({ node }) {
        setHoveredNode(null);
        const mouseLayer = getMouseLayer();
        if (mouseLayer) mouseLayer.classList.remove("mouse-pointer");

        graph.setNodeAttribute(node, "highlighted", false);
        graph.forEachNeighbor(node, (neighbor) => {
          graph.setNodeAttribute(neighbor, "highlighted", false);
        });
      },
      downNode: (e) => {
        setMouseDownTime(Date.now());
        setDraggedNode(e.node);
        sigma.getGraph().setNodeAttribute(e.node, "highlighted", true);
      },
      mousemovebody: (e) => {
        if (!draggedNode) return;
        const pos = sigma.viewportToGraph(e);
        sigma.getGraph().setNodeAttribute(draggedNode, "x", pos.x);
        sigma.getGraph().setNodeAttribute(draggedNode, "y", pos.y);

        e.preventSigmaDefault();
        e.original.preventDefault();
        e.original.stopPropagation();
      },
      mouseup: () => {
        if (draggedNode) {
          setDraggedNode(null);
          sigma.getGraph().removeNodeAttribute(draggedNode, "highlighted");
        }
        setMouseDownTime(null);
      },
      mousedown: () => {
        if (!sigma.getCustomBBox()) sigma.setCustomBBox(sigma.getBBox());
      },
    });
  }, [registerEvents, sigma, draggedNode, mouseDownTime, graph, onNodeClick]);

  return (
    <>
      {children}
      {panelPosition && selectedNode && (
        <div
          style={{
            position: "absolute",
            top: panelPosition.y,
            left: panelPosition.x,
            backgroundColor: "white",
            border: "1px solid black",
            padding: "10px",
            zIndex: 1000,
          }}
        >
          <div>Node Label: {selectedNode.label}</div>
          <button onClick={handleClose}>Close</button>
        </div>
      )}
    </>
  );
};

export default GraphEventsController;

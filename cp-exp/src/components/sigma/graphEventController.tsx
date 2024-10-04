import { useRegisterEvents, useSigma } from "@react-sigma/core";
import { FC, PropsWithChildren, useEffect, useState } from "react";
import { Attributes } from "graphology-types";
import NodeChangePanel from "../NodeChangePanel"; // Adjust the import path as needed
import { NodeData, EdgeData } from "../../types";

const GraphEventsController: FC<
  PropsWithChildren<{
    setHoveredNode: (node: string | null) => void;
    onNodeClick?: (
      nodeAttributes: Attributes,
      neighborDetails: Array<{ label: string; attributes: Attributes }>
    ) => void;
    method: string | null;
    threshold: number;
    setGraphData: React.Dispatch<
      React.SetStateAction<{
        nodes: NodeData[];
        edges: EdgeData[];
        core_indices: number[];
      }>
    >; // setGraphData를 props로 받아옴
  }>
> = ({
  setHoveredNode,
  onNodeClick,
  setGraphData,
  threshold,
  method,
  children,
}) => {
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
  const [refreshToggle, setRefreshToggle] = useState(false); // Trigger to refresh panels
  const [neighborDetails, setNeighborDetails] = useState<
    Array<{ label: string; attributes: Attributes }>
  >([]);

  const handleClose = () => setSelectedNode(null);

  const handleRefreshPanels = () => {
    setRefreshToggle(!refreshToggle); // Toggle to force re-render

    // Trigger onNodeClick after attributes change
    if (onNodeClick && selectedNode) {
      const neighbors = graph.neighbors(selectedNode.id);

      const updatedNeighborDetails = neighbors.map((neighborNode) => {
        const neighborAttributes = graph.getNodeAttributes(neighborNode);
        const neighborLabel = neighborAttributes.label || neighborNode;
        return {
          label: neighborLabel,
          attributes: neighborAttributes,
        };
      });

      onNodeClick(selectedNode, updatedNeighborDetails);
    }
  };

  useEffect(() => {
    registerEvents({
      clickNode({ node, event }) {
        if (mouseDownTime && Date.now() - mouseDownTime < 200) {
          const nodeAttributes = graph.getNodeAttributes(node);

          if (graph.getNodeAttribute(node, "clicked") === false) {
            graph.forEachNode((node) => {
              graph.setNodeAttribute(node, "clicked", false);
              graph.setNodeAttribute(node, "borderSize", 0.1);
            });
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
            graph.setNodeAttribute(node, "borderSize", 0.3);

            if (onNodeClick) {
              onNodeClick(nodeAttributes, neighborDetails);
            }
          } else {
            setSelectedNode(nodeAttributes);
            setNeighborDetails(neighborDetails); // Set neighbor details for refresh
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
          graph.setNodeAttribute(node, "borderSize", 0.1);
        });
        setSelectedNode(null);
        setPanelPosition(null);
      },
      enterNode({ node }) {
        setHoveredNode(node);
        graph.setNodeAttribute(node, "highlighted", true);
      },
      leaveNode({ node }) {
        setHoveredNode(null);
        graph.setNodeAttribute(node, "highlighted", false);
      },
      enterEdge({ edge }) {
        // Highlight both source and target nodes when edge is hovered
        const sourceNode = graph.source(edge);
        const targetNode = graph.target(edge);

        graph.setNodeAttribute(sourceNode, "highlighted", true);
        graph.setNodeAttribute(targetNode, "highlighted", true);

        // Highlight the edge itself
        graph.setEdgeAttribute(edge, "highlighted", true);
      },
      leaveEdge({ edge }) {
        // Unhighlight both source and target nodes when edge is no longer hovered
        const sourceNode = graph.source(edge);
        const targetNode = graph.target(edge);

        graph.setNodeAttribute(sourceNode, "highlighted", false);
        graph.setNodeAttribute(targetNode, "highlighted", false);

        // Unhighlight the edge itself
        graph.setEdgeAttribute(edge, "highlighted", false);
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
  }, [
    registerEvents,
    sigma,
    draggedNode,
    mouseDownTime,
    graph,
    onNodeClick,
    refreshToggle, // Re-run effect on refreshToggle change
  ]);

  return (
    <>
      {children}
      <NodeChangePanel
        panelPosition={panelPosition}
        selectedNode={selectedNode}
        onClose={handleClose}
        onRefreshPanels={handleRefreshPanels} // Pass the refresh function
        onNodeClick={onNodeClick} // Pass the onNodeClick to NodeChangePanel
        setGraphData={setGraphData}
        threshold={threshold}
        method={method}
      />
    </>
  );
};

export default GraphEventsController;

import React from "react";
import { useSigma } from "@react-sigma/core";

interface NodeLabelLinkProps {
  label: string;
  origin: string;
}

const NodeLabelLink: React.FC<NodeLabelLinkProps> = ({ label, origin }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const cluster = graph.getNodeAttribute(label, "cluster");

  const triggerNodeClickEvent = (label: string, origin: string) => {
    const nodeId = graph.findNode(
      (n) => graph.getNodeAttribute(n, "label") === label
    );
    if (nodeId) {
      // 클릭된 노드와 연결된 노드들을 하이라이트 및 숨김 해제
      graph.updateEachNodeAttributes((_, attr) => {
        attr.highlighted = false;
        attr.hidden = true;
        return attr;
      });

      graph.setNodeAttribute(nodeId, "highlighted", true);
      graph.setNodeAttribute(nodeId, "hidden", false);

      graph.forEachNeighbor(origin, (neighbor) => {
        if (graph.getNodeAttribute(neighbor, "filter_hidden") === false) {
          graph.setNodeAttribute(neighbor, "hidden", false);
        }
      });
      graph.setNodeAttribute(origin, "hidden", false);
    } else {
      alert("Node not found");
    }
  };

  return (
    <>
      {
        <>
          <button
            className="neighbor-link"
            onClick={(e) => {
              e.preventDefault();
              triggerNodeClickEvent(label, origin);
            }}
          >
            {label}
          </button>
        </>
      }
    </>
  );
};

export default NodeLabelLink;

import React, { useState } from "react";
import { Attributes } from "graphology-types";
import Accordion, { AccordionHandle } from "./sub/Accordion";
import styled from "styled-components";
import SmallAccordion from "./sub/SmallAccordion";
import Tooltip from "./sub/Tooltip";
import OverviewItem from "./sub/OverviewItem";

interface NodeDetailsPanelProps {
  nodeAttributes: Attributes | null;
  neighborDetails: Array<{ label: string; attributes: Attributes }> | null;
}

const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  nodeAttributes,
  neighborDetails,
}) => {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const handleCopy = (
    text: string,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setTooltip({
          text: "Number Copied!",
          x: event.clientX,
          y: event.clientY,
        });
        setTimeout(() => setTooltip(null), 1000); // 1초 후에 tooltip 숨기기
      },
      (err) => {
        console.error("Failed to copy: ", err);
      }
    );
  };

  const nodeLabel = nodeAttributes?.label;
  const nodeColor = nodeAttributes?.color;
  const nodeDegree = nodeAttributes?.degree || 0;
  const isCore = nodeAttributes?.core_periphery === 1;
  const corePeripheryCount = neighborDetails
    ? neighborDetails.filter(
        (neighbor) => neighbor.attributes.core_periphery === 1
      ).length
    : 0;

  // 비율 계산 (퍼센트)
  const percentage =
    nodeDegree > 0 ? ((corePeripheryCount / nodeDegree) * 100).toFixed(2) : "0";

  return (
    <Accordion
      title={
        !nodeAttributes ? (
          <div>No selected Node.</div>
        ) : (
          <>
            {nodeColor && (
              <div
                style={{
                  width: "15px",
                  height: "15px",
                  backgroundColor: nodeColor,
                  borderColor: nodeAttributes?.borderColor,
                  marginRight: "10px",
                  border: "1px solid #000",
                  display: "inline-block", // Add this to match the inline style of the title
                  borderRadius: "50%", // 원형으로 만들기 위해 반지름을 50%로 설정
                }}
              />
            )}
            {nodeLabel} {isCore && <span>(Core Node)</span>}
          </>
        )
      }
      isOpen={true}
    >
      {!nodeAttributes ? (
        <div>Select a node to see its details</div>
      ) : (
        <>
          <Container>
            <Row>
              <OverviewItem
                label="Degree"
                value={nodeDegree.toString()}
                onCopy={handleCopy}
              />
            </Row>
            <Row>
              <OverviewItem
                label="Degree Centrality"
                value={nodeAttributes?.degree_centrality.toFixed(4)}
                onCopy={handleCopy}
              />
            </Row>
            <Row>
              <OverviewItem
                label="Betweenness Centrality"
                value={nodeAttributes?.betweenness_centrality.toFixed(4)}
                onCopy={handleCopy}
              />
            </Row>
            <Row>
              <OverviewItem
                label="Closeness Centrality"
                value={nodeAttributes?.closeness_centrality.toFixed(4)}
                onCopy={handleCopy}
              />
            </Row>
            <Row>
              <OverviewItem
                label="Eigenvector Centrality"
                value={nodeAttributes?.eigenvector_centrality.toFixed(4)}
                onCopy={handleCopy}
              />
            </Row>
          </Container>

          {tooltip && (
            <Tooltip text={tooltip.text} x={tooltip.x} y={tooltip.y} />
          )}
        </>
      )}
    </Accordion>
  );
};

export default NodeDetailsPanel;

// Styled components
const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
`;

const Column = styled.div`
  width: 48%; /* 두 열로 나누기 위해 각 열의 너비를 50%보다 약간 작게 설정 */
`;

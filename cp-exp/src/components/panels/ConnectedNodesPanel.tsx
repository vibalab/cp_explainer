import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { Attributes } from "graphology-types";
import Accordion from "../sub/Accordion";

interface ConnectedNodesProps {
  nodeAttributes: Attributes | null;
  neighborDetails: Array<{ label: string; attributes: Attributes }> | null;
  threshold: number;
}

const ConnectedNodes: React.FC<ConnectedNodesProps> = ({
  nodeAttributes,
  neighborDetails,
  threshold,
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
  const isCore = nodeAttributes?.core_periphery >= threshold;

  // Filter neighborDetails based on the threshold
  const [coreNeighbors, setCoreNeighbors] = useState<
    Array<{ label: string; attributes: Attributes }>
  >([]);
  const [peripheryNeighbors, setPeripheryNeighbors] = useState<
    Array<{ label: string; attributes: Attributes }>
  >([]);

  useEffect(() => {
    if (neighborDetails) {
      // Update the core and periphery neighbor counts when threshold changes
      const cores = neighborDetails.filter(
        (neighbor) => neighbor.attributes.core_periphery >= threshold
      );
      const peripheries = neighborDetails.filter(
        (neighbor) => neighbor.attributes.core_periphery < threshold
      );

      setCoreNeighbors(cores);
      setPeripheryNeighbors(peripheries);
    }
  }, [neighborDetails, threshold]);

  // 비율 계산 (퍼센트)
  const percentage =
    nodeDegree > 0
      ? ((coreNeighbors.length / nodeDegree) * 100).toFixed(2)
      : "0";

  return (
    <Accordion
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          Connected Nodes of{" "}
          {nodeColor && (
            <div
              style={{
                width: "15px",
                height: "15px",
                backgroundColor: nodeColor,
                borderColor: nodeAttributes?.borderColor,
                margin: "0 5px 0 10px", // 왼쪽과 오른쪽에 여유 공간 추가
                border: "1px solid #000",
                borderRadius: "50%", // 원형으로 만들기 위해 반지름을 50%로 설정
                display: "inline-block",
              }}
            />
          )}
          {nodeLabel}
        </div>
      }
      autoResize={true}
    >
      <div>
        {coreNeighbors.length}/{nodeDegree} ({percentage}%) of Cores
      </div>
      <Container>
        <Column>
          <h4>Cores</h4>
          <ul>
            {coreNeighbors.map((neighbor, index) => (
              <li key={index} style={{ display: "flex", alignItems: "center" }}>
                {neighbor.attributes.color && (
                  <div
                    style={{
                      width: "15px",
                      height: "15px",
                      backgroundColor: neighbor.attributes.color,
                      borderColor: neighbor.attributes.borderColor,
                      marginRight: "10px",
                      border: "1px solid #000",
                      borderRadius: "50%", // 원형으로 만들기 위해 반지름을 50%로 설정
                    }}
                  />
                )}
                {neighbor.label}
              </li>
            ))}
          </ul>
        </Column>
        <Column>
          <h4>Peripheries</h4>
          <ul>
            {peripheryNeighbors.map((neighbor, index) => (
              <li key={index} style={{ display: "flex", alignItems: "center" }}>
                {neighbor.attributes.color && (
                  <div
                    style={{
                      width: "15px",
                      height: "15px",
                      backgroundColor: neighbor.attributes.color,
                      borderColor: neighbor.attributes.borderColor,
                      marginRight: "10px",
                      border: "1px solid #000",
                      borderRadius: "50%", // 원형으로 만들기 위해 반지름을 50%로 설정
                    }}
                  />
                )}
                {neighbor.label}
              </li>
            ))}
          </ul>
        </Column>
      </Container>
    </Accordion>
  );
};

export default ConnectedNodes;

// Styled components
const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const Column = styled.div`
  width: 48%; /* 두 열로 나누기 위해 각 열의 너비를 50%보다 약간 작게 설정 */
`;

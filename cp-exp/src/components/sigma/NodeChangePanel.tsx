import { useSigma } from "@react-sigma/core";
import { FC, useEffect, useState } from "react";
import { Attributes } from "graphology-types";
import { getHSLColor } from "../sub/colorUtils";
import { NodeData, EdgeData } from "../../types";
import { createGraphData } from "../sub/metricService"; // metricService 가져오기
import styled from "styled-components";

const PanelContainer = styled.div<{ x: number; y: number }>`
  position: absolute;
  top: ${(props) => props.y}px;
  left: ${(props) => props.x}px;
  background-color: #fff;
  border: 1px solid #ced4da;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.1);
  z-index: 10000;
  font-family: "Arial", sans-serif;
  width: 280px;
`;

const ToggleButton = styled.button<{ isHovered: boolean }>`
  display: block;
  width: 100%;
  background-color: ${(props) => (props.isHovered ? "#87CEEB" : "#fff")};
  color: ${(props) => (props.isHovered ? "#fff" : "#000")};
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  font-family: "Arial", sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #87ceeb;
    color: #fff;
  }
`;

const StatsContainer = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
`;

const StatText = styled.p<{ color?: string }>`
  margin: 4px 0;
  font-size: 14px;
  font-family: "Arial", sans-serif;
  color: ${(props) =>
    props.color || "black"}; /* Default to black if no color is passed */
  strong {
    font-weight: bold;
  }
`;
const StatFlexRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  align-items: center;
`;

const P00Container = styled.div`
  flex: 1;
  text-align: left;
`;

const P11Container = styled.div`
  flex: 1;
  text-align: center;
`;

const SubHeader = styled.p`
  font-size: 14px;
  font-weight: bold;
  margin-top: 16px;
  font-family: "Arial", sans-serif;
`;

const ConnectionValue = styled.span<{ highlight?: boolean }>`
  color: ${(props) =>
    props.highlight
      ? "green"
      : "black"}; /* Conditional green, otherwise black */
  font-weight: ${(props) => (props.highlight ? "bold" : "normal")};
  font-family: "Arial", sans-serif;
`;

interface ConnectionProbabilities {
  coreCore: { possible: number; actual: number };
  corePeriphery: { possible: number; actual: number };
  peripheryPeriphery: { possible: number; actual: number };
}

const NodeChangePanel: FC<{
  panelPosition: { x: number; y: number } | null;
  selectedNode: Attributes | null;
  onClose: () => void;
  onRefreshPanels: () => void;
  onNodeClick?: (
    nodeAttributes: Attributes,
    neighborDetails: Array<{ label: string; attributes: Attributes }>
  ) => void;
  threshold: number;
  method: string | null;
  setGraphData: React.Dispatch<
    React.SetStateAction<{
      nodes: NodeData[];
      edges: EdgeData[];
      core_indices: number[];
    }>
  >;
  connectionProbabilities: ConnectionProbabilities | null;
  closenessCentralityAvg: number | null;
}> = ({
  panelPosition,
  selectedNode,
  onClose,
  setGraphData,
  onRefreshPanels,
  onNodeClick,
  threshold,
  method,
  connectionProbabilities,
  closenessCentralityAvg,
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [buttonLabel, setButtonLabel] = useState("Toggle Core/Periphery");
  const [isHovered, setIsHovered] = useState(false);
  const [totCoreConn, setTotCoreConn] = useState<number | null>(null);
  const [propCoreConn, setPropCoreConn] = useState<number | null>(null);
  const [closeCentrality, setCloseCentrality] = useState<number | null>(null); // New state for centrality ratio
  const [deltaP00, setDeltaP00] = useState<number | null>(null);
  const [deltaP11, setDeltaP11] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedNode) return;

    const currentCorePeriphery = graph.getNodeAttribute(
      selectedNode.id,
      "core_periphery"
    );

    const label =
      currentCorePeriphery >= threshold
        ? "Toggle to Periphery"
        : "Toggle to Core";
    setButtonLabel(label);
  }, [graph, selectedNode, threshold]);

  const toggleAttributes = () => {
    if (!selectedNode) return;

    const currentCorePeriphery = graph.getNodeAttribute(
      selectedNode.id,
      "core_periphery"
    );

    const newCorePeriphery = currentCorePeriphery === 1 ? 0 : 1;
    graph.setNodeAttribute(selectedNode.id, "core_periphery", newCorePeriphery);

    const currentColor = graph.getNodeAttribute(selectedNode.id, "color");
    const newColor =
      currentColor === getHSLColor(197, 71, 73, 1)
        ? "#FFFFFF"
        : getHSLColor(197, 71, 73, 1);
    graph.setNodeAttribute(selectedNode.id, "color", newColor);

    const currentBorderColor = graph.getNodeAttribute(
      selectedNode.id,
      "borderColor"
    );
    const newBorderColor =
      currentBorderColor === getHSLColor(197, 71, 73, 1)
        ? "#000000"
        : getHSLColor(197, 71, 73, 1);
    graph.setNodeAttribute(selectedNode.id, "borderColor", newBorderColor);
    const graphData = createGraphData(graph);
    setGraphData(graphData);

    const newButtonLabel =
      newCorePeriphery >= threshold ? "Toggle to Periphery" : "Toggle to Core";
    setButtonLabel(newButtonLabel);

    onRefreshPanels();

    if (onNodeClick) {
      const neighbors = graph.neighbors(selectedNode.id);
      const neighborDetails = neighbors.map((neighborNode) => {
        const neighborAttributes = graph.getNodeAttributes(neighborNode);
        const neighborLabel = neighborAttributes.label || neighborNode;
        return {
          label: neighborLabel,
          attributes: neighborAttributes,
        };
      });

      onNodeClick(selectedNode, neighborDetails);
    }
  };

  const calcExp = (connectionProbabilities: any) => {
    if (!selectedNode) return;

    const coreNodes: string[] = [];
    const peripheryNodes: string[] = [];
    const neighborCoreNodes: string[] = [];
    const neighborPeriNodes: string[] = [];
    const selectedCorePeriphery = graph.getNodeAttribute(
      selectedNode.id,
      "core_periphery"
    );
    const selectedDegree = graph.getNodeAttribute(selectedNode.id, "degree");
    const selectedCloseCentrality = graph.getNodeAttribute(
      selectedNode.id,
      "closeness_centrality"
    );
    const { coreCore, corePeriphery, peripheryPeriphery } =
      connectionProbabilities;
    const p00Value =
      peripheryPeriphery.possible > 0
        ? peripheryPeriphery.actual / peripheryPeriphery.possible
        : 0;
    const p11Value =
      coreCore.possible > 0 ? coreCore.actual / coreCore.possible : 0;

    // Calculate the ratio of selectedCloseCentrality to closenessCentralityAvg
    if (
      closenessCentralityAvg !== null &&
      selectedCloseCentrality !== undefined &&
      selectedCloseCentrality !== null
    ) {
      const ratio = selectedCloseCentrality / closenessCentralityAvg;
      setCloseCentrality(ratio);
    }

    // Continue with other core-periphery calculations
    graph.forEachNode((node) => {
      const corePeriphery = graph.getNodeAttribute(node, "core_periphery");
      if (typeof corePeriphery === "number" && corePeriphery >= threshold) {
        coreNodes.push(node);
      } else {
        peripheryNodes.push(node);
      }
    });

    graph.forEachNeighbor(selectedNode.id, (neighbor) => {
      const neighborCorePeriphery = graph.getNodeAttribute(
        neighbor,
        "core_periphery"
      );
      if (
        typeof neighborCorePeriphery === "number" &&
        neighborCorePeriphery >= threshold
      ) {
        neighborCoreNodes.push(neighbor);
      } else {
        neighborPeriNodes.push(neighbor);
      }
    });

    const nCoreNodes = coreNodes.length;
    const nPeripheryNodes = peripheryNodes.length;

    if (selectedCorePeriphery >= threshold) {
      const totCoreConn =
        nCoreNodes >= 2 ? neighborCoreNodes.length / (nCoreNodes - 1) : 0;
      const propCoreConn =
        selectedDegree >= 1 ? neighborCoreNodes.length / selectedDegree : 0;

      const pp_possible = ((nPeripheryNodes + 1) * nPeripheryNodes) / 2;
      const cc_possible = ((nCoreNodes - 1) * (nCoreNodes - 2)) / 2;

      const pp_actual = peripheryPeriphery.actual + neighborPeriNodes.length;
      const cc_actual = coreCore.actual - neighborCoreNodes.length;

      const newP00 = pp_actual / pp_possible;
      const newP11 = cc_actual / cc_possible;
      const deltaP00 = p00Value - newP00;
      const deltaP11 = p11Value - newP11;

      setTotCoreConn(totCoreConn);
      setPropCoreConn(propCoreConn);
      setDeltaP00(deltaP00);
      setDeltaP11(deltaP11);
    } else {
      const totCoreConn =
        nCoreNodes >= 2 ? neighborCoreNodes.length / nCoreNodes : 0;
      const propCoreConn =
        selectedDegree >= 1 ? neighborCoreNodes.length / selectedDegree : 0;

      const pp_possible = ((nPeripheryNodes - 1) * (nPeripheryNodes - 2)) / 2;
      const cc_possible = ((nCoreNodes + 1) * nCoreNodes) / 2;

      const pp_actual = peripheryPeriphery.actual - neighborPeriNodes.length;
      const cc_actual = coreCore.actual + neighborCoreNodes.length;

      const newP00 = pp_actual / pp_possible;
      const newP11 = cc_actual / cc_possible;
      const deltaP00 = p00Value - newP00;
      const deltaP11 = p11Value - newP11;

      setTotCoreConn(totCoreConn);
      setPropCoreConn(propCoreConn);
      setDeltaP00(deltaP00);
      setDeltaP11(deltaP11);
    }
  };

  useEffect(() => {
    if (connectionProbabilities) {
      calcExp(connectionProbabilities);
    }
  }, [selectedNode, connectionProbabilities, closenessCentralityAvg]); // Added closenessCentralityAvg to the dependencies

  if (!panelPosition || !selectedNode) return null;

  const adjustedX = Math.min(panelPosition.x, window.innerWidth - 550);
  const adjustedY = Math.min(panelPosition.y, window.innerHeight - 300);

  return (
    <PanelContainer x={panelPosition.x} y={panelPosition.y}>
      {method !== "Rossa" && (
        <ToggleButton
          onClick={toggleAttributes}
          isHovered={isHovered}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {buttonLabel}
        </ToggleButton>
      )}

      <StatsContainer>
        <StatText>
          <strong>Total Core Connection Ratio:</strong>{" "}
          {totCoreConn !== null ? totCoreConn.toFixed(2) : "N/A"}
        </StatText>

        <StatText>
          <strong>Proportion Core Connection:</strong>{" "}
          {propCoreConn !== null ? propCoreConn.toFixed(2) : "N/A"}
        </StatText>

        <StatText>
          <strong>VS. AVG Closeness Centrality:</strong>{" "}
          <ConnectionValue
            highlight={closeCentrality !== null && closeCentrality >= 1.5}
          >
            {closeCentrality !== null ? closeCentrality.toFixed(2) : "N/A"}
          </ConnectionValue>
        </StatText>

        <SubHeader>Current Allocation Affects:</SubHeader>

        <StatFlexRow>
          <P00Container>
            <StatText
              color={
                deltaP00 !== null && Math.abs(deltaP00) < 0.01
                  ? "black"
                  : deltaP00 !== null && deltaP00 < 0
                  ? "green"
                  : "red"
              }
            >
              <strong>
                p<sub>00</sub>:
              </strong>{" "}
              {deltaP00 !== null ? deltaP00.toFixed(4) : "N/A"}
            </StatText>
          </P00Container>

          <P11Container>
            <StatText
              color={
                deltaP11 !== null && Math.abs(deltaP11) < 0.01
                  ? "black"
                  : deltaP11 !== null && deltaP11 > 0
                  ? "green"
                  : "red"
              }
            >
              <strong>
                p<sub>11</sub>:
              </strong>{" "}
              {deltaP11 !== null ? deltaP11.toFixed(4) : "N/A"}
            </StatText>
          </P11Container>
        </StatFlexRow>
      </StatsContainer>
    </PanelContainer>
  );
};

export default NodeChangePanel;

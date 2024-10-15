import React, { useState, useEffect } from "react";
import Accordion from "../sub/Accordion";
import CorePeripheryTable from "../sub/CorePeripheryTable";
import Tooltip from "../sub/Tooltip";
import { NodeData, EdgeData } from "../../types";

interface ConnectionProbabilities {
  coreCore: { possible: number; actual: number };
  corePeriphery: { possible: number; actual: number };
  peripheryPeriphery: { possible: number; actual: number };
}

interface ConnectionProbPanelProps {
  connectionProbabilities: ConnectionProbabilities | null;
  graphData: {
    nodes: NodeData[];
    edges: EdgeData[];
    core_indices: number[];
  };
}

const ConnectionProbPanel: React.FC<ConnectionProbPanelProps> = ({
  connectionProbabilities,
  graphData,
}) => {
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const [p00, setP00] = useState<number>(0);
  const [p01, setP01] = useState<number>(0);
  const [p11, setP11] = useState<number>(0);
  const [p, setP] = useState<number>(0);
  const [hasCorePeripheryStructure, setHasCorePeripheryStructure] =
    useState<boolean>(false);

  const handleCopy = (
    text: string,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setTooltip({
          text: "Copied!",
          x: event.clientX,
          y: event.clientY,
        });
        setTimeout(() => setTooltip(null), 1000); // Hide tooltip after 1 second
      },
      (err) => {
        console.error("Failed to copy: ", err);
      }
    );
  };

  const probCal = () => {
    if (!connectionProbabilities) return;

    const { coreCore, corePeriphery, peripheryPeriphery } =
      connectionProbabilities;

    // Calculate p00, p01, and p11
    const p00Value =
      peripheryPeriphery.possible > 0
        ? peripheryPeriphery.actual / peripheryPeriphery.possible
        : 0;
    const p01Value =
      corePeriphery.possible > 0
        ? corePeriphery.actual / corePeriphery.possible
        : 0;
    const p11Value =
      coreCore.possible > 0 ? coreCore.actual / coreCore.possible : 0;

    // Overall p calculation
    const pValue =
      coreCore.possible + corePeriphery.possible + peripheryPeriphery.possible >
      0
        ? (coreCore.actual + corePeriphery.actual + peripheryPeriphery.actual) /
          (coreCore.possible +
            corePeriphery.possible +
            peripheryPeriphery.possible)
        : 0;

    // Check if the network has a Core-Periphery structure
    const hasCPStructure = p11Value > p01Value && p01Value > p00Value;

    // Update state with calculated values
    setP00(p00Value);
    setP01(p01Value);
    setP11(p11Value);
    setP(pValue);
    setHasCorePeripheryStructure(hasCPStructure);
  };

  useEffect(() => {
    if (graphData) {
      probCal();
    }
  }, [graphData, connectionProbabilities]);

  // If connectionProbabilities are not available yet, show loading or an error message
  if (!connectionProbabilities) {
    return <div>Loading connection probabilities...</div>;
  }

  return (
    <Accordion title="Connection Probability Table" isOpen={false}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        {/* Core-Periphery Probability Table */}
        <CorePeripheryTable p00={p00} p01={p01} p11={p11} />
      </div>
      <div>
        <br />
        <strong style={{ fontSize: "12px" }}>
          Total Connection Prob(p): {p.toFixed(2)}
        </strong>
        <br />
        {/* Display message based on Core-Periphery structure condition */}
        {hasCorePeripheryStructure ? (
          <div style={{ color: "green", fontSize: "12px", marginTop: "10px" }}>
            The network exhibits a Core-Periphery Structure under the Stochastic
            Block Model.
          </div>
        ) : (
          <div style={{ color: "red", fontSize: "12px", marginTop: "10px" }}>
            The network does not satisfy the Core-Periphery Structure.
          </div>
        )}
      </div>
      <br />
      {/* Connection Information Table */}
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          textAlign: "center",
        }}
      >
        <thead>
          <tr>
            <th style={{ border: "1px solid gray", padding: "5px" }}></th>
            <th style={{ border: "1px solid gray", padding: "5px" }}>
              (Actual) / (Possible)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              Core-Core
            </td>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              {connectionProbabilities.coreCore.actual}/
              {connectionProbabilities.coreCore.possible}
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              Core-Peri
            </td>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              {connectionProbabilities.corePeriphery.actual}/
              {connectionProbabilities.corePeriphery.possible}
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              Peri-Peri
            </td>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              {connectionProbabilities.peripheryPeriphery.actual}/
              {connectionProbabilities.peripheryPeriphery.possible}
            </td>
          </tr>
        </tbody>
      </table>
      {tooltip && <Tooltip text={tooltip.text} x={tooltip.x} y={tooltip.y} />}
    </Accordion>
  );
};

export default ConnectionProbPanel;

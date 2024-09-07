import React, { useState, useEffect } from "react";
import Accordion from "./sub/Accordion";
import CorePeripheryTable from "./sub/CorePeripheryTable";
import Tooltip from "./sub/Tooltip";
import Sigma from "sigma";
import { NodeData, EdgeData } from "../types";
import { SigmaContainer } from "@react-sigma/core";

interface ConnectionProbabilities {
  coreCore: { possible: number; actual: number };
  corePeriphery: { possible: number; actual: number };
  peripheryPeriphery: { possible: number; actual: number };
}

interface ConnectionProbPanelProps {
  connectionProbabilities: ConnectionProbabilities | null;
}

const ConnectionProbPanel: React.FC<ConnectionProbPanelProps> = ({
  connectionProbabilities,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

  // If connectionProbabilities are not available yet, show loading or an error message
  if (!connectionProbabilities) {
    return <div>Loading connection probabilities...</div>;
  }

  const { coreCore, corePeriphery, peripheryPeriphery } =
    connectionProbabilities;

  // Calculate p00, p01, and p11 as numbers
  const p00 = peripheryPeriphery.actual / peripheryPeriphery.possible;
  const p01 = corePeriphery.actual / corePeriphery.possible;
  const p11 = coreCore.actual / coreCore.possible;

  // Overall p
  const p =
    (coreCore.actual + corePeriphery.actual + peripheryPeriphery.actual) /
    (coreCore.possible + corePeriphery.possible + peripheryPeriphery.possible);

  return (
    <Accordion title="Connection Probability" isOpen={false}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        {/* Core-Periphery Probability Table */}
        <CorePeripheryTable p00={p00} p01={p01} p11={p11} />
      </div>
      <div>
        <br></br>
        <strong style={{ fontSize: "12px" }}>
          Total Connection Prob(p): {p.toFixed(2)}
        </strong>
      </div>{" "}
      {/* Apply .toFixed when rendering */}
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
              Possible
            </th>
            <th style={{ border: "1px solid gray", padding: "5px" }}>Actual</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid gray", padding: "5px" }}>C-C</td>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              {coreCore.possible}
            </td>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              {coreCore.actual}
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid gray", padding: "5px" }}>C-P</td>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              {corePeriphery.possible}
            </td>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              {corePeriphery.actual}
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid gray", padding: "5px" }}>P-P</td>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              {peripheryPeriphery.possible}
            </td>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              {peripheryPeriphery.actual}
            </td>
          </tr>
        </tbody>
      </table>
      {tooltip && <Tooltip text={tooltip.text} x={tooltip.x} y={tooltip.y} />}
    </Accordion>
  );
};

export default ConnectionProbPanel;

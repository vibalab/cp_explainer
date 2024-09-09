import React, { useState } from "react";
import Accordion from "./sub/Accordion";
import CorePeripheryTable from "./sub/CorePeripheryTable";
import Tooltip from "./sub/Tooltip";

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

  // Check if the network has a Core-Periphery structure
  const hasCorePeripheryStructure = p11 > p01 && p01 > p00;

  return (
    <Accordion title="Connection Probability" isOpen={false}>
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
              {coreCore.actual}/{coreCore.possible}
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              Core-Peri
            </td>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              {corePeriphery.actual}/{corePeriphery.possible}
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              Peri-Peri
            </td>
            <td style={{ border: "1px solid gray", padding: "5px" }}>
              {peripheryPeriphery.actual}/{peripheryPeriphery.possible}
            </td>
          </tr>
        </tbody>
      </table>
      {tooltip && <Tooltip text={tooltip.text} x={tooltip.x} y={tooltip.y} />}
    </Accordion>
  );
};

export default ConnectionProbPanel;

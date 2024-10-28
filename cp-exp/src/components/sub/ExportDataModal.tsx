import React, { useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { NodeData, EdgeData } from "../../types";

interface GraphData {
  nodes: NodeData[];
  edges: EdgeData[];
  core_indices: number[];
}

interface ExportGraphDataProps {
  graphData: GraphData;
  isOpen: boolean;
  onClose: () => void;
}

const ExportGraphData: React.FC<ExportGraphDataProps> = ({
  graphData,
  isOpen,
  onClose,
}) => {
  const [fileName, setFileName] = useState("graph_data");
  const [fileFormat, setFileFormat] = useState("json");

  const handleFileExport = () => {
    if (fileFormat === "json") exportAsJson();
    else if (fileFormat === "csv") exportAsCsv();
    else if (fileFormat === "xlsx") exportAsXlsx();
  };

  const exportAsJson = () => {
    const jsonData = JSON.stringify(graphData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    saveAs(blob, `${fileName}.json`);
  };

  const exportAsCsv = () => {
    const nodeCsv = graphData.nodes
      .map(
        (node) =>
          `${node.id},${node.key},${node.label},${node.x},${node.y},${
            node.degree
          },${node.degree_centrality},${node.betweenness_centrality},${
            node.closeness_centrality
          },${node.eigenvector_centrality},${node.core_periphery},${
            node.core_periphery_score
          },${node.group},${JSON.stringify(node.attributes)}`
      )
      .join("\n");
    const edgeCsv = graphData.edges
      .map(
        (edge) =>
          `${edge.source},${edge.target},${edge.weight},${JSON.stringify(
            edge.attributes
          )}`
      )
      .join("\n");

    const csvData = `Nodes\nid,key,label,x,y,degree,degree_centrality,betweenness_centrality,closeness_centrality,eigenvector_centrality,core_periphery,core_periphery_score,group,attributes\n${nodeCsv}\n\nEdges\nsource,target,weight,attributes\n${edgeCsv}`;
    const blob = new Blob([csvData], { type: "text/csv" });
    saveAs(blob, `${fileName}.csv`);
  };

  const exportAsXlsx = () => {
    const nodeSheet = XLSX.utils.json_to_sheet(graphData.nodes);
    const edgeSheet = XLSX.utils.json_to_sheet(graphData.edges);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, nodeSheet, "Nodes");
    XLSX.utils.book_append_sheet(workbook, edgeSheet, "Edges");

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <div style={modalOverlayStyles}>
      <div style={modalContentStyles}>
        <h3>Export Graph Data</h3>
        {"File Name:"}
        <input
          type="text"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          placeholder="Enter file name"
          style={{ marginBottom: "10px", width: "100%" }}
        />
        {"File Format:"}
        <select
          value={fileFormat}
          onChange={(e) => setFileFormat(e.target.value)}
          style={{ marginBottom: "10px", width: "100%" }}
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="xlsx">XLSX</option>
        </select>
        <button onClick={handleFileExport}>Export</button>
        <button onClick={onClose} style={{ marginTop: "10px" }}>
          Close
        </button>
      </div>
    </div>
  );
};

const modalOverlayStyles: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalContentStyles: React.CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "white",
  padding: "20px",
  zIndex: 1000,
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  width: "300px",
  borderRadius: "10px",
  border: "1px solid black",
};

export default ExportGraphData;

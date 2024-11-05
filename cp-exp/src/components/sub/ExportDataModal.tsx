import React, { useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import styled from "styled-components";
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
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <h3>Export Graph Data</h3>
        <label>
          File Name:
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="Enter file name"
            style={{ marginBottom: "10px", width: "100%" }}
          />
        </label>
        <label>
          File Format:
          <select
            value={fileFormat}
            onChange={(e) => setFileFormat(e.target.value)}
            style={{ marginBottom: "10px", width: "100%" }}
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
          </select>
        </label>
        <ButtonContainer>
          <StyledButton onClick={handleFileExport}>Export</StyledButton>
          <StyledButton onClick={onClose}>Close</StyledButton>
        </ButtonContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

// Styled components for modal and buttons
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 300px;
  border-radius: 10px;
  border: 1px solid black;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`;

const StyledButton = styled.button<{ $isHovered?: boolean }>`
  display: block;
  width: 45%;
  background-color: ${(props) => (props.$isHovered ? "#87CEEB" : "#fff")};
  color: ${(props) => (props.$isHovered ? "#fff" : "#000")};
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  font-family: "Arial", sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #87ceeb;
    color: #fff;
  }
`;

export default ExportGraphData;

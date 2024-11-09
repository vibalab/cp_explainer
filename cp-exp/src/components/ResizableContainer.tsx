import React, { useState, useRef, useEffect } from "react";
import Root from "./graphRoot";
import OverveiwPanel from "./panels/OverviewPanel";
import AdjacencyMatrix from "./panels/AdjacencyPanel";
import NodeDetailsPanel from "./panels/NodeDetailPanel";
import ConnectedNodes from "./panels/ConnectedNodesPanel";
import ConenctionProbPanel from "./panels/ConnectionProbPanel"; // ConnectionProbPanel 가져오기
import MethodModal from "./sub/MethodModal";
import UploadDataModal from "./sub/UploadDataModal";
import ExportGraphData from "./sub/ExportDataModal";
import CentralityBox from "./panels/BoxplotPanel";
import { Attributes } from "graphology-types";
import axios from "axios";
import Spinner from "./sub/Spinner"; // Add a Spinner component or library
import { NodeData, EdgeData } from "../types";
import Tooltips from "./toolTips";

const ResizableContainer: React.FC = () => {
  const [leftWidthPercentage, setLeftWidthPercentage] = useState<number>(75);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState<boolean>(true);
  const [clickedNodeAttributes, setClickedNodeAttributes] =
    useState<Attributes | null>(null);
  const [clickedNeighborDetails, setClickedNeighborDetails] = useState<Array<{
    label: string;
    attributes: Attributes;
  }> | null>(null);

  const [showOverview, setShowOverview] = useState({
    overview1: true,
    overview2: false,
    overview3: false,
    overview4: false,
    overview5: false,
    overview6: false,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setExportModalOpen] = useState(false);
  const [isTooltipModalOpen, setIsTooltipModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDataUploaded, setIsDataUploaded] = useState<boolean>(false);
  const [isMethodChanged, setIsMethodChanged] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(0.5); // State for threshold

  const [isProcessing, setIsProcessing] = useState<boolean>(false); // New state for spinner

  const handleThresholdChangeInParent = (newThreshold: number) => {
    setThreshold(newThreshold); // Update threshold in the parent component
  };
  const [closenessCentralityAvg, setClosenessCentralityAvg] = useState<
    number | null
  >(null);
  const [graphData, setGraphData] = useState<{
    nodes: NodeData[];
    edges: EdgeData[];
    core_indices: number[];
  }>({
    nodes: [],
    edges: [],
    core_indices: [],
  });

  // Add state to store connection probabilities
  const [connectionProbabilities, setConnectionProbabilities] = useState<{
    coreCore: { possible: number; actual: number };
    corePeriphery: { possible: number; actual: number };
    peripheryPeriphery: { possible: number; actual: number };
  } | null>(null);

  // Unified function for handling connection probabilities
  const handleConnectionProbabilities = (data: {
    coreCore: { possible: number; actual: number };
    corePeriphery: { possible: number; actual: number };
    peripheryPeriphery: { possible: number; actual: number };
  }) => {
    // Store the connection probabilities in state
    setConnectionProbabilities(data);
  };

  // 파일 업로드 완료 시 호출될 함수
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsDataUploaded(false);

    const filename = file.name;
    console.log(filename);
    try {
      const graphOverviewResponse = await axios.get(
        `http://localhost:8000/graph/overview?filename=${filename}`
      );
      const graphOverviewPath = graphOverviewResponse.data.filepath;

      const nodeEdgeResponse = await axios.get(
        `http://localhost:8000/graph/node-edge?filename=${filename}`
      );
      const nodeEdgePath = nodeEdgeResponse.data.filepath;

      alert(
        `파일 처리 완료:\n1. 그래프 요약: ${graphOverviewPath}\n2. 노드 및 엣지: ${nodeEdgePath}`
      );

      setIsDataUploaded(true);
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      alert("API 호출 중 오류가 발생했습니다.");
    }
  };

  const handleMethodSelection = async (
    method: string,
    parameters: Record<string, string>
  ) => {
    setIsProcessing(true); // Show spinner
    setIsMethodChanged(false);

    if (!uploadedFile) {
      alert("파일이 업로드되지 않았습니다.");
      setIsProcessing(false); // Hide spinner if there's an error
      return;
    }

    const filename = uploadedFile.name;
    setSelectedMethod(method);

    try {
      // GET 요청으로 데이터 전달, parameters를 직렬화하여 전달
      const algorithmResponse = await axios.get(
        `http://localhost:8000/graph/algorithm`,
        {
          params: {
            filename,
            method,
            parameters: JSON.stringify(parameters), // parameters를 JSON 문자열로 변환
          },
        }
      );

      alert(`알고리즘 적용 및 업데이트 완료`);
      setIsMethodChanged(true);
    } catch (error) {
      console.error("API 호출 중 오류 발생:", error);
      alert("API 호출 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false); // Hide spinner after processing is done
    }
  };

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const screenWidthInInches =
      window.screen.width / window.devicePixelRatio / 96;

    if (screenWidthInInches >= 24) {
      setLeftWidthPercentage(85);
    } else {
      setLeftWidthPercentage(75);
    }
  }, []);

  const handleNodeClick = (
    nodeAttrs: Attributes,
    neighbors: Array<{ label: string; attributes: Attributes }>
  ) => {
    setClickedNodeAttributes(nodeAttrs);
    setClickedNeighborDetails(neighbors);

    setShowOverview((prev) => ({
      ...prev,
      overview2: true,
    }));
  };

  const handleMouseMove = (e: MouseEvent) => {
    const container = document.querySelector("#resizable-container");
    if (container) {
      const containerWidth = container.clientWidth;
      const newLeftWidthPercentage = (e.clientX / containerWidth) * 100;
      if (newLeftWidthPercentage > 5 && newLeftWidthPercentage < 95) {
        setLeftWidthPercentage(newLeftWidthPercentage);
      }
    }
  };

  const handleMouseUp = () => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const handleMouseDown = () => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const toggleRightPanel = () => {
    setIsRightPanelVisible((prev) => !prev);
  };

  const handleDropdownToggle = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    overview: keyof typeof showOverview
  ) => {
    setShowOverview((prev) => ({
      ...prev,
      [overview]: event.target.checked,
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div
      id="resizable-container"
      style={{ display: "flex", height: "100%", width: "100%" }}
    >
      <div
        style={{
          flexBasis: isRightPanelVisible ? `${leftWidthPercentage}%` : "100%",
          padding: "10px",
        }}
      >
        {isProcessing && <Spinner />} {/* Show spinner when processing */}
        <button
          className="fancy-button"
          onClick={() => setIsUploadModalOpen(true)} // Upload Data 모달 열기
          style={{ marginRight: "10px" }}
        >
          {"Data Import"}
        </button>
        <button
          className="fancy-button"
          onClick={() => setExportModalOpen(true)} // Upload Data 모달 열기
          style={{ marginRight: "10px" }}
        >
          {"Data Export"}
        </button>
        <button
          className="fancy-button"
          onClick={() => setIsMethodModalOpen(true)} // Method 모달 열기
          style={{ marginRight: "10px" }}
        >
          {"Select Method"}
        </button>
        <button
          className="fancy-button"
          onClick={toggleRightPanel}
          style={{ marginRight: "10px" }}
        >
          {isRightPanelVisible ? "Hide Detail Panel" : "Show Detail Panel"}
        </button>
        <button
          className="fancy-button"
          onClick={() => setIsTooltipModalOpen(true)}
        >
          {"Tooltips"}
        </button>
        <Root
          onConnectionProbabilitiesCalculated={handleConnectionProbabilities} // Unified function passed to Root
          connectionProbabilities={connectionProbabilities}
          onNodeClick={handleNodeClick}
          methods={selectedMethod}
          isDataUploaded={isDataUploaded}
          isMethodChanged={isMethodChanged}
          onThresholdChange={handleThresholdChangeInParent}
          threshold={threshold}
          graphData={graphData}
          setGraphData={setGraphData}
          closenessCentralityAvg={closenessCentralityAvg}
        />
      </div>

      {isRightPanelVisible && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: "5px",
            cursor: "col-resize",
            backgroundColor: "#ccc",
            userSelect: "none",
          }}
        />
      )}
      {isRightPanelVisible && (
        <div
          ref={containerRef}
          style={{
            flexBasis: `${100 - leftWidthPercentage}%`,
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            height: "100%",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              marginBottom: "0px",
              position: "sticky",
              top: 0,
              backgroundColor: "#fff",
              zIndex: 1,
              padding: "0px",
            }}
          >
            <button className="fancy-button" onClick={handleDropdownToggle}>
              Select Panels
            </button>
            {isDropdownOpen && (
              <div
                ref={dropdownRef}
                style={{
                  position: "absolute",
                  backgroundColor: "#fff",

                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  padding: "10px",
                  zIndex: 10,
                }}
              >
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview1}
                    onChange={(e) => handleCheckboxChange(e, "overview1")}
                  />
                  Graph Statistics
                </label>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview2}
                    onChange={(e) => handleCheckboxChange(e, "overview2")}
                  />
                  Node Detail
                </label>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview3}
                    onChange={(e) => handleCheckboxChange(e, "overview3")}
                  />
                  Connected Neighbors
                </label>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview4}
                    onChange={(e) => handleCheckboxChange(e, "overview4")}
                  />
                  Connection Probability
                </label>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview5}
                    onChange={(e) => handleCheckboxChange(e, "overview5")}
                  />
                  Adjacency Matrix
                </label>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview6}
                    onChange={(e) => handleCheckboxChange(e, "overview6")}
                  />
                  Closeness Centrality
                </label>
              </div>
            )}
          </div>

          {showOverview.overview1 && (
            <div style={{ flexShrink: 0 }}>
              <OverveiwPanel
                isDataUploaded={isDataUploaded}
                onClosenessCentralityAvg={(value) =>
                  setClosenessCentralityAvg(value)
                }
              />
            </div>
          )}

          {showOverview.overview2 && (
            <div style={{ flexShrink: 0 }}>
              <NodeDetailsPanel
                nodeAttributes={clickedNodeAttributes}
                neighborDetails={clickedNeighborDetails}
                threshold={threshold}
              />
            </div>
          )}

          {showOverview.overview3 && (
            <div style={{ flexShrink: 0 }}>
              <ConnectedNodes
                nodeAttributes={clickedNodeAttributes}
                neighborDetails={clickedNeighborDetails}
                threshold={threshold}
              />
            </div>
          )}

          {showOverview.overview4 && (
            <div style={{ flexShrink: 0 }}>
              <ConenctionProbPanel
                connectionProbabilities={connectionProbabilities} // Pass the connection probabilities to the panel
                graphData={graphData}
              />
            </div>
          )}
          {showOverview.overview5 && (
            <div style={{ flexShrink: 0 }}>
              <AdjacencyMatrix
                isDataUploaded={isDataUploaded}
                filename={uploadedFile?.name}
                graphData={graphData}
                threshold={threshold}
                method={selectedMethod}
              />
            </div>
          )}
          {showOverview.overview6 && (
            <div style={{ flexShrink: 0 }}>
              <CentralityBox
                isDataUploaded={isDataUploaded}
                filename={uploadedFile?.name}
                graphData={graphData}
                threshold={threshold}
                method={selectedMethod}
              />
            </div>
          )}
        </div>
      )}

      <MethodModal
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
        onProcessing={handleMethodSelection}
      />

      <UploadDataModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUpload={handleFileUpload}
      />
      <ExportGraphData
        isOpen={isExportModalOpen}
        onClose={() => setExportModalOpen(false)}
        graphData={graphData}
      />
      <Tooltips
        isOpen={isTooltipModalOpen}
        onClose={() => setIsTooltipModalOpen(false)}
      />
    </div>
  );
};

export default ResizableContainer;

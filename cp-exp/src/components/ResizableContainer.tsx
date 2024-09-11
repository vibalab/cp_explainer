import React, { useState, useRef, useEffect } from "react";
import Root from "./graphRoot";
import OverveiwPanel from "./panels/OverviewPanel";
import AdjacencyMatrix from "./panels/AdjacencyPanel";
import NodeDetailsPanel from "./panels/NodeDetailPanel";
import ConnectedNodes from "./panels/ConnectedNodesPanel";
import ConenctionProbPanel from "./panels/ConnectionProbPanel"; // ConnectionProbPanel 가져오기
import MethodModal from "./sub/MethodModal";
import UploadDataModal from "./sub/UploadDataModal";
import { Attributes } from "graphology-types";
import axios from "axios";
import Spinner from "./sub/Spinner"; // Add a Spinner component or library

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
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDataUploaded, setIsDataUploaded] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(0.5); // State for threshold

  const [isProcessing, setIsProcessing] = useState<boolean>(false); // New state for spinner

  const handleThresholdChangeInParent = (newThreshold: number) => {
    setThreshold(newThreshold); // Update threshold in the parent component
  };

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

    try {
      const graphOverviewResponse = await axios.get(
        `http://localhost:8000/graph/overview?filename=${filename}`
      );
      const graphOverviewPath = graphOverviewResponse.data.filepath;

      const nodeEdgeResponse = await axios.get(
        `http://localhost:8000/graph/node-edge?filename=${filename}`
      );
      const nodeEdgePath = nodeEdgeResponse.data.filepath;

      const adjacencyResponse = await axios.get(
        `http://localhost:8000/graph/adjacency?filename=${filename}`
      );
      const adjacencyPath = adjacencyResponse.data.filepath;

      alert(
        `파일 처리 완료:\n1. 그래프 요약: ${graphOverviewPath}\n2. 노드 및 엣지: ${nodeEdgePath}\n3. 인접 행렬: ${adjacencyPath}`
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
    setIsDataUploaded(false);

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

      const algorithmResultPath = algorithmResponse.data.filepath;

      alert(`알고리즘 적용 및 업데이트 완료`);
      setIsDataUploaded(true);
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

  const toggleOverview = (overview: keyof typeof showOverview) => {
    setShowOverview((prev) => ({
      ...prev,
      [overview]: !prev[overview],
    }));
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
          {"Upload Data"}
        </button>
        <button
          className="fancy-button"
          onClick={() => setIsMethodModalOpen(true)} // Method 모달 열기
          style={{ marginRight: "10px" }}
        >
          {"Change Method"}
        </button>
        <button className="fancy-button" onClick={toggleRightPanel}>
          {isRightPanelVisible ? "Hide Detail Panel" : "Show Detail Panel"}
        </button>
        <Root
          onConnectionProbabilitiesCalculated={handleConnectionProbabilities} // Unified function passed to Root
          onNodeClick={handleNodeClick}
          methods={selectedMethod}
          isDataUploaded={isDataUploaded}
          onThresholdChange={handleThresholdChangeInParent}
          threshold={threshold}
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
              Select Overviews
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
                  Graph Overview Stats
                </label>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview2}
                    onChange={(e) => handleCheckboxChange(e, "overview2")}
                  />
                  Node Detail Panel
                </label>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview3}
                    onChange={(e) => handleCheckboxChange(e, "overview3")}
                  />
                  Connected Nodes
                </label>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview4}
                    onChange={(e) => handleCheckboxChange(e, "overview4")}
                  />
                  Core-periphery Metric
                </label>
                <label style={{ display: "block", marginBottom: "5px" }}>
                  <input
                    type="checkbox"
                    checked={showOverview.overview5}
                    onChange={(e) => handleCheckboxChange(e, "overview5")}
                  />
                  Adjacency Matrix
                </label>
              </div>
            )}
          </div>

          {showOverview.overview1 && (
            <div style={{ flexShrink: 0 }}>
              <OverveiwPanel isDataUploaded={isDataUploaded} />
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
              />
            </div>
          )}
          {showOverview.overview5 && (
            <div style={{ flexShrink: 0 }}>
              <AdjacencyMatrix isDataUploaded={isDataUploaded} />
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
    </div>
  );
};

export default ResizableContainer;

import {
  SigmaContainer,
  FullScreenControl,
  ZoomControl,
} from "@react-sigma/core";
import EdgeCurveProgram from "@sigma/edge-curve";
import { createNodeBorderProgram } from "@sigma/node-border";
import { createNodeImageProgram } from "@sigma/node-image";
import { createNodeCompoundProgram } from "sigma/rendering";
import { UndirectedGraph } from "graphology";
import { FC, useEffect, useMemo, useState } from "react";
import {
  BsArrowsFullscreen,
  BsFullscreenExit,
  BsZoomIn,
  BsZoomOut,
  BsArrowCounterclockwise,
} from "react-icons/bs";
import { Settings } from "sigma/settings";
import { Dataset } from "../types";
import GraphDataController from "./sigma/graphDataController";
import GraphEventsController from "./sigma/graphEventController";
import GraphSettingsController from "./sigma/graphSettingsController";
import GraphTitle from "./sigma/graphTitle";
import SearchField from "./sigma/searchField";
import { Attributes } from "graphology-types";
import CPMetric from "./sigma/CPMetricDisplay";
import axios from "axios";
import ConnectionProbabilityCalculator from "./sub/ConnectProbCal";
import GraphThresholdUpdater from "./sigma/graphThresholdUpdater";
import GraphCPApplier from "./sigma/graphCPApplier";
import { NodeData, EdgeData } from "../types";
import GraphSnapshot from "./sigma/graphSnapshot";
import GraphAppearanceController from "./sigma/graphAppearanceController";

interface ConnectionProbabilities {
  coreCore: { possible: number; actual: number };
  corePeriphery: { possible: number; actual: number };
  peripheryPeriphery: { possible: number; actual: number };
}

interface RootProps {
  onNodeClick: (
    nodeAttrs: Attributes,
    neighbors: Array<{ label: string; attributes: Attributes }>
  ) => void;
  methods: string | null;
  isDataUploaded: boolean;
  isMethodChanged: boolean;
  onConnectionProbabilitiesCalculated: (data: {
    coreCore: { possible: number; actual: number };
    corePeriphery: { possible: number; actual: number };
    peripheryPeriphery: { possible: number; actual: number };
  }) => void; // Add the callback prop
  graphData: {
    nodes: NodeData[];
    edges: EdgeData[];
    core_indices: number[];
  };
  connectionProbabilities: ConnectionProbabilities | null;
  setGraphData: React.Dispatch<
    React.SetStateAction<{
      nodes: NodeData[];
      edges: EdgeData[];
      core_indices: number[];
    }>
  >;
  onThresholdChange: (threshold: number) => void; // New callback to pass threshold to the parent of Root
  threshold: number; // Receive the threshold from the parent
  closenessCentralityAvg: number | null;
}

const NodeBorderCustomProgram = createNodeBorderProgram({
  borders: [
    {
      size: { attribute: "borderSize", defaultValue: 0.1 },
      color: { attribute: "borderColor" },
    },
    { size: { fill: true }, color: { attribute: "color" } },
  ],
});

const NodePictogramCustomProgram = createNodeImageProgram({
  padding: 0.3,
  size: { mode: "force", value: 256 },
  drawingMode: "color",
  colorAttribute: "pictoColor",
});

const NodeProgram = createNodeCompoundProgram([
  NodeBorderCustomProgram,
  NodePictogramCustomProgram,
]);

const Root: FC<RootProps> = ({
  onNodeClick,
  methods,
  isDataUploaded,
  isMethodChanged,
  onConnectionProbabilitiesCalculated, // Use this as the unified function
  connectionProbabilities,
  onThresholdChange, // Receive the callback from the parent component
  threshold,
  graphData,
  setGraphData,
  closenessCentralityAvg,
}) => {
  const [showContents, setShowContents] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nodeHSL, setNodeHSL] = useState({ h: 197, s: 71, l: 73 }); // Store node color HSL
  const [edgeHSL, setEdgeHSL] = useState({ h: 0, s: 0, l: 0 }); // Store edge color HSL

  const method = methods;
  const sigmaSettings: Partial<Settings> = useMemo(
    () => ({
      // defaultDrawNodeLabel: drawLabel,
      // defaultDrawNodeHover: drawHover,
      enableEdgeEvents: true,
      defaultNodeType: "pictogram",
      nodeProgramClasses: {
        pictogram: NodeProgram,
      },
      defaultEdgeType: "curve",
      edgeProgramClasses: {
        curve: EdgeCurveProgram,
      },
      labelDensity: 0.07,
      labelGridCellSize: 60,
      labelRenderedSizeThreshold: 15,
      labelFont: "Lato, sans-serif",
      zIndex: true,
      allowInvalidContainer: true,
    }),
    []
  );

  // Load data on mount:
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/graph/node-edge-json/"
        );
        const dataset: Dataset = res.data;
        setDataset(dataset);
        requestAnimationFrame(() => {
          setDataReady(true);
          setIsLoading(false);
        });
      } catch (err) {
        console.error("Error fetching dataset:", err);
        setIsLoading(false);
      }
    };

    if (isDataUploaded) {
      fetchData();
    }
  }, [isDataUploaded]);

  if (isLoading) {
    const sampleDataLink = "/data/example_data.zip"; // 샘플 데이터 다운로드 링크

    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h2>Welcome to CP-Explainer</h2>
        <br />
        <p>
          CP-Explainer is a web-based system designed to help you analyze and
          visualize Core-Periphery (CP) structures in networks. The tool
          provides an intuitive interface for exploring network characteristics,
          applying various CP methods, and gaining insights into your data.
        </p>
        <p>
          To get started, click <strong>"Data Import"</strong> and upload your
          graph data in a supported format (e.g., JSON, CSV).
        </p>
        <p>
          Alternatively, you can use our sample data to explore the features of
          CP-Explainer.
        </p>
        <br />
        <a
          href={sampleDataLink}
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            backgroundColor: "white",
            color: "black",
            border: "1px solid black", // 외곽선을 black으로 설정
            borderRadius: "0.3rem",
            cursor: "pointer",
            textDecoration: "none",
            transition: "background-color 0.3s ease, color 0.3s ease", // 부드러운 전환 효과
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLAnchorElement).style.backgroundColor = "#87ceeb";
            (e.target as HTMLAnchorElement).style.color = "white";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLAnchorElement).style.backgroundColor = "white";
            (e.target as HTMLAnchorElement).style.color = "black";
          }}
          download
        >
          Download Sample Data
        </a>
      </div>
    );
  }

  if (!dataset) return null;

  const handleNodeColorChange = (h: number, s: number, l: number) => {
    setNodeHSL({ h, s, l });
    console.log(`Node color HSL updated: h=${h}, s=${s}, l=${l}`);
  };

  // Callback to handle edge color HSL changes
  const handleEdgeColorChange = (h: number, s: number, l: number) => {
    setEdgeHSL({ h, s, l });
    console.log(`Edge color HSL updated: h=${h}, s=${s}, l=${l}`);
  };

  return (
    <SigmaContainer
      style={{ width: "100%", height: "95%" }}
      graph={UndirectedGraph}
      settings={sigmaSettings}
      className="react-sigma"
    >
      <GraphSettingsController
        hoveredNode={hoveredNode}
        threshold={threshold}
      />
      <GraphEventsController
        setHoveredNode={setHoveredNode}
        setGraphData={setGraphData}
        onNodeClick={onNodeClick}
        connectionProbabilities={connectionProbabilities}
        threshold={threshold}
        method={method}
        nodeHSL={nodeHSL}
        closenessCentralityAvg={closenessCentralityAvg}
      />
      <GraphDataController
        dataset={dataset}
        threshold={threshold}
        nodeHSL={nodeHSL}
      />
      <GraphThresholdUpdater threshold={threshold} nodeHSL={nodeHSL} />
      <GraphCPApplier
        isMethodChanged={isMethodChanged}
        threshold={threshold}
        nodeHSL={nodeHSL}
        setGraphData={setGraphData}
      />
      {/* Add the GraphThresholdUpdater */}
      {dataReady && (
        <>
          <div className="controls">
            <GraphAppearanceController
              threshold={threshold}
              onNodeColorChange={handleNodeColorChange} // Pass node color callback
              onEdgeColorChange={handleEdgeColorChange} // Pass edge color callback
            />
            <GraphSnapshot />
            <FullScreenControl className="ico">
              <BsArrowsFullscreen />
              <BsFullscreenExit />
            </FullScreenControl>

            <ZoomControl className="ico">
              <BsZoomIn />
              <BsZoomOut />
              <BsArrowCounterclockwise />
            </ZoomControl>
          </div>
          <div className="contents">
            <GraphTitle threshold={threshold} />
            <div className="search_panel">
              <SearchField />
            </div>
          </div>
          <div
            className="cpmetric_panel"
            style={{ border: "1px solid", borderRadius: "2em" }}
          >
            <CPMetric
              method={method}
              hoveredNode={hoveredNode}
              onThresholdChange={onThresholdChange} // Pass the callback to CPMetric
              setGraphData={setGraphData} // setGraphData를 전달
            />
            <ConnectionProbabilityCalculator
              onDataCalculated={onConnectionProbabilitiesCalculated}
              threshold={threshold}
              graphData={graphData}
            />
          </div>
        </>
      )}
    </SigmaContainer>
  );
};

export default Root;

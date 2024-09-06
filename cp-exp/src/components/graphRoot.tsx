import {
  SigmaContainer,
  ControlsContainer,
  FullScreenControl,
  ZoomControl,
  useSigma,
} from "@react-sigma/core";
import EdgeCurveProgram from "@sigma/edge-curve";
import { createNodeBorderProgram, NodeBorderProgram } from "@sigma/node-border";
import { createNodeImageProgram } from "@sigma/node-image";
import { createNodeCompoundProgram } from "sigma/rendering";
import { UndirectedGraph } from "graphology";
import { constant, keyBy, mapValues } from "lodash";
import { FC, useEffect, useMemo, useState } from "react";
import { BiRadioCircleMarked } from "react-icons/bi";
import {
  BsArrowsFullscreen,
  BsFullscreenExit,
  BsZoomIn,
  BsZoomOut,
} from "react-icons/bs";
import { Settings } from "sigma/settings";
import { drawHover, drawLabel } from "../canvas-utils";
import { Dataset } from "../types";
import GraphDataController from "./graphDataController";
import GraphEventsController from "./graphEventController";
import GraphSettingsController from "./graphSettingsController";
import GraphTitle from "./graphTitle";
import SearchField from "./searchField";
import Tooltips from "./toolTips";
import { ReactComponent as DescIcon } from "../icon/information-circle.svg";
import { Attributes } from "graphology-types";
import SaveGraphToJson from "./SaveGraphToJson";
import CPMetric from "./CPMetricDisplay";
import axios from "axios";
import ConnectionProbabilityCalculator from "./sub/ConnectProbCal";

interface RootProps {
  onNodeClick: (
    nodeAttrs: Attributes,
    neighbors: Array<{ label: string; attributes: Attributes }>
  ) => void;
  methods: string;
  isDataUploaded: boolean;
  onConnectionProbabilitiesCalculated: (data: {
    coreCore: { possible: number; actual: number };
    corePeriphery: { possible: number; actual: number };
    peripheryPeriphery: { possible: number; actual: number };
  }) => void; // Add the callback prop
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
  onConnectionProbabilitiesCalculated, // Receive the callback
}) => {
  const [showContents, setShowContents] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가
  const [isModalOpen, setModalOpen] = useState(false);
  const method = methods;
  const handleDataCalculated = (data: {
    coreCore: { possible: number; actual: number };
    corePeriphery: { possible: number; actual: number };
    peripheryPeriphery: { possible: number; actual: number };
  }) => {
    // Pass the data to the grandparent through the callback
    onConnectionProbabilitiesCalculated(data);
  };

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const sigmaSettings: Partial<Settings> = useMemo(
    () => ({
      // nodeProgramClasses: {
      //   image: createNodeImageProgram({
      //     size: { mode: "force", value: 256 },
      //   }),
      // },
      defaultDrawNodeLabel: drawLabel,
      defaultDrawNodeHover: drawHover,
      enableEdgeEvents: true,
      defaultNodeType: "pictogram",
      nodeProgramClasses: {
        pictogram: NodeProgram,
      },
      // defaultEdgeType: "arrow",
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
        const dataset: Dataset = res.data; // 서버에서 가져온 데이터를 Overview 타입으로 변환
        setDataset(dataset);
        requestAnimationFrame(() => {
          setDataReady(true);
          setIsLoading(false); // 로딩 완료 상태로 설정
        });
      } catch (err) {
        console.error("Error fetching dataset:", err);
        setIsLoading(false); // 오류 발생 시 로딩 상태 해제
      }
    };

    // 데이터가 업로드될 때마다 fetchData 호출
    if (isDataUploaded) {
      fetchData();
    }
  }, [isDataUploaded]);

  if (isLoading) {
    return <div>Loading...</div>; // 로딩 중일 때 표시할 내용
  }

  if (!dataset) return null;

  return (
    <SigmaContainer
      style={{ width: "100%", height: "95%" }}
      graph={UndirectedGraph}
      settings={sigmaSettings}
      className="react-sigma"
    >
      <GraphSettingsController hoveredNode={hoveredNode} />
      <GraphEventsController
        setHoveredNode={setHoveredNode}
        onNodeClick={onNodeClick}
      />
      <GraphDataController dataset={dataset} />
      {/* <ConnectionProbabilityCalculator
        onDataCalculated={handleDataCalculated}
      /> */}
      {dataReady && (
        <>
          <div className="controls">
            {/* <SaveGraphToJson></SaveGraphToJson> */}
            <FullScreenControl className="ico">
              <BsArrowsFullscreen />
              <BsFullscreenExit />
            </FullScreenControl>

            <ZoomControl className="ico">
              <BsZoomIn />
              <BsZoomOut />
              <BiRadioCircleMarked />
            </ZoomControl>
          </div>
          <div className="contents">
            <GraphTitle />
            <div className="search_panel">
              <SearchField />
            </div>
          </div>
          <div
            className="cpmetric_panel"
            style={{ border: "1px solid", borderRadius: "2em" }}
          >
            <CPMetric method={method} hoveredNode={hoveredNode} />
          </div>
        </>
      )}
    </SigmaContainer>
  );
};

export default Root;

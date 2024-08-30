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

const NodeBorderCustomProgram = createNodeBorderProgram({
  borders: [
    { size: { value: 0.1 }, color: { attribute: "borderColor" } },
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

const Root: FC = () => {
  const [showContents, setShowContents] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가
  const [isModalOpen, setModalOpen] = useState(false);

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
    const dataFile = "data/graph_data_les.json";
    fetch(dataFile)
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `Failed to fetch data from ${dataFile}: ${res.statusText}`
          );
        }
        return res.json();
      })
      .then((dataset: Dataset) => {
        setDataset(dataset);
        requestAnimationFrame(() => {
          setDataReady(true);
          setIsLoading(false); // 로딩 완료 상태로 설정
        });
      })
      .catch((error) => {
        console.error("Error fetching dataset:", error);
        setIsLoading(false); // 오류 발생 시 로딩 상태 해제
      });
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // 로딩 중일 때 표시할 내용
  }

  if (!dataset) return null;

  return (
    <SigmaContainer
      style={{ width: "100%", height: "90%" }}
      graph={UndirectedGraph}
      settings={sigmaSettings}
      className="react-sigma"
    >
      <GraphSettingsController hoveredNode={hoveredNode} />
      <GraphEventsController setHoveredNode={setHoveredNode} />
      <GraphDataController dataset={dataset} />

      {dataReady && (
        <>
          <div className="controls">
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
            <div className="desc_panel">
              <DescIcon
                onClick={openModal}
                style={{ cursor: "pointer", width: "50px", height: "50px" }}
              />
              <Tooltips isOpen={isModalOpen} onClose={closeModal} />
            </div>
          </div>
        </>
      )}
    </SigmaContainer>
  );
};

export default Root;
import React, { useEffect, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import { GraphAdjacency } from "../../types";
import Accordion from "../sub/Accordion";
import axios from "axios";
import Plot from "react-plotly.js";
import { NodeData, EdgeData } from "../../types";

interface BoxplotProps {
  isDataUploaded: boolean;
  filename: string | undefined;
  graphData: {
    nodes: NodeData[];
    edges: EdgeData[];
    core_indices: number[];
  };
  threshold: number;
  method: string | null;
}

const CentralityBox: React.FC<BoxplotProps> = ({
  isDataUploaded,
  filename,
  graphData,
  threshold,
  method,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartSize, setChartSize] = useState<number>(300); // Default size
  const [isAccordionOpen, setIsAccordionOpen] = useState<boolean>(true); // 상태 추가
  const containerRef = useRef<HTMLDivElement>(null);
  const [plotData, setPlotData] = useState<any>(null);

  useEffect(() => {
    updateData();
  }, [isDataUploaded]);
  const updateData = async () => {
    const data = { graphData, threshold };
    try {
      const response = await axios.post(
        "http://localhost:8000/graph/centrality_box/",
        data, // 데이터를 그대로 보냄
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const plot = JSON.parse(response.data); // 이미 JSON 데이터일 수 있음
      setPlotData(plot);
      setLoading(false);
      console.log(plot);
    } catch (err) {
      console.error(err); // 에러 로그 출력
      setError("Failed to load heatmap.");
    } finally {
    }
  };

  useEffect(() => {
    updateData();
  }, [graphData, method, threshold, isAccordionOpen, isDataUploaded]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Accordion title="Closeness Centrality Boxplot" isOpen={isAccordionOpen}>
      <button onClick={updateData}>Refresh Boxplot</button>
      <p>Closeness centrality: core vs periphery.</p>
      <p>Dashed line: overall average.</p>
      <div
        ref={containerRef}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%", // 초기 너비 설정
          height: "300px", // 초기 높이 설정
        }}
      >
        {plotData ? (
          <Plot
            data={plotData.data}
            layout={plotData.layout}
            frames={plotData.frames || []}
            config={plotData.config || {}}
          />
        ) : null}
      </div>
    </Accordion>
  );
};

export default CentralityBox;

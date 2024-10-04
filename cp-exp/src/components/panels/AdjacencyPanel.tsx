import React, { useEffect, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import { GraphAdjacency } from "../../types";
import Accordion from "../sub/Accordion";
import axios from "axios";
import Plot from "react-plotly.js";
import { NodeData, EdgeData } from "../../types";

interface AdjacencyProps {
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

const AdjacencyMatrixHeatmap: React.FC<AdjacencyProps> = ({
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:8000/graph/adjacency-init/?filename=${filename}`
      );

      const plot = JSON.parse(res.data);

      setPlotData(plot);
    } catch (err) {
      setError("Failed to load heatmap.");
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트가 처음 마운트될 때 및 데이터 업로드 상태가 변경될 때마다 데이터를 가져옴
  useEffect(() => {
    fetchData();
  }, [isDataUploaded]);

  const updateData = async () => {
    const data = { graphData, threshold };
    try {
      const response = await axios.post(
        "http://localhost:8000/graph/adjacency-update/",
        data, // 데이터를 그대로 보냄
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const plot = JSON.parse(response.data); // 이미 JSON 데이터일 수 있음
      setPlotData(plot);
    } catch (err) {
      console.error(err); // 에러 로그 출력
      setError("Failed to load heatmap.");
    } finally {
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDataUploaded]);

  useEffect(() => {
    updateData();
  }, [graphData, method, threshold, isAccordionOpen]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Accordion title="Adjacency Matrix" isOpen={isAccordionOpen}>
      <button onClick={updateData}>Update Heatmap</button>
      <p>Line shows the Core-periphery area</p>

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

export default AdjacencyMatrixHeatmap;

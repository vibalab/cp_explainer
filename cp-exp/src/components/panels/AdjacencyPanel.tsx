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
}

const AdjacencyMatrixHeatmap: React.FC<AdjacencyProps> = ({
  isDataUploaded,
  filename,
  graphData,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartSize, setChartSize] = useState<number>(300); // Default size
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
      setLoading(false); // 로딩 완료 상태로 설정
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
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:8000/graph/adjacency-init/?filename=${filename}`
      );

      const plot = JSON.parse(res.data);

      setPlotData(plot);
      console.log(plotData);
      setLoading(false); // 로딩 완료 상태로 설정
    } catch (err) {
      setError("Failed to load heatmap.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [graphData]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Accordion title="Adjacency Matrix" isOpen={true}>
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

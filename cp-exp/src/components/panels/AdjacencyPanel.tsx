import React, { useEffect, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import { GraphAdjacency } from "../../types";
import Accordion from "../sub/Accordion";
import axios from "axios";

interface AdjacencyProps {
  isDataUploaded: boolean;
}

const AdjacencyMatrixHeatmap: React.FC<AdjacencyProps> = ({
  isDataUploaded,
}) => {
  const [graphData, setGraphData] = useState<GraphAdjacency | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartSize, setChartSize] = useState<number>(300); // Default size
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:8000/graph/adjacency-json/"
      );
      const dataset: GraphAdjacency = res.data; // 서버에서 가져온 데이터를 타입에 맞게 변환
      setGraphData(dataset);
      setLoading(false); // 로딩 완료 상태로 설정
    } catch (err) {
      console.error("Error fetching dataset:", err);
      setError("Failed to load graph data.");
      setLoading(false); // 오류 발생 시 로딩 상태 해제
    }
  };

  // 컴포넌트가 처음 마운트될 때 및 데이터 업로드 상태가 변경될 때마다 데이터를 가져옴
  useEffect(() => {
    fetchData();
  }, [isDataUploaded]);

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const size = Math.min(clientWidth, clientHeight) * 0.95;
      setChartSize(size);
    }
  }, [containerRef.current]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!graphData) {
    return <div>No data available</div>;
  }

  const { nodes_labels, adjacency, cp_ind } = graphData;

  // cp_ind 배열에서 값이 1인 가장 큰 인덱스를 찾음
  const maxIndex = cp_ind.lastIndexOf(1);

  // yAxis 데이터를 뒤집기
  const reversedLabels = [...nodes_labels].reverse();

  // 히트맵 데이터를 eCharts 형식으로 변환
  const heatmapData = adjacency.flatMap((row, rowIndex) =>
    row.map((value, colIndex) => {
      const isBelowMaxIndex =
        (rowIndex < maxIndex || colIndex < maxIndex) && value === 0;

      return {
        value: [colIndex, adjacency.length - 1 - rowIndex, value],
        itemStyle: isBelowMaxIndex
          ? {
              color: "#F2F2F4", // 회색으로 매핑
            }
          : {},
      };
    })
  );

  const option = {
    tooltip: {
      position: "bottom",
      formatter: (params: any) => {
        const { value } = params.data;
        const [colIndex, rowIndex, cellValue] = value;
        return `(${nodes_labels[colIndex]}, ${
          nodes_labels[adjacency.length - 1 - rowIndex]
        }): ${cellValue}`;
      },
    },
    grid: {
      left: "10%", // Adjust left margin to center the chart
      right: "10%", // Adjust right margin to center the chart
      top: "10%", // Adjust top margin for centering
      bottom: "10%", // Adjust bottom margin for centering
    },
    xAxis: {
      type: "category",
      data: nodes_labels,
      splitArea: {
        show: false,
      },
      axisLabel: { show: false },
    },
    yAxis: {
      type: "category",
      data: reversedLabels, // 뒤집어진 yAxis 레이블
      splitArea: {
        show: false,
      },
      axisLabel: { show: false },
    },
    visualMap: {
      min: 0,
      max: 1,
      show: false,
      inRange: {
        color: ["#FFFFFF", "#87CEEB"],
      },
    },
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: 0,
        start: 0,
        end: 100,
      },
      {
        type: "inside",
        yAxisIndex: 0,
        start: 0,
        end: 100,
      },
    ],
    series: [
      {
        name: "Adjacency Matrix",
        type: "heatmap",
        data: heatmapData,
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  return (
    <Accordion title="Adjacency Matrix" isOpen={true}>
      <p>Grey area means Core-Core or Core-Periphery</p>

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
        <ReactECharts
          option={option}
          style={{ height: chartSize, width: chartSize }}
        />
      </div>
    </Accordion>
  );
};

export default AdjacencyMatrixHeatmap;

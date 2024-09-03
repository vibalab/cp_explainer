import React, { useEffect, useRef, useState } from "react";
import ReactECharts from "echarts-for-react";
import { GraphAdjacency } from "../types";
import Accordion from "./sub/Accordion";

const AdjacencyMatrixHeatmap: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphAdjacency | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chartSize, setChartSize] = useState<number>(300); // Default size
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await fetch("data/graph_data_adjacency.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data: GraphAdjacency = await response.json();
        setGraphData(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load graph data.");
        setLoading(false);
      }
    };

    fetchGraphData();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const size = Math.min(clientWidth, clientHeight) * 0.95;
      setChartSize(size);
    }
  }, [containerRef.current]);

  console.log(chartSize);
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!graphData) {
    return null;
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
        <ReactECharts option={option} style={{ height: 300, width: 300 }} />
      </div>
    </Accordion>
  );
};

export default AdjacencyMatrixHeatmap;

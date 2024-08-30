import React, { useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

interface NodeType {
  id: number;
  isCore: boolean;
}

interface Props {
  matrix: number[][];
  nodes: NodeType[];
}

const AdjacencyMatrixHeatmap: React.FC<Props> = ({ matrix, nodes }) => {
  const chartRef = useRef<ReactECharts>(null);

  useEffect(() => {
    const chartInstance = chartRef.current?.getEchartsInstance();

    if (chartInstance) {
      chartInstance.on("mouseover", (params) => {
        if (
          params.componentType === "xAxis" ||
          params.componentType === "yAxis"
        ) {
          console.log("Hovered over axis label:", params.value);
        }
      });
    }

    return () => {
      chartInstance?.off("mouseover");
    };
  }, []);

  // Core와 Periphery를 구분하여 데이터 재배치
  const coreNodes = nodes.filter((node) => node.isCore);
  const peripheryNodes = nodes.filter((node) => !node.isCore);

  const reorderedNodes = [...coreNodes, ...peripheryNodes];
  const reorderedMatrix = reorderedNodes.map((_, i) =>
    reorderedNodes.map(
      (_, j) => matrix[reorderedNodes[i].id][reorderedNodes[j].id]
    )
  );

  // Heatmap에 맞게 데이터 변환
  const heatmapData = reorderedMatrix.flatMap((row, i) =>
    row.map((value, j) => [j, i, value])
  );

  // X축과 Y축 라벨 생성
  const labels = reorderedNodes.map((node, index) =>
    node.isCore ? `Core ${index}` : `Periphery ${index}`
  );

  const option = {
    tooltip: {
      position: "top",
    },
    grid: {
      height: "50%",
      top: "20%",
    },
    xAxis: {
      type: "category",
      data: labels,
      position: "top", // X축 라벨을 위쪽에 위치시킴
      splitArea: {
        show: true,
      },
      axisLabel: {
        rotate: 90,
        color: (value: string) =>
          value.startsWith("Core") ? "#FF7F50" : "#6495ED",
      },
    },
    yAxis: {
      type: "category",
      data: labels,
      splitArea: {
        show: true,
      },
      axisLabel: {
        color: (value: string) =>
          value.startsWith("Core") ? "#FF7F50" : "#6495ED",
      },
      inverse: true, // Y축을 뒤집음
    },
    visualMap: {
      min: 0,
      max: 1,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: "15%",
      inRange: {
        color: ["#ffffff", "#6495ED", "#FF7F50"],
      },
    },
    series: [
      {
        name: "Adjacency Matrix",
        type: "heatmap",
        data: heatmapData,
        label: {
          show: true,
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
    <ReactECharts
      ref={chartRef}
      option={option}
      style={{ height: 400, width: 400 }}
    />
  );
};

export default AdjacencyMatrixHeatmap;

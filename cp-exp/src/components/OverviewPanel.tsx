import React, { useEffect, useState } from "react";
import { Overview } from "../types";
import Accordion from "./sub/Accordion";
import OverviewItem from "./sub/OverviewItem";
import Tooltip from "./sub/Tooltip";
import styled from "styled-components";
import axios from "axios";

interface OverviewPanelProps {
  isDataUploaded: boolean;
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({ isDataUploaded }) => {
  const [graphData, setGraphData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const handleCopy = (
    text: string,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setTooltip({
          text: "Number Copied!",
          x: event.clientX,
          y: event.clientY,
        });
        setTimeout(() => setTooltip(null), 1000); // 1초 후에 tooltip 숨기기
      },
      (err) => {
        console.error("Failed to copy: ", err);
      }
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "http://localhost:8000/graph/overview-json/"
        );
        const dataset: Overview = res.data; // 서버에서 가져온 데이터를 Overview 타입으로 변환
        setGraphData(dataset);
        setLoading(false); // 로딩 완료 상태로 설정
      } catch (err) {
        console.error("Error fetching dataset:", err);
        setError("Failed to load graph data.");
        setLoading(false); // 오류 발생 시 로딩 상태 해제
      }
    };

    // 데이터가 업로드될 때마다 fetchData 호출
    if (isDataUploaded) {
      fetchData();
    }
  }, [isDataUploaded]);

  if (loading) {
    return <div>Loading graph data...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!graphData) {
    return <div>No graph data available.</div>;
  }

  return (
    <Accordion title="Graph Statistics" isOpen={true}>
      <Container>
        <Row>
          <OverviewItem
            label="Node Count"
            value={graphData.node_count.toString()}
            onCopy={handleCopy}
          />
          <OverviewItem
            label="Edge Count"
            value={graphData.edge_count.toString()}
            onCopy={handleCopy}
          />
        </Row>
        <Row>
          <OverviewItem
            label="AVG Degree"
            value={graphData.average_degree.toFixed(2)}
            onCopy={handleCopy}
          />
          <OverviewItem
            label="Density"
            value={graphData.density.toFixed(4)}
            onCopy={handleCopy}
          />
        </Row>

        <OverviewItem
          label="AVG Clustering Coefficient"
          value={graphData.average_clustering_coefficient.toFixed(4)}
          onCopy={handleCopy}
        />
        {graphData.average_shortest_path_length !== null && (
          <OverviewItem
            label="AVG Shortest Path Length"
            value={graphData.average_shortest_path_length.toFixed(2)}
            onCopy={handleCopy}
          />
        )}
        <OverviewItem
          label="AVG Degree Centrality"
          value={graphData.degree_centrality_avg.toFixed(4)}
          onCopy={handleCopy}
        />
        <OverviewItem
          label="AVG Betweenness Centrality"
          value={graphData.betweenness_centrality_avg.toFixed(4)}
          onCopy={handleCopy}
        />
        <OverviewItem
          label="AVG Closeness Centrality"
          value={graphData.closeness_centrality_avg.toFixed(4)}
          onCopy={handleCopy}
        />
        <OverviewItem
          label="AVG Eigenvector Centrality"
          value={graphData.eigenvector_centrality_avg.toFixed(4)}
          onCopy={handleCopy}
        />
      </Container>

      {tooltip && <Tooltip text={tooltip.text} x={tooltip.x} y={tooltip.y} />}
    </Accordion>
  );
};

// Styled components
const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
`;

export default OverviewPanel;

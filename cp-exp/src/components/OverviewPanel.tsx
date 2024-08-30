// src/components/OverviewPanel.tsx
import React, { useEffect, useState } from "react";
import { Dataset } from "../types";
import Accordion from "./Accordion";
import OverviewItem from "./sub/OverviewItem";
import Tooltip from "./sub/Tooltip";
import styled from "styled-components";

const OverviewPanel: React.FC = () => {
  const [graphData, setGraphData] = useState<Dataset | null>(null);
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
    const dataFile = "data/graph_data_les.json";

    const fetchData = async () => {
      try {
        const res = await fetch(dataFile);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch data from ${dataFile}: ${res.statusText}`
          );
        }
        const dataset: Dataset = await res.json();
        setGraphData(dataset);
        requestAnimationFrame(() => {
          setLoading(false); // 로딩 완료 상태로 설정
        });
      } catch (err) {
        console.error("Error fetching dataset:", err);
        setError("Failed to load graph data.");
        setLoading(false); // 오류 발생 시 로딩 상태 해제
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading graph data...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!graphData || !graphData.overviews) {
    return <div>Error loading graph data.</div>;
  }

  return (
    <Accordion title="Graph Statistics">
      <Container>
        <Row>
          <OverviewItem
            label="Node Count"
            value={graphData.overviews.node_count.toString()}
            onCopy={handleCopy}
          />
          <OverviewItem
            label="Edge Count"
            value={graphData.overviews.edge_count.toString()}
            onCopy={handleCopy}
          />
        </Row>
        <Row>
          <OverviewItem
            label="AVG Degree"
            value={graphData.overviews.average_degree.toFixed(2)}
            onCopy={handleCopy}
          />
          <OverviewItem
            label="Density"
            value={graphData.overviews.density.toFixed(4)}
            onCopy={handleCopy}
          />
        </Row>

        <OverviewItem
          label="AVG Clustering Coefficient"
          value={graphData.overviews.average_clustering_coefficient.toFixed(4)}
          onCopy={handleCopy}
        />
        {graphData.overviews.average_shortest_path_length !== null && (
          <OverviewItem
            label="AVG Shortest Path Length"
            value={graphData.overviews.average_shortest_path_length.toFixed(2)}
            onCopy={handleCopy}
          />
        )}
        <OverviewItem
          label="AVG Degree Centrality"
          value={graphData.overviews.degree_centrality_avg.toFixed(4)}
          onCopy={handleCopy}
        />
        <OverviewItem
          label="AVG Betweenness Centrality"
          value={graphData.overviews.betweenness_centrality_avg.toFixed(4)}
          onCopy={handleCopy}
        />
        <OverviewItem
          label="AVG Closeness Centrality"
          value={graphData.overviews.closeness_centrality_avg.toFixed(4)}
          onCopy={handleCopy}
        />
        <OverviewItem
          label="AVG Eigenvector Centrality"
          value={graphData.overviews.eigenvector_centrality_avg.toFixed(4)}
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

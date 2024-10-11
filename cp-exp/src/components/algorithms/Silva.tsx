import { FC, useState, useEffect } from "react";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex"; // LaTeX 수식 표시를 위한 라이브러리
import { useSigma } from "@react-sigma/core";
import {
  fetchMetricData,
  updateGraphMetric,
  createGraphData,
} from "../sub/metricService"; // metricService 가져오기
import { NodeData, EdgeData } from "../../types";

interface SilvaProps {
  method: string | null;
  hoveredNode: string | null;
  setGraphData: React.Dispatch<
    React.SetStateAction<{
      nodes: NodeData[];
      edges: EdgeData[];
      core_indices: number[];
    }>
  >; // setGraphData를 props로 받아옴
}

const Silva: FC<SilvaProps> = ({ method, hoveredNode, setGraphData }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const doiRef = "https://doi.org/10.1109/JPROC.2008.925418";
  const [metric, setMetric] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [isSaving, setIsSaving] = useState(false); // 저장 중인지 여부
  const [capacity, setCapcity] = useState<number>(0);

  const toggleModal = () => setModalOpen(!isModalOpen);

  // Update metric when the "Refresh Metric" button is clicked
  const handleUpdateMetric = async () => {
    setIsSaving(true);

    const graphData = createGraphData(graph);
    setGraphData(graphData);
    try {
      // 분리된 graphData 생성 로직과 통신 로직을 사용하여 업데이트
      const updatedMetric = await updateGraphMetric(graphData, method);
      setMetric(updatedMetric);
    } catch (error) {
      console.error("Error uploading graph data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch metric data based on the method
  const handleFetchData = async () => {
    setLoading(true);
    try {
      const dataset = await fetchMetricData();
      setMetric(dataset);
      setError(null);
    } catch (err) {
      setError("Failed to load graph data.");
    } finally {
      setLoading(false);
    }
  };

  // method가 바뀔 때마다 데이터 fetch
  useEffect(() => {
    if (method) {
      handleFetchData();
      const graphData = createGraphData(graph);
      setGraphData(graphData);
    }
  }, [method]);

  useEffect(() => {
    if (hoveredNode) {
      const newCapcity =
        graph.getNodeAttribute(hoveredNode, "core_periphery_score") || 0;
      setCapcity(newCapcity.toFixed(2));
    } else {
      setCapcity(0); // hoveredNode가 없을 때는 0으로 설정
    }
  }, [graph, hoveredNode]);

  return (
    <div>
      <h3 style={{ marginBottom: 0 }}>Metric: </h3>
      <h1 style={{ fontSize: "24px", marginTop: 0, marginBottom: 0 }}>
        <a href={doiRef} target="_blank" rel="noopener noreferrer">
          Silva.
        </a>
      </h1>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        <i style={{ cursor: "pointer" }} onClick={toggleModal}>
          Core Coefficient:{" "}
          {loading
            ? "Loading..."
            : metric?.cc !== undefined
            ? metric.cc.toFixed(4)
            : "N/A"}
        </i>
        <button
          onClick={handleUpdateMetric}
          style={{
            marginLeft: "10px",
            backgroundColor: isSaving ? "#cccccc" : "#f0f0f0",
            border: "1px solid #ced4da",
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: "12px",
          }}
        >
          Refresh Metric
        </button>
      </h2>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        <i style={{ cursor: "pointer" }}>Capacity: {capacity}</i>
      </h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "20px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            width: "80%",
            maxWidth: "600px",
          }}
        >
          <h3>Silva Explanation</h3> <br />
          <p>
            The <strong>Silva</strong> introduces the concept of network
            capacity to measure the overall connectivity of a network. The
            capacity <InlineMath math="C" /> is defined as the sum of the
            inverses of the distances between nodes <InlineMath math="i" /> and
            <InlineMath math="j" />. A higher capacity indicates a
            well-connected network, meaning that a sub-network of core nodes
            should have high capacity.
          </p>
          <p>
            Silva's method removes nodes with the lowest closeness centrality
            until the network's capacity drops to 90% of its initial value. The
            nodes remaining at this point are considered core nodes.
          </p>
          <button onClick={toggleModal}>Close</button>
        </div>
      )}

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
          }}
          onClick={toggleModal}
        />
      )}
    </div>
  );
};

export default Silva;

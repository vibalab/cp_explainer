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

interface HolmeProps {
  method: string | null;
  setGraphData: React.Dispatch<
    React.SetStateAction<{
      nodes: NodeData[];
      edges: EdgeData[];
      core_indices: number[];
    }>
  >; // setGraphData를 props로 받아옴
}

const Holme: FC<HolmeProps> = ({ method, setGraphData }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const doiRef = "https://doi.org/10.1103/PhysRevE.72.046111";
  const [metric, setMetric] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [isSaving, setIsSaving] = useState(false); // 저장 중인지 여부\

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

  return (
    <div>
      <h3 style={{ marginBottom: 0 }}>Metric: </h3>
      <h1 style={{ fontSize: "24px", marginTop: 0, marginBottom: 0 }}>
        <a href={doiRef} target="_blank" rel="noopener noreferrer">
          Holme.
        </a>
      </h1>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        <i style={{ cursor: "pointer" }} onClick={toggleModal}>
          C<sub>cp</sub>:{" "}
          {loading
            ? "Loading..."
            : metric?.C_cp !== undefined
            ? parseFloat(metric.C_cp).toFixed(4)
            : "N/A"}
        </i>
      </h2>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        <i style={{ cursor: "pointer" }} onClick={toggleModal}>
          C<sub>c_core</sub> / C<sub>c_all</sub>:{" "}
          {loading
            ? "Loading..."
            : metric?.Core_Centrality !== undefined
            ? parseFloat(metric.Core_Centrality).toFixed(4)
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
          <h3>Holme Explanation</h3> <br />
          <p>
            The <strong>Holme algorithm</strong> identifies core-periphery (CP)
            structures by optimizing the closeness centrality of core nodes. It
            assumes that core nodes are closely connected to all other nodes,
            differing from Borgatti-Everett-based methods.
          </p>
          <p>
            The closeness centrality, <InlineMath math="C_{cp}" />, is
            calculated as:
            <br />
            <BlockMath math="C_{cp} = \left( \frac{1}{|U|(n - 1)} \sum_{i \in U} \sum_{j \in V \setminus \{i\}} d_{ij} \right)^{-1}" />
            where:
            <ul>
              <li>
                <InlineMath math="U" /> represents the core nodes,
              </li>
              <li>
                <InlineMath math="V" /> represents all nodes,
              </li>
              <li>
                <InlineMath math="d_{ij}" /> is the distance between nodes{" "}
                <InlineMath math="i" /> and <InlineMath math="j" />.
              </li>
            </ul>
            This measure is the inverse of the average distance between core
            nodes and all other nodes, capturing how efficiently the core is
            connected within the network.
          </p>
          <p>
            The algorithm evaluates various <InlineMath math="k" />
            -cores and selects the best
            <InlineMath math="k" /> that maximizes the closeness centrality.
            Finally, it compares the observed core with a random configuration
            model to assess its statistical significance.
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

export default Holme;

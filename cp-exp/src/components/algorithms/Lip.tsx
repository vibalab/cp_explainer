import { FC, useState, useEffect } from "react";
import { useSigma } from "@react-sigma/core";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex"; // LaTeX 수식 표시를 위한 라이브러리
import { NodeData, EdgeData } from "../../types";
import axios from "axios";
import {
  fetchMetricData,
  updateGraphMetric,
  createGraphData,
} from "../sub/metricService"; // metricService 가져오기

interface LipProps {
  hoveredNode: string | null;
  method: string | null;
  setGraphData: React.Dispatch<
    React.SetStateAction<{
      nodes: NodeData[];
      edges: EdgeData[];
      core_indices: number[];
    }>
  >; // setGraphData를 props로 받아옴
}

const Lip: FC<LipProps> = ({ hoveredNode, method, setGraphData }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const doiRef = "https://doi.org/10.48550/arXiv.1102.5511";
  const [metric, setMetric] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [isSaving, setIsSaving] = useState(false); // 저장 중인지 여부
  const [zind, setZind] = useState<number>(0);

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
      const newZ =
        graph.getNodeAttribute(hoveredNode, "core_periphery_score") || 0;
      setZind(newZ.toFixed(4));
    } else {
      setZind(0); // hoveredNode가 없을 때는 0으로 설정
    }
  }, [graph, hoveredNode]);

  return (
    <div>
      <h3 style={{ marginBottom: 0 }}>Metric:</h3>
      <h1 style={{ fontSize: "24px", marginTop: 0, marginBottom: 0 }}>
        <a href={doiRef} target="_blank" rel="noopener noreferrer">
          Lip.
        </a>
      </h1>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        {/* 클릭 시 모달 열림 상태를 토글 */}
        <i style={{ cursor: "pointer" }} onClick={toggleModal}>
          Z: {metric?.Z}
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
        <i style={{ cursor: "pointer" }}>Z index: {zind}</i>
      </h2>

      {/* 모달이 열렸을 때만 표시 */}
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
          <h3>Lip Explanation</h3> <br />
          <p>
            The <strong>Lip algorithm</strong> identifies core-periphery (CP)
            structures by iteratively adding nodes with the highest degrees to
            the core set <InlineMath math="S_1" />, optimizing core-core
            connections while minimizing periphery-periphery links. The
            objective function <InlineMath math="Z(S_1)" /> is defined as:
          </p>
          <BlockMath math="Z(S_1) = \frac{1}{2} \left( \sum_{i \in S} \text{deg}(i) + k(k - 1) - \sum_{i \in S_1} \text{deg}(i) \right)" />
          <p>
            The algorithm minimizes <InlineMath math="Z(S_1)" /> to ensure core
            nodes are densely connected, while periphery nodes are sparsely
            connected. Its time complexity is reduced to{" "}
            <InlineMath math="O(n^2)" />, or{" "}
            <InlineMath math="O(n \log n + m)" /> with an adjacency list.
          </p>
          <button onClick={toggleModal}>Close</button>
        </div>
      )}

      {/* 모달이 열렸을 때 배경 어둡게 처리 */}
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
          onClick={toggleModal} // 배경 클릭 시 모달 닫기
        />
      )}
    </div>
  );
};

export default Lip;

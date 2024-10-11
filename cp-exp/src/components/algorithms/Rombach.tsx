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

interface RombachProps {
  hoveredNode: string | null;
  method: string | null;
  onThresholdChange: (threshold: number) => void; // Callback to send threshold to parent
  setGraphData: React.Dispatch<
    React.SetStateAction<{
      nodes: NodeData[];
      edges: EdgeData[];
      core_indices: number[];
    }>
  >; // setGraphData를 props로 받아옴
}

const Rombach: FC<RombachProps> = ({
  hoveredNode,
  method,
  onThresholdChange,
  setGraphData,
}) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [isModalOpen, setModalOpen] = useState(false);
  const [metric, setMetric] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const doiRef = "https://doi.org/10.1137/17M1130046";
  const [core_score, setCS] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(0.5); // Threshold state with default value

  // 모달 토글 함수
  const toggleModal = () => {
    setModalOpen(!isModalOpen);
  };

  // threshold 값 업데이트 함수
  const handleThresholdChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(event.target.value);
    if (value >= 0 && value <= 1) {
      setThreshold(value); // Update local threshold state
      onThresholdChange(value); // Send new threshold value to parent
      const graphData = createGraphData(graph);
      setGraphData(graphData);
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

  // 그래프나 hoveredNode가 변경될 때마다 alpha 값을 업데이트
  useEffect(() => {
    if (hoveredNode) {
      const newCore_scores =
        graph.getNodeAttribute(hoveredNode, "core_periphery") || 0;
      setCS(newCore_scores.toFixed(4));
    } else {
      setCS(0); // hoveredNode가 없을 때는 0으로 설정
    }
  }, [graph, hoveredNode]);

  return (
    <div>
      <h3 style={{ marginBottom: 0 }}>Metric:</h3>
      <h1 style={{ fontSize: "24px", marginTop: 0, marginBottom: 0 }}>
        <a href={doiRef} target="_blank" rel="noopener noreferrer">
          Rombach.
        </a>
      </h1>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        <i style={{ cursor: "pointer" }} onClick={toggleModal}>
          R<sub>gamma</sub>: {metric?.R_gamma.toFixed(4) || "N/A"}
        </i>
      </h2>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        <i style={{ cursor: "pointer" }}>Core Score: {core_score}</i>
      </h2>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        {/* threshold 값 표시 및 입력 */}
        <label>
          Threshold (0-1):
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={threshold}
            onChange={handleThresholdChange}
            style={{ marginLeft: "10px" }}
          />
        </label>
      </h2>

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
          <h3>Core-Periphery Profile Explanation</h3> <br />
          <p>
            The <strong>Rombach algorithm</strong> focuses on maximizing Core
            Quality, which is defined as the product of the adjacency matrix
            <InlineMath math="A" /> and the core-periphery matrix{" "}
            <InlineMath math="C" />. The matrix <InlineMath math="C" /> can be
            defined in various ways using a transition function that assigns
            nodes to either the core or periphery.
          </p>
          <p>
            Optimization is performed using annealing, allowing the model to
            find the optimal core-periphery allocation for the network.
            Additionally, the model calculates a Core Score to evaluate each
            node’s contribution to the CP structure.
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

export default Rombach;

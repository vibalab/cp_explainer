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
      <h3 style={{ marginBottom: 0 }}>Method:</h3>
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
          <h3>Rombach Explanation</h3> <br />
          <p>
            The <strong>Rombach algorithm</strong> identifies core-periphery
            structures by maximizing Core Quality, measured using the adjacency
            matrix <InlineMath math="A" /> and the core-periphery matrix{" "}
            <InlineMath math="C" />. The core-periphery assignment is optimized
            through a transition function.
          </p>
          <p>
            The algorithm defines <InlineMath math="R_{\gamma}" /> as follows:
            <br />
            <BlockMath math="R_{\gamma} = \frac{\sum_{i,j} A_{ij} C_{i} C_{j}}{\sum_{i,j} A_{ij}}" />
            where:
            <ul>
              <li>
                <InlineMath math="A_{ij}" /> represents the adjacency matrix
                element between nodes <InlineMath math="i" /> and{" "}
                <InlineMath math="j" />.
              </li>
              <li>
                <InlineMath math="C_{i}" /> and <InlineMath math="C_{j}" />{" "}
                represent core-periphery assignments.
              </li>
            </ul>
            This ratio quantifies how well the network aligns with an ideal
            core-periphery structure.
          </p>
          <br />
          <p>
            The <strong>Core Score</strong> for each node is calculated as:
            <br />
            <BlockMath math="Core\ Score(i) = \sum_{j} A_{ij} C_{j}" />
            where:
            <ul>
              <li>
                <InlineMath math="A_{ij}" /> is the adjacency matrix value
                between node <InlineMath math="i" /> and <InlineMath math="j" />
                .
              </li>
              <li>
                <InlineMath math="C_{j}" /> is the core-periphery assignment of
                node <InlineMath math="j" />, where core nodes contribute higher
                values.
              </li>
            </ul>
            This score reflects each node's role in the core-periphery
            structure, with higher scores indicating stronger integration into
            the core.
          </p>
          <p>
            The Rombach algorithm uses an annealing process to refine
            assignments, maximizing Core Quality and Core Scores.
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
            backgroundColor: "rgba(0, 0, 0, 0)",
            zIndex: 999,
          }}
          onClick={toggleModal} // 배경 클릭 시 모달 닫기
        />
      )}
    </div>
  );
};

export default Rombach;

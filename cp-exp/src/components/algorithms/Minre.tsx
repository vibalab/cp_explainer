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

interface MinreProps {
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

const Minre: FC<MinreProps> = ({
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
  const doiRef = "https://doi.org/10.1016/j.socnet.2009.09.003";
  const [W, setW] = useState<number>(0);
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
      const newW = graph.getNodeAttribute(hoveredNode, "core_periphery") || 0;
      setW(newW.toFixed(4));
    } else {
      setW(0); // hoveredNode가 없을 때는 0으로 설정
    }
  }, [graph, hoveredNode]);

  return (
    <div>
      <h3 style={{ marginBottom: 0 }}>Metric:</h3>
      <h1 style={{ fontSize: "24px", marginTop: 0, marginBottom: 0 }}>
        <a href={doiRef} target="_blank" rel="noopener noreferrer">
          Minre.
        </a>
      </h1>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        <i style={{ cursor: "pointer" }} onClick={toggleModal}>
          PRE: {metric?.PRE.toFixed(4) || "N/A"}
        </i>
      </h2>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        <i style={{ cursor: "pointer" }}>w: {W}</i>
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
          <h3>MINRE (Minimum Residual Error)</h3>
          <p>
            MINRE is a method used to estimate the{" "}
            <strong>Core-Periphery structure</strong> in a network. The goal of
            MINRE is to adjust the weight vector <InlineMath math="w" /> to
            approximate the network's adjacency matrix
            <InlineMath math="A" />. This is done by minimizing the residuals
            between the matrix product
            <InlineMath math="w w^T" /> and the adjacency matrix{" "}
            <InlineMath math="A" />.
          </p>
          <p>The residual to be minimized is given by the following formula:</p>
          <BlockMath math="SS(A - w w^T) = \sum_{i \neq j} (A_{ij} - w_i w_j)^2" />
          <p>Where:</p>
          <ul>
            <li>
              <InlineMath math="A" /> is the adjacency matrix, representing the
              connection strengths between nodes.
            </li>
            <li>
              <InlineMath math="w" /> is the weight vector, indicating whether
              each node belongs to the core or periphery.
            </li>
            <li>
              The residual represents the difference between{" "}
              <InlineMath math="A" /> and <InlineMath math="w w^T" />.
            </li>
          </ul>
          <p>
            The objective of the MINRE algorithm is to find the optimal weight
            vector <InlineMath math="w" />, where nodes with higher{" "}
            <InlineMath math="w" /> values are classified as core nodes, and
            those with lower values are classified as periphery nodes.
          </p>
          <br />
          <br />
          <h3>PRE (Proportion of Reduction in Error)</h3>
          <p>
            PRE is a metric used to evaluate the performance of the MINRE model.
            It measures how well the model fits the Core-Periphery structure of
            the network by comparing the residuals to the global mean of the
            adjacency matrix, denoted as <InlineMath math="\bar{A}" />.
          </p>
          <p>PRE is defined as follows:</p>
          <BlockMath math="PRE = 1 - \frac{SS(A - w w^T)}{SS(A - \bar{A})}" />
          <p>Where:</p>
          <ul>
            <li>
              <InlineMath math="SS(A - w w^T)" /> is the residual calculated by
              the MINRE method.
            </li>
            <li>
              <InlineMath math="\bar{A}" /> is the global mean of the adjacency
              matrix <InlineMath math="A" />.
            </li>
          </ul>
          <p>
            A higher PRE value indicates that the model provides a better fit
            for the network's Core-Periphery structure. Specifically, it shows
            how much the MINRE model reduces the residuals compared to using the
            global mean.
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

export default Minre;

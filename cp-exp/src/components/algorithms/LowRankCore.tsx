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

interface LowRankCoreProps {
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

const LowRankCore: FC<LowRankCoreProps> = ({
  method,
  hoveredNode,
  setGraphData,
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const doiRef = "https://doi.org/10.1017/S095679251600022X";
  const [metric, setMetric] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [isSaving, setIsSaving] = useState(false); // 저장 중인지 여부
  const [score, setScores] = useState<number>(0);

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
      const newScores =
        graph.getNodeAttribute(hoveredNode, "core_periphery_score") || 0;
      setScores(newScores.toFixed(2));
    } else {
      setScores(0); // hoveredNode가 없을 때는 0으로 설정
    }
  }, [graph, hoveredNode]);

  return (
    <div>
      <h3 style={{ marginBottom: 0 }}>Metric: </h3>
      <h1 style={{ fontSize: "24px", marginTop: 0, marginBottom: 0 }}>
        <a href={doiRef} target="_blank" rel="noopener noreferrer">
          Low Rank Core.
        </a>
      </h1>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        <i style={{ cursor: "pointer" }} onClick={toggleModal}>
          Q:{" "}
          {loading
            ? "Loading..."
            : metric?.Q !== undefined
            ? metric.Q.toFixed(4)
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
        <i style={{ cursor: "pointer" }}>Score: {score}</i>
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
          <h3>LowRank-Core Method</h3> <br />
          <p>
            The <strong>LowRank-Core</strong> method combines spectral analysis
            to denoise the network and recover a block model. It uses the top
            two eigenvalues <InlineMath math="\lambda_1" /> and{" "}
            <InlineMath math="\lambda_2" />
            along with their corresponding eigenvectors{" "}
            <InlineMath math="v_1" /> and <InlineMath math="v_2" />
            to form a rank-2 approximation of the adjacency matrix{" "}
            <InlineMath math="A" />.
          </p>
          <p>This approximation is expressed as:</p>
          <BlockMath math="\hat{A} = \lambda_1 v_1 v_1^T + \lambda_2 v_2 v_2^T" />
          <p>
            This step captures the dominant patterns of the network, removing
            noise and recovering the Core-Periphery (CP) structure.
          </p>
          <br /> <br />
          <h3>Thresholding and Find-Cut Algorithm</h3> <br />
          <p>
            After thresholding <InlineMath math="\hat{A}" /> to create{" "}
            <InlineMath math="\hat{A}_t" />, which is composed of zeros and
            ones, the <strong>Find-Cut algorithm</strong> is applied. The
            Find-Cut algorithm optimizes the partition by ensuring core-core and
            core-periphery connections remain dense while keeping
            periphery-periphery connections sparse.
          </p>
          <p>
            The <strong>Find-Cut algorithm</strong> classifies the vertices of a
            graph into a core set
            <InlineMath math="V_C" /> and a periphery set{" "}
            <InlineMath math="V_P" /> based on a score vector{" "}
            <InlineMath math="s = (s_1, s_2, \dots, s_n)" />. The entries of{" "}
            <InlineMath math="s" />
            are sorted in decreasing order, and the algorithm selects the core
            size <InlineMath math="n_c" />
            that maximizes the following objective function:
          </p>
          <BlockMath math="\Phi = \max_{n_c} \left( \frac{|E(X_C, X_C)|}{\text{Vol}(X_C, X_C)} + \frac{|E(X_C, Y_C)|}{\text{Vol}(X_C, Y_C)} - \frac{|E(Y_C, Y_C)|}{\text{Vol}(Y_C, Y_C)} \right)" />
          <p>
            The core set <InlineMath math="V_C = \{1, \dots, n_c\}" /> and
            periphery set <InlineMath math="V_P = \{n_c+1, \dots, n\}" /> are
            then defined to maximize core-periphery structure.
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

export default LowRankCore;

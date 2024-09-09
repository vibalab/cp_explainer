import { FC, useState, useEffect } from "react";
import { useSigma } from "@react-sigma/core";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex"; // LaTeX 수식 표시를 위한 라이브러리
import axios from "axios";

interface RossaProps {
  hoveredNode: string | null;
  method: string | null;
}

const Rossa: FC<RossaProps> = ({ hoveredNode, method }) => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [isModalOpen, setModalOpen] = useState(false);
  const [metric, setMetric] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const doiRef = "https://doi.org/10.1038/srep01467";
  const [alpha, setAlpha] = useState<number>(0);

  // 모달 토글 함수
  const toggleModal = () => {
    setModalOpen(!isModalOpen);
  };

  // 데이터 가져오는 함수
  const fetchData = async () => {
    try {
      const res = await axios.get("http://localhost:8000/graph/metric-json/");
      const dataset: Record<string, any> = res.data; // 서버에서 가져온 데이터를 Overview 타입으로 변환
      setMetric(dataset);
      setLoading(false); // 로딩 완료 상태로 설정
    } catch (err) {
      console.error("Error fetching dataset:", err);
      setError("Failed to load graph data.");
      setLoading(false); // 오류 발생 시 로딩 상태 해제
    }
  };

  // method가 바뀔 때마다 fetchData 실행
  useEffect(() => {
    if (method) {
      fetchData(); // method가 있을 때만 데이터 가져오기
    }
  }, [method]);

  // 그래프나 hoveredNode가 변경될 때마다 alpha 값을 업데이트
  useEffect(() => {
    if (hoveredNode) {
      const newAlpha =
        graph.getNodeAttribute(hoveredNode, "core_periphery") || 0;
      setAlpha(newAlpha.toFixed(4));
    } else {
      setAlpha(0); // hoveredNode가 없을 때는 0으로 설정
    }
  }, [graph, hoveredNode]); // graph와 hoveredNode에 종속

  return (
    <div>
      <h3 style={{ marginBottom: 0 }}>Metric:</h3>
      <h1 style={{ fontSize: "24px", marginTop: 0, marginBottom: 0 }}>
        <a href={doiRef} target="_blank" rel="noopener noreferrer">
          Rossa.
        </a>
      </h1>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        {/* 클릭 시 모달 열림 상태를 토글 */}
        <i style={{ cursor: "pointer" }} onClick={toggleModal}>
          cp_centrality: {metric?.cp_centrality.toFixed(4) || "N/A"}
        </i>
      </h2>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        {/* alpha 값 표시 */}
        <i style={{ cursor: "pointer" }}>alpha: {alpha}</i>
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
          <h3>Core-Periphery Profile Explanation</h3>
          <p>
            The <strong>Core-Periphery Profile</strong> (denoted as{" "}
            <InlineMath>a_k</InlineMath>) is a way to capture the structure of a
            network, where the goal is to determine which nodes belong to the
            "core" and which belong to the "periphery."
          </p>
          <p>
            The profile values <InlineMath>a_k</InlineMath> are calculated
            iteratively by selecting the node with minimal strength at each
            step. The process is as follows:
          </p>
          <ul>
            <li>
              <strong>Step 1:</strong> Select the node with the smallest
              strength and initialize the core. Set{" "}
              <InlineMath>a_1 = 0</InlineMath>.
            </li>
            <li>
              <strong>Step k:</strong> For each subsequent step, select the node
              that minimizes the sum of connection strengths between the
              existing core nodes and the newly added node. This is calculated
              as:
              <BlockMath>
                {`a_k = \\min_{h \\in N \\setminus P_{k-1}} \\sum_{i \\in P_{k-1}} p_{ih}`}
              </BlockMath>
            </li>
          </ul>
          <p>
            The core-periphery profile is monotonic, meaning that:
            <BlockMath>{`a_{k+1} \\geq a_k \\quad \\text{for all} \\ k = 1, 2, \\dots, n-1.`}</BlockMath>
          </p>

          <h3>Centralization Explanation</h3>
          <p>
            The <strong>Centralization</strong> of a network, denoted as
            <InlineMath>C</InlineMath>, measures how closely the network
            resembles a perfect star network, where one central node is
            connected to all others (core-periphery structure).
          </p>
          <p>
            The centralization is defined as the complement of the normalized
            area between the core-periphery profile <InlineMath>a_k</InlineMath>{" "}
            and the profile of a star network. The formula is given by:
            <BlockMath>{`C = 1 - \\frac{2}{n(n-1)} \\sum_{k=1}^{n-1} a_k`}</BlockMath>
          </p>
          <p>
            In a star network, the profile values are{" "}
            <InlineMath>a_k = 0</InlineMath> for
            <InlineMath>k = 1, 2, \dots, n-1</InlineMath>, and{" "}
            <InlineMath>a_n = 1</InlineMath>
            for the final node.
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

export default Rossa;

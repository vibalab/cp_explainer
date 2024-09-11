import { FC, useState, useEffect } from "react";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex"; // LaTeX 수식 표시를 위한 라이브러리
import axios from "axios";

interface BruscoProps {
  method: string | null;
}
const Brusco: FC<BruscoProps> = ({ method }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const doiRef = "https://doi.org/10.1016/S0378-8733(99)00019-2";
  const [metric, setMetric] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div>
      <h3 style={{ marginBottom: 0 }}>Metric:</h3>
      <h1 style={{ fontSize: "24px", marginTop: 0, marginBottom: 0 }}>
        <a href={doiRef} target="_blank" rel="noopener noreferrer">
          Brusco.
        </a>
      </h1>
      <h2 style={{ marginTop: 0, marginBottom: 0 }}>
        {/* 클릭 시 모달 열림 상태를 토글 */}
        <i style={{ cursor: "pointer" }} onClick={toggleModal}>
          Z: {metric?.Z}
        </i>
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
          <h3>Metric Explanation</h3>
          <p>
            The Borgatti and Everett metric measures how well the observed
            network agrees with an "ideal" core-periphery (CP) structure. The CP
            structure assumes that the core is dense and the periphery is
            sparse. The ideal CP structure, <InlineMath>{"\\Delta"}</InlineMath>
            , is defined as:
          </p>
          <BlockMath>{"\\Delta_{ij} = c_i + c_j - c_i c_j"}</BlockMath>
          <p>
            where <InlineMath>c_i</InlineMath> and <InlineMath>c_j</InlineMath>{" "}
            are indicators of whether nodes <InlineMath>i</InlineMath> or{" "}
            <InlineMath>j</InlineMath> is in the core.
          </p>
          <p>
            The Borgatti and Everett metric, <InlineMath>{"\\rho"}</InlineMath>,
            is then computed as the Pearson correlation between the adjacency
            matrix <InlineMath>A</InlineMath> and the ideal CP structure{" "}
            <InlineMath>{"\\Delta"}</InlineMath>:
          </p>
          <BlockMath>{"\\rho = \\text{Cor}(A, \\Delta)"}</BlockMath>
          <p>
            This metric can be used to assess how well the network aligns with a
            CP structure. In some cases, the node assignments are known, but in
            more complex cases, a combinatorial optimization routine, such as a
            genetic algorithm, is used to find the optimal assignments.
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

export default Brusco;

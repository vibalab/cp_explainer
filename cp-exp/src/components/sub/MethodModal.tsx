import React, { useState } from "react";
import styled from "styled-components";

interface MethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessing: (method: string, parameters: Record<string, string>) => void;
}

const MethodModal: React.FC<MethodModalProps> = ({
  isOpen,
  onClose,
  onProcessing,
}) => {
  const [selectedMethod, setSelectedMethod] = useState("BE");
  const [parameters, setParameters] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleMethodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMethod(event.target.value);
    setParameters({}); // 메소드 변경 시 파라미터 초기화
  };

  const handleParameterChange = (paramKey: string, value: string) => {
    setParameters((prev) => ({
      ...prev,
      [paramKey]: value,
    }));
  };

  const handleSubmit = () => {
    onProcessing(selectedMethod, parameters); // 선택한 메소드와 파라미터를 부모로 전달
    onClose(); // 모달 닫기
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const renderMethodDescription = () => {
    switch (selectedMethod) {
      case "BE":
        return (
          <ul>
            <li>
              <strong>Assumption:</strong> Stochastic Block Model
            </li>
            <li>
              <strong>Core Idea:</strong> Evaluates network fit to an ideal
              core-periphery structure.
            </li>
            <li>
              <strong>Method:</strong> Calculates correlation between adjacency
              and ideal CP matrices.
            </li>
          </ul>
        );
      case "Brusco":
        return (
          <ul>
            <li>
              <strong>Assumption:</strong> Stochastic Block Model
            </li>
            <li>
              <strong>Core Idea:</strong> Enhances Borgatti-Everett model for
              clearer core-periphery boundaries.
            </li>
            <li>
              <strong>Method:</strong> Maximizes core-core links, minimizes
              periphery links using penalties.
            </li>
          </ul>
        );
      case "Lip":
        return (
          <ul>
            <li>
              <strong>Assumption:</strong> Stochastic Block Model
            </li>
            <li>
              <strong>Core Idea:</strong> Assigns nodes to core by degree
              ranking.
            </li>
            <li>
              <strong>Method:</strong> Focuses on high-degree nodes in core,
              minimizes peripheral links.
            </li>
          </ul>
        );
      case "LLC":
        return (
          <ul>
            <li>
              <strong>Assumption:</strong> Stochastic Block Model
            </li>
            <li>
              <strong>Core Idea:</strong> Uses spectral analysis to reduce noise
              and reveal structure.
            </li>
            <li>
              <strong>Method:</strong> Constructs core boundary using matrix
              approximation techniques.
            </li>
          </ul>
        );
      case "Holme":
        return (
          <ul>
            <li>
              <strong>Assumption:</strong> Transport-based
            </li>
            <li>
              <strong>Core Idea:</strong> Maximizes closeness centrality of core
              nodes.
            </li>
            <li>
              <strong>Method:</strong> Uses k-core analysis to find optimal core
              structure.
            </li>
          </ul>
        );
      case "Silva":
        return (
          <ul>
            <li>
              <strong>Assumption:</strong> Transport-based
            </li>
            <li>
              <strong>Core Idea:</strong> Measures connectivity to identify core
              nodes.
            </li>
            <li>
              <strong>Method:</strong> Removes low-centrality nodes until
              network capacity drops.
            </li>
          </ul>
        );
      case "Rossa":
        return (
          <ul>
            <li>
              <strong>Assumption:</strong> Random Walk
            </li>
            <li>
              <strong>Core Idea:</strong> Minimizes transition probabilities
              among periphery nodes.
            </li>
            <li>
              <strong>Method:</strong> Iteratively assigns low-degree nodes to
              periphery.
            </li>
          </ul>
        );
      case "Minre":
        return (
          <ul>
            <li>
              <strong>Assumption:</strong> Matrix Approximation
            </li>
            <li>
              <strong>Core Idea:</strong> Minimizes residuals using weighted
              vector approximation.
            </li>
            <li>
              <strong>Method:</strong> Assigns high-weight nodes to core,
              low-weight to periphery.
            </li>
          </ul>
        );
      case "Rombach":
        return (
          <ul>
            <li>
              <strong>Assumption:</strong> Core Quality Maximization
            </li>
            <li>
              <strong>Core Idea:</strong> Optimizes core assignment based on
              Core Quality.
            </li>
            <li>
              <strong>Method:</strong> Uses transition function and annealing to
              find optimal boundaries.
            </li>
          </ul>
        );
      default:
        return null;
    }
  };

  const renderParameters = () => {
    switch (selectedMethod) {
      case "BE":
      case "Brusco":
      case "Holme":
      case "Minre":
        return (
          <div>
            <label>
              Number of Iters:
              <br />
              <input
                type="number"
                value={parameters["n_iter"] || ""}
                onChange={(e) =>
                  handleParameterChange("n_iter", e.target.value)
                }
                style={{ width: "95%", padding: "5px", marginTop: "5px" }}
              />
            </label>
          </div>
        );
      case "Silva":
        return (
          <div>
            <label>
              Threshold:
              <br />
              <input
                type="number"
                value={parameters["threshold"] || ""}
                onChange={(e) =>
                  handleParameterChange("threshold", e.target.value)
                }
                style={{ width: "95%", padding: "5px", marginTop: "5px" }}
              />
            </label>
          </div>
        );
      case "LLC":
        return (
          <div>
            <label>
              Beta:
              <br />
              <input
                type="number"
                value={parameters["beta"] || ""}
                onChange={(e) => handleParameterChange("beta", e.target.value)}
                style={{ width: "95%", padding: "5px", marginTop: "5px" }}
              />
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "none",
          zIndex: 999,
        }}
        onClick={onClose}
      />

      <div
        onClick={handleModalClick}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "white",
          padding: "20px",
          zIndex: 1000,
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          width: "400px",
          borderRadius: "10px",
          border: "1px solid black",
        }}
      >
        <h3>Select Method</h3>
        <div style={{ marginBottom: "20px", textAlign: "left" }}>
          <label htmlFor="method-select">Choose a method: </label>
          <br />
          <select
            id="method-select"
            value={selectedMethod}
            onChange={handleMethodChange}
            style={{
              width: "100%",
              padding: "5px",
              marginTop: "5px",
            }}
          >
            <option value="BE">Borgatti Everett</option>
            <option value="Brusco">Brusco</option>
            <option value="Lip">Lip</option>
            <option value="Holme">Holme</option>
            <option value="Silva">Silva</option>
            <option value="LLC">LowRankCore</option>
            <option value="Rossa">Rossa</option>
            <option value="Minre">Minre</option>
            <option value="Rombach">Rombach</option>
          </select>
        </div>
        <div style={{ marginBottom: "20px", textAlign: "left" }}>
          <strong>Method Features:</strong>
          <div>{renderMethodDescription()}</div>
        </div>
        <div style={{ marginBottom: "20px", textAlign: "left" }}>
          {renderParameters()}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <StyledButton onClick={handleSubmit}>Confirm</StyledButton>
          <StyledButton onClick={onClose}>Cancel</StyledButton>
        </div>
      </div>
    </>
  );
};

// StyledButton component for consistent styling
const StyledButton = styled.button<{ $isHovered?: boolean }>`
  display: block;
  width: 45%;
  background-color: ${(props) => (props.$isHovered ? "#87CEEB" : "#fff")};
  color: ${(props) => (props.$isHovered ? "#fff" : "#000")};
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  font-family: "Arial", sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #87ceeb;
    color: #fff;
  }
`;

export default MethodModal;

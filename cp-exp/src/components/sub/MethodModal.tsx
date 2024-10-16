import React, { useState } from "react";

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

  const renderParameters = () => {
    switch (selectedMethod) {
      case "BE":
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
                style={{ width: "100%", padding: "5px", marginTop: "5px" }} // 스타일 수정
              />
            </label>
            <br />
          </div>
        );
      case "Brusco":
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
                style={{ width: "100%", padding: "5px", marginTop: "5px" }} // 스타일 수정
              />
            </label>
            <br />
          </div>
        );

      case "Lip":
        return <div></div>;
      case "Holme":
        return (
          <div>
            <label>
              Number of Iters for Configure Model:
              <br />
              <input
                type="number"
                value={parameters["n_iter"] || ""}
                onChange={(e) =>
                  handleParameterChange("n_iter", e.target.value)
                }
                style={{ width: "100%", padding: "5px", marginTop: "5px" }} // 스타일 수정
              />
            </label>
            <br />
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
                style={{ width: "100%", padding: "5px", marginTop: "5px" }} // 스타일 수정
              />
            </label>
            <br />
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
                style={{ width: "100%", padding: "5px", marginTop: "5px" }} // 스타일 수정
              />
            </label>
            <br />
          </div>
        );
      case "Rossa":
        return <div></div>;
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
                style={{ width: "100%", padding: "5px", marginTop: "5px" }} // 스타일 수정
              />
            </label>
            <br />
          </div>
        );
      case "Rombach":
        return (
          <div>
            <label>
              Number of Steps:
              <br />
              <input
                type="number"
                value={parameters["n_iter"] || ""}
                onChange={(e) =>
                  handleParameterChange("n_iter", e.target.value)
                }
                style={{ width: "100%", padding: "5px", marginTop: "5px" }} // 스타일 수정
              />
            </label>
            <br />
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
          backgroundColor: "rgba(0, 0, 0, 0.5)",
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
          width: "300px",
          borderRadius: "10px",
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
              width: "100%", // select 필드를 가득 채움
              padding: "5px", // padding 추가
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
          {renderParameters()}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={handleSubmit}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginLeft: "10px",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default MethodModal;

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
              Alpha:
              <input
                type="number"
                value={parameters["alpha"] || ""}
                onChange={(e) => handleParameterChange("alpha", e.target.value)}
              />
            </label>
            <br />
            <label>
              Beta:
              <input
                type="number"
                value={parameters["beta"] || ""}
                onChange={(e) => handleParameterChange("beta", e.target.value)}
              />
            </label>
          </div>
        );
      case "Rossa":
        return (
          <div>
            <label>
              Threshold:
              <input
                type="number"
                value={parameters["threshold"] || ""}
                onChange={(e) =>
                  handleParameterChange("threshold", e.target.value)
                }
              />
            </label>
          </div>
        );
      case "Method 3":
        return (
          <div>
            <label>
              Gamma:
              <input
                type="number"
                value={parameters["gamma"] || ""}
                onChange={(e) => handleParameterChange("gamma", e.target.value)}
              />
            </label>
            <br />
            <label>
              Delta:
              <input
                type="number"
                value={parameters["delta"] || ""}
                onChange={(e) => handleParameterChange("delta", e.target.value)}
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
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="method-select">Choose a method: </label>
          <select
            id="method-select"
            value={selectedMethod}
            onChange={handleMethodChange}
            style={{
              marginLeft: "10px",
              padding: "5px",
              width: "100%",
            }}
          >
            <option value="BE">Borgatti Everett</option>
            <option value="Rossa">Rossa</option>
            <option value="Method 3">Method 3</option>
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>{renderParameters()}</div>

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

import React, { useState } from "react";

interface MethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: string) => void;
}

const MethodModal: React.FC<MethodModalProps> = ({
  isOpen,
  onClose,
  onSelectMethod,
}) => {
  const [selectedMethod, setSelectedMethod] = useState("BE"); // 기본값을 "BE"로 설정

  if (!isOpen) return null; // 모달이 열리지 않으면 아무것도 렌더링하지 않음

  const handleMethodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMethod(event.target.value);
  };

  const handleSubmit = () => {
    onSelectMethod(selectedMethod); // 선택한 메소드 부모로 전달
    onClose(); // 모달 닫기
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // 모달 내용 클릭 시 배경 클릭 이벤트 막기
  };

  return (
    <>
      {/* 모달 배경 */}
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
        onClick={onClose} // 배경 클릭 시 모달 닫기
      />

      {/* 모달 창 */}
      <div
        onClick={handleModalClick} // 모달 클릭 시 배경 클릭 이벤트 무효화
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

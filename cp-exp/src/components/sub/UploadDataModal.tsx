import React, { useState } from "react";
import axios from "axios";

interface UploadDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void; // 파일 객체를 전달할 콜백
}

const UploadDataModal: React.FC<UploadDataModalProps> = ({
  isOpen,
  onClose,
  onFileUpload, // 부모로부터 받은 콜백 함수
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 파일 선택 핸들러
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedFile(file);
  };

  // 파일 업로드 핸들러
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("파일을 선택하세요.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        "http://localhost:8000/uploadfile/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert(response.data.message);
      onFileUpload(selectedFile); // 부모에게 파일 객체 전달
      onClose(); // 업로드 완료 후 모달 닫기
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "파일 업로드 중 axios 오류 발생:",
          error.response?.data || error.message
        );
      } else {
        console.error("파일 업로드 중 오류 발생:", error);
      }
      alert(
        "파일 업로드 중 오류가 발생했습니다. 콘솔에서 자세한 내용을 확인하세요."
      );
    }
  };

  if (!isOpen) return null; // 모달이 열리지 않았을 때 렌더링하지 않음

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
        <h3>데이터 업로드</h3>
        <div style={{ marginBottom: "20px" }}>
          <input type="file" onChange={handleFileChange} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button
            onClick={handleUpload}
            style={{
              padding: "8px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            업로드
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
            취소
          </button>
        </div>
      </div>
    </>
  );
};

export default UploadDataModal;

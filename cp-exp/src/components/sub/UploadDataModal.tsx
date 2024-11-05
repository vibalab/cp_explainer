import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";

interface UploadDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
}

const UploadDataModal: React.FC<UploadDataModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedFile(file);
  };

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
      onFileUpload(selectedFile);
      onClose();
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

  if (!isOpen) return null;

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
          border: "1px solid black",
        }}
      >
        <h3>Upload Your Own Graph File</h3>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Supported file formats:{" "}
          <a
            href="https://networkx.org/documentation/stable/reference/readwrite/gexf.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            .gexf
          </a>
          ,{" "}
          <a
            href="https://networkx.org/documentation/stable/reference/readwrite/gml.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            .gml
          </a>
          ,{" "}
          <a
            href="https://networkx.org/documentation/stable/reference/readwrite/graphml.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            .graphml
          </a>
          ,{" "}
          <a
            href="https://networkx.org/documentation/stable/reference/readwrite/adjlist.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            .adjlist
          </a>
          ,{" "}
          <a
            href="https://networkx.org/documentation/stable/reference/readwrite/edgelist.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            .edgelist
          </a>
          ,{" "}
          <a
            href="https://networkx.org/documentation/stable/reference/readwrite/pajek.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            .net
          </a>
          ,{" "}
          <a
            href="https://networkx.org/documentation/stable/reference/readwrite/yaml.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            .yaml
          </a>
          ,{" "}
          <a
            href="https://networkx.org/documentation/stable/reference/readwrite/graph6.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            .graph6
          </a>
          ,{" "}
          <a
            href="https://networkx.org/documentation/stable/reference/readwrite/graph6.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            .sparse6
          </a>
          ,{" "}
          <a
            href="https://networkx.org/documentation/stable/reference/readwrite/gpickle.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            .gpickle
          </a>
          ,{" "}
          <a
            href="https://networkx.org/documentation/stable/reference/readwrite/json_graph.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            .json
          </a>
          ,{" "}
          <span className="tooltip">
            .xlsx, .csv
            <span className="tooltiptext">
              Format for .xlsx/.csv: <br />
              <strong>With weights:</strong>
              <br />
              source | target | weight
              <br />
              <strong>Without weights:</strong>
              <br />
              source | target
            </span>
          </span>
        </p>
        <div style={{ marginBottom: "20px" }}>
          <input type="file" onChange={handleFileChange} />
        </div>
        <ButtonContainer>
          <ToggleButton onClick={handleUpload}>Load</ToggleButton>
          <ToggleButton onClick={onClose}>Quit</ToggleButton>
        </ButtonContainer>
      </div>

      <style>{`
        .tooltip {
          position: relative;
          display: inline-block;
          cursor: pointer;
        }

        .tooltiptext {
          visibility: hidden;
          width: 200px;
          background-color: #f9f9f9;
          color: #333;
          text-align: center;
          border-radius: 6px;
          padding: 5px;
          position: absolute;
          z-index: 1;
          bottom: 125%;
          left: 50%;
          margin-left: -100px;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .tooltip:hover .tooltiptext {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </>
  );
};

export default UploadDataModal;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ToggleButton = styled.button`
  display: block;
  width: 45%;
  background-color: #fff;
  color: #000;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  font-family: "Arial", sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: #87ceeb;
    color: #fff;
  }
`;

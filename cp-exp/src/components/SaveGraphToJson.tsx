import { useSigma } from "@react-sigma/core";
import { FC, useState } from "react";
import { saveAs } from "file-saver"; // file-saver 라이브러리 사용
import { NodeData, EdgeData } from "../types"; // NodeData와 EdgeData 인터페이스 가져오기

const SaveGraphToJson: FC = () => {
  const sigma = useSigma();
  const graph = sigma.getGraph();
  const [isSaving, setIsSaving] = useState(false); // 저장 중인지 여부

  // 그래프 데이터를 JSON으로 변환하여 저장하는 함수
  const saveGraphAsJson = () => {
    if (!graph) {
      console.error("Graph is not available");
      return;
    }

    setIsSaving(true); // 저장 중으로 설정

    // 그래프 데이터를 JSON으로 직렬화
    const graphData: { nodes: NodeData[]; edges: EdgeData[] } = {
      nodes: [],
      edges: [],
    };

    // 노드와 엣지를 JSON 포맷으로 변환
    graph.forEachNode((node: string, attributes: any) => {
      graphData.nodes.push({
        id: node,
        key: node, // 이 부분에서 key와 id가 동일하게 처리됨
        label: attributes.label,
        x: attributes.x,
        y: attributes.y,
        degree: attributes.degree,
        degree_centrality: attributes.degree_centrality,
        betweenness_centrality: attributes.betweenness_centrality,
        closeness_centrality: attributes.closeness_centrality,
        eigenvector_centrality: attributes.eigenvector_centrality,
        core_periphery: attributes.core_periphery,
        group: attributes.group,
        attributes: attributes.attributes || {}, // attributes는 선택적으로 처리
      });
    });

    graph.forEachEdge(
      (edge: string, attributes: any, source: string, target: string) => {
        graphData.edges.push({
          source,
          target,
          weight: attributes.weight,
          attributes: attributes.attributes || {}, // attributes는 선택적으로 처리
        });
      }
    );

    // JSON 데이터를 Blob으로 변환
    const blob = new Blob([JSON.stringify(graphData, null, 2)], {
      type: "application/json",
    });

    // 파일을 저장하는 방법으로 'file-saver' 라이브러리를 사용하여 파일 다운로드
    saveAs(blob, "graph-data.json");

    setIsSaving(false); // 저장 완료
  };

  return (
    <button onClick={saveGraphAsJson} disabled={isSaving}>
      {isSaving ? "Saving..." : "Save Graph as JSON"}
    </button>
  );
};

export default SaveGraphToJson;

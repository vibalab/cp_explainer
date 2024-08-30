import { FC, useEffect, PropsWithChildren, useState } from "react"; // React 훅과 타입을 가져옴
import { keyBy } from "lodash"; // lodash 라이브러리에서 keyBy와 omit 함수를 가져옴
import { useSigma } from "@react-sigma/core"; // Sigma 인스턴스를 가져옴
import "@react-sigma/core/lib/react-sigma.min.css"; // Sigma의 기본 스타일을 가져옴
import { Dataset } from "../types"; // 커스텀 타입 정의를 가져옴

// 데이터 변환 함수
//// 작성 사유: NodeData의 "type" 컬럼으로 필터링을 하려는데, "type"이라는 변수명이 Sigma.js의 기본 속성 이름과 겹쳐서 에러가 겁나 남 -> 이름 변경(m_type)

interface GraphDataControllerProps {
  dataset: Dataset;
}

const GraphDataController: FC<PropsWithChildren<GraphDataControllerProps>> = ({
  dataset,
  children,
}) => {
  const sigma = useSigma(); // Sigma 인스턴스를 가져옴
  const graph = sigma.getGraph(); // Sigma로부터 그래프를 가져옴

  useEffect(() => {
    if (!graph || !dataset) {
      // 그래프나 데이터셋이 없으면 오류 출력
      console.error("Graph or dataset not available");
      return;
    } else {
      console.log("Dataset is for Animations");
    }

    try {
      graph.clear(); // 그래프 초기화
      // const rating = keyBy(dataset.ratings, "key"); // 데이터셋의 레이팅을 키별로 매핑

      dataset.nodes.forEach((node: any) => {
        // 각 노드를 그래프에 추가
        const nodeSize = Math.min(
          Math.max(node.degree_centrality * 100, 10),
          30
        );
        graph.addNode(node.id, {
          id: node.id,
          key: node.id,
          label: node.label,
          x: node.x * 10,
          y: node.y * 10,
          degree: node.degree,
          degree_centrality: node.degree_centrality,
          betweenness_centrality: node.betweenness_centrality,
          closeness_centrality: node.closeness_centrality,
          eigenvector_centrality: node.eigenvector_centrality,
          core_periphery: node.core_periphery,
          attributes: node.attributes, // attributes는 임의의 형태로 올 수 있음
          size: nodeSize,
          color: node.core_periphery === 0 ? "#FFFFFF" : "#87CEEB", // core_periphery 값에 따라 color 설정
          borderColor: "FFFFFF",
          pictoColor: "FFFFFF",
        });
      });

      console.log("Done node");

      dataset.edges.forEach((edge: any) => {
        graph.addEdge(edge.source, edge.target, {
          size: edge.weight,
          color: "#CED4DA",
        });
      });
      console.log("Done Edge");

      console.log("Graph data loaded successfully"); // 그래프 데이터 로드 성공 메시지 출력
    } catch (error) {
      console.error("Error loading graph data:", error); // 그래프 데이터 로드 오류 메시지 출력
    }

    return () => graph.clear(); // 컴포넌트가 언마운트될 때 그래프 초기화
  }, [graph, dataset, sigma]); // 의존성 배열에 graph와 dataset 포함

  // useEffect(() => {
  //   const filterNodes = () => {
  //     const typeFilter = filters as FiltersState;
  //     const { tags, years, types, ratings, scores, favorites } = typeFilter; // ranks
  //     console.log("######## 애니메이션 #######");
  //     console.log("태그(장르) 필터: ", tags);
  //     console.log("점수 필터: ", scores);
  //     console.log("타입 필터: ", types);
  //     console.log("등급 필터: ", ratings);
  //     // console.log("순위 필터: ", ranks)
  //     console.log("좋아요 필터: ", favorites);
  //     console.log("연도 필터: ", years);

  //     graph.forEachNode((node, attributes) => {
  //       // 로그
  //       //console.log("타입", attributes)

  //       // [필터 작업]
  //       //// 1. 점수
  //       const scoreCount = attributes.score;
  //       const isScoreInRange =
  //         scoreCount >= scores.min && scoreCount <= scores.max;
  //       //// 2. 장르
  //       const isTagVisible = Object.keys(tags).some(
  //         (tag) => tags[tag] && attributes[tag] === 1
  //       );
  //       //// 3. 연도
  //       const yearCount = attributes.year;
  //       const isYearInRange = yearCount >= years.min && yearCount <= years.max;
  //       /*
  //           //// 3. 순위
  //         const rankCount = attributes.rank;
  //           const isRankInRange =
  //           rankCount >= ranks.min && rankCount <= ranks.max
  //           //// 4. 좋아요
  //         const favoriteCount = attributes.favorites;
  //         const isFavInRange =
  //           favoriteCount >= favorites.min && favoriteCount <= favorites.max
  //         */

  //       // [그래프 필터링 적용]
  //       graph.setNodeAttribute(
  //         node,
  //         "hidden",
  //         // !years[attributes.year] || // 연도
  //         !ratings[attributes.rating] || // 등급
  //           !types[attributes.m_type] || // 타입
  //           !isTagVisible || // 장르
  //           !isScoreInRange || // 점수
  //           !isYearInRange

  //         // !isRankInRange || // 순위
  //         // !isFavInRange // 좋아요
  //       );

  //       // [EventController에서 다루기 위해 별도 Hidden 정의]
  //       graph.setNodeAttribute(
  //         node,
  //         "filter_hidden",
  //         // !years[attributes.year] || // 연도
  //         !ratings[attributes.rating] || // 등급
  //           !types[attributes.m_type] || // 타입
  //           !isTagVisible || // 장르
  //           !isScoreInRange || // 점수
  //           !isYearInRange
  //         // !isRankInRange || // 순위
  //         // !isFavInRange // 좋아요
  //       );
  //     });
  //   };
  //   filterNodes();
  // }, [graph, dataset]); // 필터 상태가 변경될 때마다 노드 숨김 설정

  return <>{children}</>; // 자식 요소를 렌더링
};

export default GraphDataController; // GraphDataController 컴포넌트를 기본 내보내기로 설정

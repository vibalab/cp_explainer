import { useSigma } from "@react-sigma/core"; // Sigma 인스턴스를 가져옴
import { Attributes } from "graphology-types"; // graphology 타입 정의를 가져옴
import {
  ChangeEvent,
  FC,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react"; // React 훅과 타입을 가져옴
import { BsSearch } from "react-icons/bs"; // 검색 아이콘을 가져옴

/**
 * 이 컴포넌트는 @react-sigma/core의 SearchControl 컴포넌트에서 몇 가지 수정 사항을 반영한 포크입니다:
 * 1. 숨겨진 노드를 결과에서 제외해야 합니다.
 * 2. 커스텀 마크업이 필요합니다.
 */
const SearchField: FC = ({}) => {
  // SearchField 컴포넌트 정의
  const sigma = useSigma(); // Sigma 인스턴스를 가져옴

  const [search, setSearch] = useState<string>(""); // 검색어 상태
  const [values, setValues] = useState<Array<{ id: string; label: string }>>(
    []
  ); // 검색 결과 상태
  const [selected, setSelected] = useState<string | null>(null); // 선택된 노드 상태

  const refreshValues = useCallback(
    (includeAll = false) => {
      // 검색 결과를 갱신하는 함수
      const newValues: Array<{ id: string; label: string }> = [];
      const lcSearch = search.toLowerCase(); // 검색어를 소문자로 변환
      if (!selected && (search.length > 1 || includeAll)) {
        // 선택된 노드가 없고 검색어 길이가 1 이상이거나 모든 노드를 포함할 때
        sigma
          .getGraph()
          .forEachNode((key: string, attributes: Attributes): void => {
            // 각 노드를 순회
            if (
              !attributes.hidden && // 숨겨지지 않은 노드
              !attributes.filter_hidden && // filter_hidden이 false인 노드
              attributes.label && // 라벨이 있는 노드
              (includeAll ||
                attributes.label.toLowerCase().indexOf(lcSearch) === 0) // 라벨이 검색어로 시작하는 노드 또는 모든 노드
            )
              newValues.push({ id: key, label: attributes.label }); // 결과에 추가
          });
      }
      setValues(newValues); // 결과 상태 업데이트
    },
    [search, selected, sigma]
  );

  // 검색어가 업데이트될 때 검색 결과 갱신
  useEffect(() => refreshValues(), [search, refreshValues]);

  // 필터가 업데이트될 때 검색 결과 갱신 (한 프레임 대기)
  useEffect(() => {
    requestAnimationFrame(() => refreshValues());
  }, [refreshValues]);

  useEffect(() => {
    if (!selected) return; // 선택된 노드가 없으면 리턴

    const nodeDisplayData = sigma.getNodeDisplayData(selected); // 선택된 노드의 디스플레이 데이터 가져옴

    if (nodeDisplayData)
      sigma.getCamera().animate(
        { ...nodeDisplayData, ratio: 0.25 }, // 노드로 카메라 애니메이션 이동
        {
          duration: 600, // 애니메이션 지속 시간 설정
        }
      );

    setSearch(""); // 검색 필드를 비움

    return () => {};
  }, [selected, sigma]); // 의존성 배열에 selected 포함

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    // 입력 변경 핸들러
    const searchString = e.target.value;
    const valueItem = values.find((value) => value.label === searchString);
    if (valueItem) {
      // 검색어가 결과 중 하나와 일치할 때
      setSearch(valueItem.label); // 검색어 상태 업데이트
      setValues([]); // 결과 상태 초기화
      setSelected(valueItem.id); // 선택된 노드 상태 업데이트
    } else {
      setSelected(null); // 선택된 노드 초기화
      setSearch(searchString); // 검색어 상태 업데이트
    }
  };

  const onKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    // 키 입력 핸들러
    if (e.key === "Enter" && values.length) {
      // Enter 키를 누르고 결과가 있을 때
      setSearch(values[0].label); // 첫 번째 결과를 검색어로 설정
      setSelected(values[0].id); // 첫 번째 결과를 선택된 노드로 설정
    }
  };

  const onFocus = () => {
    refreshValues(true); // 검색 필드에 포커스가 있을 때 모든 노드를 포함하여 검색 결과 갱신
  };

  return (
    <div className="search-wrapper">
      <input
        type="search"
        placeholder="Search by Title or Name... " // 검색창 플레이스홀더
        list="nodes" // datalist와 연결
        value={search} // 검색어 상태를 값으로 설정
        onChange={onInputChange} // 입력 변경 핸들러 설정
        onKeyPress={onKeyPress} // 키 입력 핸들러 설정
        onFocus={onFocus} // 포커스 핸들러 설정
      />
      <BsSearch className="icon" /> {/* 검색 아이콘 */}
      <datalist id="nodes">
        {values.map(
          (
            value: { id: string; label: string } // 검색 결과를 datalist로 렌더링
          ) => (
            <option key={value.id} value={value.label}>
              {value.label}
            </option>
          )
        )}
      </datalist>
    </div>
  );
};

export default SearchField; // SearchField 컴포넌트를 기본 내보내기로 설정

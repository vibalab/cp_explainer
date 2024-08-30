import {
  FC, // FC (Functional Component) 타입을 가져옴
  PropsWithChildren, // PropsWithChildren 타입을 가져옴, 자식 요소를 포함한 props 타입
  ReactNode, // ReactNode 타입을 가져옴, React 요소나 문자열, 숫자 등을 포함할 수 있음
  useEffect, // useEffect 훅을 가져옴, 사이드 이펙트를 다루기 위해 사용
  useRef, // useRef 훅을 가져옴, DOM 요소나 변수를 참조하기 위해 사용
  useState, // useState 훅을 가져옴, 컴포넌트 상태를 관리하기 위해 사용
} from "react";
import AnimateHeight from "react-animate-height"; // 애니메이션으로 높이를 조절하기 위해 react-animate-height 모듈을 가져옴
import { MdExpandLess, MdExpandMore } from "react-icons/md"; // 아이콘을 사용하기 위해 react-icons/md 모듈에서 아이콘을 가져옴

const DURATION = 300; // 애니메이션 지속 시간을 300ms로 설정

const Panel: FC<
  PropsWithChildren<{ title: ReactNode | string; initiallyDeployed?: boolean }> // title과 initiallyDeployed props를 받는 Panel 컴포넌트 정의, 자식 요소를 포함
> = ({ title, initiallyDeployed, children }) => {
  // Panel 컴포넌트 구현 시작
  const [isDeployed, setIsDeployed] = useState(initiallyDeployed || false); // isDeployed 상태와 이를 변경할 setIsDeployed 함수 선언, 기본값은 initiallyDeployed 또는 false
  const dom = useRef<HTMLDivElement>(null); // dom 참조 변수 선언, 초기값은 null

  useEffect(() => {
    // useEffect 훅 사용, isDeployed 상태가 변경될 때 실행
    if (isDeployed)
      // isDeployed가 true일 때
      setTimeout(() => {
        // DURATION(ms) 후에 다음 함수를 실행
        if (dom.current)
          // dom.current가 존재하면
          dom.current.parentElement?.scrollTo({
            // 부모 요소를 스크롤
            top: dom.current.offsetTop - 5, // 현재 요소의 상단 위치에서 5px 위로 스크롤
            behavior: "smooth", // 스크롤 애니메이션을 부드럽게 함
          });
      }, DURATION); // DURATION(ms) 동안 대기
  }, [isDeployed]); // 의존성 배열에 isDeployed 포함

  return (
    // Panel 컴포넌트 JSX 반환
    <div className="panel" ref={dom}>
      {" "}
      {/* panel 클래스를 가진 div 요소, dom에 참조를 설정 */}
      <h2>
        {title} {/* 제목을 표시 */}
        <button type="button" onClick={() => setIsDeployed((v) => !v)}>
          {" "}
          {/* 버튼 클릭 시 isDeployed 상태를 토글 */}
          {isDeployed ? <MdExpandLess /> : <MdExpandMore />}{" "}
          {/* isDeployed 상태에 따라 아이콘 변경 */}
        </button>
      </h2>
      <AnimateHeight duration={DURATION} height={isDeployed ? "auto" : 0}>
        {" "}
        {/* 애니메이션으로 높이 조절 */}
        {children} {/* 자식 요소를 표시 */}
      </AnimateHeight>
    </div>
  );
};

export default Panel; // Panel 컴포넌트를 기본 내보내기로 설정

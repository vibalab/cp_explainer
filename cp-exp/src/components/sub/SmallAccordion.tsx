import React from "react";
import Accordion, { AccordionProps } from "./Accordion";

const SmallAccordion: React.FC<AccordionProps> = ({
  fontSize = "12px", // 기본 제목 크기를 작게 설정
  ...props
}) => {
  return <Accordion fontSize={fontSize} {...props} />;
};

export default SmallAccordion;

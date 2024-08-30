// src/components/Tooltip.tsx
import React from "react";
import styled from "styled-components";

interface TooltipProps {
  text: string;
  x: number;
  y: number;
}

const Tooltip: React.FC<TooltipProps> = ({ text, x, y }) => {
  return <StyledTooltip style={{ left: x, top: y }}>{text}</StyledTooltip>;
};

const StyledTooltip = styled.div`
  position: absolute;
  background-color: black;
  color: white;
  padding: 5px;
  border-radius: 3px;
  pointer-events: none;
  transform: translate(-50%, -150%);
  white-space: nowrap;
`;

export default Tooltip;

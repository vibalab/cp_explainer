import React from "react";
import styled from "styled-components";

interface OverviewItemProps {
  label: string;
  value: string;
  onCopy: (text: string, event: React.MouseEvent<HTMLDivElement>) => void;
}

const OverviewItem: React.FC<OverviewItemProps> = ({
  label,
  value,
  onCopy,
}) => {
  return (
    <Item onClick={(e) => onCopy(value, e)}>
      <Label>{label}</Label>: {value}
    </Item>
  );
};

const Item = styled.div`
  flex: 1 1 50%;
  cursor: pointer;
  padding: 5px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const Label = styled.span`
  font-weight: 500;
`;

export default OverviewItem;

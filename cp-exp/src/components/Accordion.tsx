import React, { useState, useRef, useEffect } from "react";

type AccordionProps = {
  title: string;
  children: React.ReactNode;
  fontSize?: string;
  isOpen?: boolean;
};

const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  fontSize = "16px",
  isOpen = true,
}) => {
  const [isOpenState, setIsOpenState] = useState(isOpen);
  const [height, setHeight] = useState("0px");
  const [isTransitioning, setIsTransitioning] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const startHeight = useRef<number | null>(null);

  const toggleAccordion = () => {
    setIsOpenState(!isOpenState);
    setIsTransitioning(true);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY;
    startHeight.current = contentRef.current?.offsetHeight || 0;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    setIsTransitioning(false); // Disable transition during drag
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (startY.current !== null && startHeight.current !== null) {
      const newHeight = startHeight.current + (e.clientY - startY.current);
      setHeight(`${newHeight}px`);
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = isOpenState
        ? `${contentRef.current.scrollHeight}px`
        : "0px";
      setHeight(contentHeight);
    }
  }, [isOpenState]);

  useEffect(() => {
    setIsOpenState(isOpen);
  }, [isOpen]);

  return (
    <div className="accordion" style={{ userSelect: "none" }}>
      <div className="accordion-header" onClick={toggleAccordion}>
        <h3 style={{ fontSize }}>{title}</h3>
        <span>
          {isOpenState ? (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 15L5 8H19L12 15Z" fill="currentColor" />
            </svg>
          ) : (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 9L5 16H19L12 9Z" fill="currentColor" />
            </svg>
          )}
        </span>
      </div>
      <div
        ref={contentRef}
        className={`accordion-content ${isTransitioning ? "transition" : ""}`}
        style={{
          height,
          flexDirection: "column",
          overflowY: "auto",
          justifyContent: "center",
          alignItems: "center",
          margin: "0 auto",
        }}
      >
        {children}
      </div>
      {/* Draggable resize handle */}
      <div
        style={{
          height: "5px",
          background: "#ccc",
          cursor: "row-resize",
          marginTop: "5px",
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
};

export default Accordion;

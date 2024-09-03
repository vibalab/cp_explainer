import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";

export type AccordionProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  fontSize?: string;
  isOpen?: boolean; // Prop to set the initial open state
  autoResize?: boolean; // Prop to enable or disable automatic resizing
};

export type AccordionHandle = {
  updateHeight: () => void;
};

const Accordion = forwardRef<AccordionHandle, AccordionProps>(
  (
    { title, children, fontSize = "16px", isOpen = false, autoResize = true },
    ref
  ) => {
    const [isOpenState, setIsOpenState] = useState(isOpen); // Initialize with the provided isOpen prop
    const [height, setHeight] = useState("0px");
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [internalAutoResize, setInternalAutoResize] = useState(autoResize);
    const contentRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number | null>(null);
    const startHeight = useRef<number | null>(null);

    const toggleAccordion = () => {
      setIsOpenState(!isOpenState);
      setIsTransitioning(true);

      // Force close by setting height to 0px immediately when collapsing
      if (isOpenState) {
        setHeight("0px");
      }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      startY.current = e.clientY;
      startHeight.current = contentRef.current?.offsetHeight || 0;

      // Disable autoResize when user starts dragging
      setInternalAutoResize(false);

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

    const updateHeight = () => {
      if (contentRef.current) {
        const contentHeight = isOpenState
          ? `${contentRef.current.scrollHeight}px`
          : "0px";
        setHeight(contentHeight);
      }
    };

    useImperativeHandle(ref, () => ({
      updateHeight,
    }));

    useEffect(() => {
      // Prioritize collapsing by setting height to 0px when closing
      if (isOpenState) {
        updateHeight(); // Adjust height when open state changes
      } else {
        setHeight("0px");
      }
    }, [isOpenState]);

    useEffect(() => {
      if (internalAutoResize) {
        const resizeObserver = new ResizeObserver(() => {
          if (contentRef.current && isOpenState) {
            setHeight(`${contentRef.current.scrollHeight}px`);
          }
        });

        if (contentRef.current) {
          resizeObserver.observe(contentRef.current);
        }

        return () => {
          if (contentRef.current) {
            resizeObserver.unobserve(contentRef.current);
          }
        };
      }
    }, [children, isOpenState, internalAutoResize]);

    useEffect(() => {
      setIsOpenState(isOpen);
    }, [isOpen]);

    useEffect(() => {
      setInternalAutoResize(autoResize);
    }, [autoResize]);

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
            transition: isTransitioning ? "height 0.3s ease" : "none",
          }}
        >
          {children}
        </div>
        {/* Draggable resize handle */}
        <div
          style={{
            height: "2px",
            background: "#ccc",
            cursor: "row-resize",
            marginTop: "5px",
          }}
          onMouseDown={handleMouseDown}
        />
      </div>
    );
  }
);

export default Accordion;

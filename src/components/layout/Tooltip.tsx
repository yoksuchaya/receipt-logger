import React, { ReactNode, useState, useRef } from "react";

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [visible, setVisible] = useState(false);
  const timeout = useRef<NodeJS.Timeout | null>(null);

  const show = () => {
    timeout.current = setTimeout(() => setVisible(true), 200);
  };
  const hide = () => {
    if (timeout.current) clearTimeout(timeout.current);
    setVisible(false);
  };

  return (
    <span className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={-1}
    >
      {children}
      {visible && (
        <span
          className="absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-black"
          style={{whiteSpace: 'nowrap'}}
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;

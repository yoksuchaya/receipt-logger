import React from "react";

interface MenuOverlayProps {
  show: boolean;
  onClick: () => void;
}

const MenuOverlay: React.FC<MenuOverlayProps> = ({ show, onClick }) => (
  show ? (
    <div
      className="fixed inset-0 bg-black/30 z-10 sm:hidden"
      onClick={onClick}
      aria-hidden="true"
    />
  ) : null
);

export default MenuOverlay;

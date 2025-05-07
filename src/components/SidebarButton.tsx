import React from 'react';
import './SidebarButton.css';

interface SidebarButtonProps {
  text: string;
  onClick: () => void;
  active?: boolean;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({ text, onClick, active = false}) => {
  return (
    <button className={active ? 'sidebarBtn active' : 'sidebarBtn'} onClick={onClick} >
      {text}
    </button>
  );
};

export default SidebarButton;

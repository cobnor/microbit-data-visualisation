import React, { ReactNode } from 'react';
import './Sidebar.css'; // Optional separate CSS

interface SidebarProps {
  children: ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  return (
    <div className="sidebar">
        {children}
    </div>
  );
};

export default Sidebar;

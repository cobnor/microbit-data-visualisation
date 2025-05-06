import React from 'react';
import './GraphOptionButton.css';  // Import the CSS file

// Define the type for props
interface GraphOptionButtonProps {
  text: string;
  onClick: () => void;
}

const GraphOptionButton: React.FC<GraphOptionButtonProps> = ({ text, onClick }) => {
  return (
    <button className="graphOptionBtn" onClick={onClick}>
      {text}
    </button>
  );
};

export default GraphOptionButton;
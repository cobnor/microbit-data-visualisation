import React from 'react';
import './GraphOptionButton.css';

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

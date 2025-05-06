import React, { ReactNode } from 'react';
import './Card.css'; // Optional separate CSS

interface CardProps {
  children: ReactNode;
  transparent?: boolean; // optional, defaults to false
}

const Card: React.FC<CardProps> = ({ children, transparent = false}) => {
  return (
    <div className={`card ${transparent ? 'card-transparent' : ''}`}>
        {children}
    </div>
  );
};

export default Card;

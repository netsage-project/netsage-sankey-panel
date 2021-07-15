import { useState, useEffect } from 'react';

const MousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ mouseX: 0, mouseY: 0 });

  const updateMousePosition = (e: any) => {
    setMousePosition({ mouseX: e.clientX, mouseY: e.clientY });
  };

  useEffect(() => {
    window.addEventListener('mousemove', updateMousePosition);

    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return mousePosition;
};

export default MousePosition;

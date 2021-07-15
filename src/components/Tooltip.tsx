import React from 'react';
// import * as d3 from 'd3';

interface TooltipProps {
  data: any;
  displayValues: any;
}

export const Tooltip: React.FC<TooltipProps> = ({ data, displayValues }) => {
  const label = displayValues[data.colId];
  return (
    <div>
      {label}: {data.value}
    </div>
  );
};

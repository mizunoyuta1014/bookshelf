import React from 'react';
import './YearSelector.css';

const YearSelector = ({ selectedYear, onYearChange, availableYears = [] }) => {
  const currentYear = new Date().getFullYear();
  
  // デフォルトで過去5年と現在年、未来2年を表示
  const defaultYears = [];
  for (let year = currentYear - 5; year <= currentYear + 2; year++) {
    defaultYears.push(year);
  }
  
  // 利用可能な年度とデフォルト年度をマージ
  const years = [...new Set([...availableYears, ...defaultYears])].sort((a, b) => b - a);

  return (
    <div className="year-selector">
      <label htmlFor="year-select" className="year-label">
        年度選択:
      </label>
      <select
        id="year-select"
        className="year-select"
        value={selectedYear}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
      >
        {years.map(year => (
          <option key={year} value={year}>
            {year}年
          </option>
        ))}
      </select>
    </div>
  );
};

export default YearSelector;
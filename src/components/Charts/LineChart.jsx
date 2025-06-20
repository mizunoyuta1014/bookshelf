import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MonthlyProgressChart = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="chart-container">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  const chartData = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, stats]) => ({
      month,
      total: stats.total,
      read: stats.read,
      owned: stats.owned
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}冊`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <h3 className="chart-title">月別読書推移</h3>
      <ResponsiveContainer width="100%" height="100%" aspect={1.5} minHeight={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="#8884d8" 
            name="登録数"
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="read" 
            stroke="#82ca9d" 
            name="読了数"
            strokeWidth={2}
          />
          <Line 
            type="monotone" 
            dataKey="owned" 
            stroke="#ffc658" 
            name="所有数"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyProgressChart;
import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ComparisonChart = ({ data, title = "年度比較", type = "bar" }) => {
  if (!data || !data.currentYear || !data.comparisonYear) {
    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <p>比較データがありません</p>
      </div>
    );
  }

  const generateBarData = () => {
    return {
      labels: ['追加した本', '読了した本'],
      datasets: [
        {
          label: `${data.currentYear.year}年`,
          data: [data.currentYear.total, data.currentYear.read],
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
        },
        {
          label: `${data.comparisonYear.year}年`,
          data: [data.comparisonYear.total, data.comparisonYear.read],
          backgroundColor: 'rgba(156, 163, 175, 0.8)',
          borderColor: 'rgb(156, 163, 175)',
          borderWidth: 1,
        }
      ],
    };
  };

  const generateCategoryComparisonData = () => {
    const currentCategories = data.currentYear.categories || {};
    const comparisonCategories = data.comparisonYear.categories || {};
    
    const allCategories = new Set([
      ...Object.keys(currentCategories),
      ...Object.keys(comparisonCategories)
    ]);

    const labels = Array.from(allCategories);
    const currentData = labels.map(cat => currentCategories[cat] || 0);
    const comparisonData = labels.map(cat => comparisonCategories[cat] || 0);

    return {
      labels,
      datasets: [
        {
          label: `${data.currentYear.year}年`,
          data: currentData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1,
        },
        {
          label: `${data.comparisonYear.year}年`,
          data: comparisonData,
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgb(245, 158, 11)',
          borderWidth: 1,
        }
      ],
    };
  };

  const generateProgressData = () => {
    const currentComplete = data.currentYear.read;
    const currentTotal = data.currentYear.total;
    const currentRemaining = currentTotal - currentComplete;

    return {
      labels: ['読了', '未読'],
      datasets: [
        {
          data: [currentComplete, currentRemaining],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(229, 231, 235, 0.8)',
          ],
          borderColor: [
            'rgb(16, 185, 129)',
            'rgb(229, 231, 235)',
          ],
          borderWidth: 2,
        }
      ],
    };
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context) {
            if (context.datasetIndex === 0) {
              const difference = data.differences;
              if (context.dataIndex === 0) {
                const change = difference.totalPercentage;
                return `変化: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
              } else {
                const change = difference.readPercentage;
                return `変化: ${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
              }
            }
            return '';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: '冊数'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: `${data.currentYear.year}年 読書進捗`,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed}冊 (${percentage}%)`;
          }
        }
      }
    }
  };

  const renderChart = () => {
    if (type === "bar") {
      return <Bar data={generateBarData()} options={barOptions} />;
    } else if (type === "category") {
      return <Bar data={generateCategoryComparisonData()} options={{
        ...barOptions,
        plugins: {
          ...barOptions.plugins,
          title: {
            display: true,
            text: 'カテゴリ別比較'
          }
        }
      }} />;
    } else if (type === "progress") {
      return <Doughnut data={generateProgressData()} options={doughnutOptions} />;
    }
    return null;
  };

  const renderSummary = () => {
    const diff = data.differences;
    return (
      <div className="comparison-summary">
        <div className="summary-item">
          <span className="label">総冊数の変化:</span>
          <span className={`value ${diff.total >= 0 ? 'positive' : 'negative'}`}>
            {diff.total >= 0 ? '+' : ''}{diff.total}冊 
            ({diff.totalPercentage >= 0 ? '+' : ''}{diff.totalPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="summary-item">
          <span className="label">読了数の変化:</span>
          <span className={`value ${diff.read >= 0 ? 'positive' : 'negative'}`}>
            {diff.read >= 0 ? '+' : ''}{diff.read}冊 
            ({diff.readPercentage >= 0 ? '+' : ''}{diff.readPercentage.toFixed(1)}%)
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="chart-container">
      {renderChart()}
      {type === "bar" && renderSummary()}
    </div>
  );
};

export default ComparisonChart;
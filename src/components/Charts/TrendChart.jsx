import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TrendChart = ({ data, title = "読書トレンド", type = "monthly" }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="chart-container">
        <h3>{title}</h3>
        <p>データがありません</p>
      </div>
    );
  }

  const generateChartData = () => {
    if (type === "monthly") {
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', 
                     '7月', '8月', '9月', '10月', '11月', '12月'];
      const addedData = months.map((_, index) => data[index + 1]?.added || 0);
      const readData = months.map((_, index) => data[index + 1]?.read || 0);

      return {
        labels: months,
        datasets: [
          {
            label: '追加した本',
            data: addedData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
          },
          {
            label: '読了した本',
            data: readData,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
          }
        ],
      };
    }

    if (type === "weekly") {
      const labels = data.map(item => item.day);
      const counts = data.map(item => item.count);

      return {
        labels,
        datasets: [
          {
            label: '追加した本数',
            data: counts,
            borderColor: 'rgb(147, 51, 234)',
            backgroundColor: 'rgba(147, 51, 234, 0.1)',
            tension: 0.4,
          }
        ],
      };
    }

    if (type === "pace") {
      const currentDate = new Date();
      const months = [];
      const projectedData = [];
      
      for (let i = 0; i < 12; i++) {
        const month = new Date(currentDate.getFullYear(), i);
        months.push(month.toLocaleDateString('ja-JP', { month: 'short' }));
        
        if (i < currentDate.getMonth() + 1) {
          projectedData.push(data.currentRead / (currentDate.getMonth() + 1) * (i + 1));
        } else {
          projectedData.push(data.projectedTotal / 12 * (i + 1));
        }
      }

      return {
        labels: months,
        datasets: [
          {
            label: '予測読書数',
            data: projectedData,
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderDash: [5, 5],
            tension: 0.4,
          },
          {
            label: '目標',
            data: Array(12).fill(data.targetBooks),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderDash: [10, 5],
            tension: 0,
          }
        ],
      };
    }

    return { labels: [], datasets: [] };
  };

  const options = {
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
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            if (type === "weekly") {
              return `${context.dataset.label}: ${context.parsed.y}冊 (${data[context.dataIndex]?.percentage?.toFixed(1)}%)`;
            }
            return `${context.dataset.label}: ${context.parsed.y}冊`;
          }
        }
      },
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: type === "monthly" ? "月" : type === "weekly" ? "曜日" : "月"
        }
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "冊数"
        },
        beginAtZero: true
      }
    }
  };

  return (
    <div className="chart-container">
      <Line data={generateChartData()} options={options} />
    </div>
  );
};

export default TrendChart;
import React, { useState, useMemo } from 'react';
import { analyzeReadingPatterns } from '../utils/mlPatternAnalysis';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  IoTrendingUp, 
  IoTrendingDown, 
  IoRemoveOutline, 
  IoAnalyticsOutline,
  IoTimeOutline,
  IoLibraryOutline,
  IoBarChartOutline,
  IoSyncOutline,
  IoCalendarOutline,
  IoWarningOutline,
  IoBulbOutline
} from 'react-icons/io5';
import './Charts/Charts.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PatternAnalysisView = ({ books }) => {
  const [selectedTab, setSelectedTab] = useState('patterns');
  
  const analysis = useMemo(() => {
    return analyzeReadingPatterns(books);
  }, [books]);

  const getPatternIcon = (type) => {
    switch (type) {
      case 'time_based': return <IoTimeOutline />;
      case 'category_based': return <IoLibraryOutline />;
      case 'volume_based': return <IoBarChartOutline />;
      case 'consistency': return <IoSyncOutline />;
      default: return <IoAnalyticsOutline />;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return '#16a085';
    if (confidence >= 0.6) return '#f39c12';
    return '#e74c3c';
  };

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'increasing': return <IoTrendingUp style={{ color: '#16a085' }} />;
      case 'decreasing': return <IoTrendingDown style={{ color: '#e74c3c' }} />;
      case 'stable': return <IoRemoveOutline style={{ color: '#95a5a6' }} />;
      default: return <IoAnalyticsOutline />;
    }
  };

  const renderPatterns = () => {
    if (!analysis.patterns || analysis.patterns.length === 0) {
      return (
        <div className="trend-analysis-container">
          <p className="no-data-message">パターン分析にはより多くのデータが必要です</p>
        </div>
      );
    }

    return (
      <div className="trend-analysis-container">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IoAnalyticsOutline />
          読書パターン分析
        </h3>
        {analysis.patterns.map((pattern, index) => (
          <div key={index} className="trend-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                {getPatternIcon(pattern.type)}
                <h4 style={{ margin: 0, color: '#2c3e50' }}>{pattern.description}</h4>
              </div>
              <div style={{ 
                padding: '4px 8px', 
                borderRadius: '12px', 
                backgroundColor: getConfidenceColor(pattern.confidence),
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                信頼度: {Math.round(pattern.confidence * 100)}%
              </div>
            </div>
            {pattern.data && (
              <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginLeft: '24px' }}>
                {pattern.type === 'time_based' && (
                  <div>
                    <p>ピーク時間: {pattern.data.peakHour}時</p>
                    <p>よく読む曜日: {pattern.data.peakDay}</p>
                  </div>
                )}
                {pattern.type === 'category_based' && (
                  <div>
                    <p>主要カテゴリ: {pattern.data.primaryCategory} ({Math.round(pattern.data.primaryRatio * 100)}%)</p>
                    <p>ジャンル数: {pattern.data.diversityIndex}</p>
                  </div>
                )}
                {pattern.type === 'volume_based' && (
                  <div>
                    <p>月平均読書数: {pattern.data.averageMonthlyVolume}冊</p>
                    <p>変動係数: {Math.round(pattern.data.variability * 100)}%</p>
                  </div>
                )}
                {pattern.type === 'consistency' && (
                  <div>
                    <p>平均読書間隔: {pattern.data.averageGapDays}日</p>
                    <p>継続性スコア: {Math.round(pattern.data.consistencyScore * 100)}%</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSeasonality = () => {
    if (!analysis.seasonality) {
      return (
        <div className="trend-analysis-container">
          <h3>季節性分析</h3>
          <p className="no-data-message">季節性分析にはより多くのデータが必要です</p>
        </div>
      );
    }

    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                       '7月', '8月', '9月', '10月', '11月', '12月'];

    const chartData = {
      labels: monthNames,
      datasets: [
        {
          label: '読書数',
          data: analysis.seasonality.monthlyData,
          backgroundColor: 'rgba(52, 152, 219, 0.8)',
          borderColor: 'rgb(52, 152, 219)',
          borderWidth: 1,
        }
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: '月別読書数分布',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '読書数'
          }
        }
      }
    };

    return (
      <div>
        <div className="trend-analysis-container">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IoCalendarOutline />
            季節性分析
          </h3>
          <div style={{ marginBottom: '20px' }}>
            <p><strong>季節性の強さ:</strong> {analysis.seasonality.strength}</p>
            <p><strong>説明:</strong> {analysis.seasonality.description}</p>
            {analysis.seasonality.peakMonths.length > 0 && (
              <p><strong>ピーク月:</strong> {analysis.seasonality.peakMonths.map(m => monthNames[m-1]).join(', ')}</p>
            )}
            {analysis.seasonality.lowMonths.length > 0 && (
              <p><strong>読書数が少ない月:</strong> {analysis.seasonality.lowMonths.map(m => monthNames[m-1]).join(', ')}</p>
            )}
          </div>
        </div>
        <div className="chart-container">
          <Bar data={chartData} options={options} />
        </div>
      </div>
    );
  };

  const renderAnomalies = () => {
    if (!analysis.anomalies || analysis.anomalies.length === 0) {
      return (
        <div className="trend-analysis-container">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IoWarningOutline />
            異常検知
          </h3>
          <p className="no-data-message">特別な異常は検出されませんでした</p>
        </div>
      );
    }

    return (
      <div className="trend-analysis-container">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IoWarningOutline />
          異常検知
        </h3>
        {analysis.anomalies.map((anomaly, index) => (
          <div key={index} className="trend-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: anomaly.type === 'spike' ? '#16a085' : '#e74c3c'
              }} />
              <div className="trend-category">{anomaly.description}</div>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
              Z-Score: {anomaly.zScore}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTrends = () => {
    if (!analysis.trends) {
      return (
        <div className="trend-analysis-container">
          <h3>トレンド分析</h3>
          <p className="no-data-message">トレンド分析にはより多くのデータが必要です</p>
        </div>
      );
    }

    const chartData = {
      labels: Array.from({length: analysis.trends.recentData.length}, (_, i) => `${i + 1}ヶ月前`).reverse(),
      datasets: [
        {
          label: '読書数',
          data: analysis.trends.recentData,
          borderColor: 'rgb(231, 76, 60)',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          tension: 0.4,
        }
      ],
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: '最近6ヶ月の読書トレンド',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '読書数'
          }
        }
      }
    };

    return (
      <div>
        <div className="trend-analysis-container">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getTrendIcon(analysis.trends.direction)}
            トレンド分析
          </h3>
          <div style={{ marginBottom: '20px' }}>
            <p><strong>トレンド:</strong> {analysis.trends.description}</p>
            <p><strong>方向:</strong> {analysis.trends.direction}</p>
            <p><strong>強度:</strong> {analysis.trends.strength.toFixed(2)}</p>
            <p><strong>決定係数:</strong> {analysis.trends.r_squared}</p>
          </div>
        </div>
        <div className="chart-container">
          <Line data={chartData} options={options} />
        </div>
      </div>
    );
  };

  const renderPredictions = () => {
    if (!analysis.predictions) {
      return (
        <div className="trend-analysis-container">
          <h3>読書予測</h3>
          <p className="no-data-message">予測にはより多くのデータが必要です</p>
        </div>
      );
    }

    return (
      <div className="trend-analysis-container">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IoBulbOutline />
          読書予測
        </h3>
        
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#3498db' }}>
              {analysis.predictions.yearEndPrediction}
            </div>
            <div className="stat-label">年末予測読書数</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a085' }}>
              {Math.round(analysis.predictions.confidence * 100)}%
            </div>
            <div className="stat-label">予測信頼度</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#e74c3c' }}>
              {analysis.predictions.monthlyPace}
            </div>
            <div className="stat-label">月平均ペース</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#f39c12' }}>
              {analysis.predictions.remainingMonths}
            </div>
            <div className="stat-label">残り月数</div>
          </div>
        </div>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>
            {analysis.predictions.description}
          </p>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'patterns', label: 'パターン', icon: <IoAnalyticsOutline /> },
    { id: 'seasonality', label: '季節性', icon: <IoCalendarOutline /> },
    { id: 'trends', label: 'トレンド', icon: <IoTrendingUp /> },
    { id: 'anomalies', label: '異常検知', icon: <IoWarningOutline /> },
    { id: 'predictions', label: '予測', icon: <IoBulbOutline /> }
  ];

  return (
    <div className="chart-container">
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e9ecef', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              style={{
                padding: '12px 16px',
                border: 'none',
                background: selectedTab === tab.id ? '#f8f9fa' : 'transparent',
                borderBottom: selectedTab === tab.id ? '2px solid #3498db' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: selectedTab === tab.id ? '#3498db' : '#7f8c8d',
                fontWeight: selectedTab === tab.id ? '600' : '400',
                fontSize: '0.9rem'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {selectedTab === 'patterns' && renderPatterns()}
      {selectedTab === 'seasonality' && renderSeasonality()}
      {selectedTab === 'trends' && renderTrends()}
      {selectedTab === 'anomalies' && renderAnomalies()}
      {selectedTab === 'predictions' && renderPredictions()}
    </div>
  );
};

export default PatternAnalysisView;
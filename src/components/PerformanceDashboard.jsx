import React, { useState } from 'react';
import { calculatePerformanceMetrics, calculateReadingGoalProgress } from '../utils/performanceMetrics';
import { IoTrendingUp, IoTrendingDown, IoCheckmarkCircle, IoAlertCircle, IoInformationCircle } from 'react-icons/io5';
import { FaMedal, FaChartLine, FaCalendarAlt, FaBullseye } from 'react-icons/fa';
import { MdTimeline, MdAutoGraph } from 'react-icons/md';
import './Charts/Charts.css';

const PerformanceDashboard = ({ books, userGoals = { yearly: 50, monthly: 4 } }) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  
  const metrics = calculatePerformanceMetrics(books, userGoals);
  const goalProgress = calculateReadingGoalProgress(books, userGoals);

  const renderScoreCard = (title, score, icon, description) => {
    const getScoreColor = (score) => {
      if (score >= 80) return '#16a085';
      if (score >= 60) return '#f39c12';
      if (score >= 40) return '#e67e22';
      return '#e74c3c';
    };

    return (
      <div className="stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
          {icon}
        </div>
        <div className="stat-value" style={{ color: getScoreColor(score) }}>
          {score}
        </div>
        <div className="stat-label">{title}</div>
        <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '5px', textAlign: 'center' }}>
          {description}
        </div>
      </div>
    );
  };

  const renderGoalProgress = (goal, title, icon) => {
    const progressPercentage = Math.min(goal.percentage, 100);
    const isOnTrack = goal.onTrack;

    return (
      <div className="progress-bar-container">
        <div className="progress-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {icon}
            <h3 className="progress-title">{title}</h3>
          </div>
          <div className="progress-stats">
            <span className="current-value">{goal.current}</span>
            <span className="separator">/</span>
            <span className="target-value">{goal.target}</span>
          </div>
        </div>
        
        <div className="progress-bar-wrapper">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progressPercentage}%`,
                background: isOnTrack 
                  ? 'linear-gradient(45deg, #16a085, #1abc9c)' 
                  : 'linear-gradient(45deg, #e67e22, #f39c12)'
              }}
            />
          </div>
          <div className="progress-percentage">
            {progressPercentage.toFixed(1)}%
          </div>
        </div>
        
        <div className="progress-details">
          <div className="detail-item">
            <span className="detail-label">残り:</span>
            <span className="detail-value">{goal.remaining}冊</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">進捗:</span>
            <span className="detail-value" style={{ color: isOnTrack ? '#16a085' : '#e67e22' }}>
              {isOnTrack ? '順調' : '要努力'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (metrics.recommendations.length === 0) return null;

    const getPriorityIcon = (priority) => {
      switch (priority) {
        case 'high': return <IoAlertCircle style={{ color: '#e74c3c' }} />;
        case 'medium': return <IoInformationCircle style={{ color: '#f39c12' }} />;
        case 'info': return <IoCheckmarkCircle style={{ color: '#16a085' }} />;
        default: return <IoInformationCircle style={{ color: '#7f8c8d' }} />;
      }
    };

    return (
      <div className="trend-analysis-container">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MdAutoGraph />
          改善提案
        </h3>
        {metrics.recommendations.map((rec, index) => (
          <div key={index} className="trend-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              {getPriorityIcon(rec.priority)}
              <h4 style={{ margin: 0, color: '#2c3e50' }}>{rec.title}</h4>
            </div>
            <p style={{ margin: '0 0 10px 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
              {rec.description}
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#34495e' }}>
              {rec.actionItems.map((action, actionIndex) => (
                <li key={actionIndex} style={{ fontSize: '0.85rem', marginBottom: '3px' }}>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  const renderPersonalBests = () => {
    if (!metrics.personalBests || Object.keys(metrics.personalBests).length === 0) {
      return (
        <div className="trend-analysis-container">
          <h3>個人記録</h3>
          <p>まだ記録がありません</p>
        </div>
      );
    }

    const { personalBests } = metrics;

    return (
      <div className="trend-analysis-container">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaMedal style={{ color: '#f39c12' }} />
          個人記録
        </h3>
        
        <div className="stats-overview">
          {personalBests.bestYear && (
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#e74c3c' }}>
                {personalBests.bestYear.count}
              </div>
              <div className="stat-label">年間最多読書数</div>
              <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '5px' }}>
                {personalBests.bestYear.year}年
              </div>
            </div>
          )}
          
          {personalBests.bestMonth && (
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#16a085' }}>
                {personalBests.bestMonth.count}
              </div>
              <div className="stat-label">月間最多読書数</div>
              <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '5px' }}>
                {personalBests.bestMonth.month}
              </div>
            </div>
          )}
          
          {personalBests.longestStreak && personalBests.longestStreak.days > 0 && (
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#9b59b6' }}>
                {personalBests.longestStreak.days}
              </div>
              <div className="stat-label">最長読書継続日数</div>
            </div>
          )}
          
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#34495e' }}>
              {personalBests.totalBooksRead}
            </div>
            <div className="stat-label">総読書数</div>
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <div>
      <div className="stats-overview">
        {renderScoreCard(
          "継続性スコア", 
          metrics.consistencyScore, 
          <FaCalendarAlt style={{ fontSize: '1.5rem', color: '#3498db' }} />,
          "読書習慣の安定性"
        )}
        {renderScoreCard(
          "多様性スコア", 
          metrics.varietyScore, 
          <MdTimeline style={{ fontSize: '1.5rem', color: '#e74c3c' }} />,
          "ジャンルの幅広さ"
        )}
        {renderScoreCard(
          "進捗率", 
          metrics.progressRate, 
          <FaBullseye style={{ fontSize: '1.5rem', color: '#16a085' }} />,
          "目標達成ペース"
        )}
        {renderScoreCard(
          "読書速度", 
          `${metrics.readingVelocity}`, 
          <FaChartLine style={{ fontSize: '1.5rem', color: '#f39c12' }} />,
          "週平均冊数"
        )}
      </div>
      
      {renderGoalProgress(goalProgress.yearly, "年間目標", <FaBullseye style={{ color: '#3498db' }} />)}
      {renderGoalProgress(goalProgress.monthly, "月間目標", <FaCalendarAlt style={{ color: '#16a085' }} />)}
    </div>
  );

  const tabs = [
    { id: 'overview', label: '概要', icon: <FaChartLine /> },
    { id: 'recommendations', label: '改善提案', icon: <MdAutoGraph /> },
    { id: 'records', label: '個人記録', icon: <FaMedal /> }
  ];

  return (
    <div className="chart-container">
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e9ecef' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: selectedTab === tab.id ? '#f8f9fa' : 'transparent',
                borderBottom: selectedTab === tab.id ? '2px solid #3498db' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: selectedTab === tab.id ? '#3498db' : '#7f8c8d',
                fontWeight: selectedTab === tab.id ? '600' : '400'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'recommendations' && renderRecommendations()}
      {selectedTab === 'records' && renderPersonalBests()}
    </div>
  );
};

export default PerformanceDashboard;
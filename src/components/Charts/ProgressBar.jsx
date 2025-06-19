import React from 'react';

const ProgressBar = ({ current, target, title }) => {
  const percentage = Math.min((current / target) * 100, 100);
  const remaining = Math.max(target - current, 0);

  return (
    <div className="progress-bar-container">
      <div className="progress-header">
        <h3 className="progress-title">{title}</h3>
        <div className="progress-stats">
          <span className="current-value">{current}</span>
          <span className="separator">/</span>
          <span className="target-value">{target}</span>
        </div>
      </div>
      
      <div className="progress-bar-wrapper">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="progress-percentage">{percentage.toFixed(1)}%</span>
      </div>

      <div className="progress-details">
        <div className="detail-item">
          <span className="detail-label">達成率:</span>
          <span className="detail-value">{percentage.toFixed(1)}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">残り:</span>
          <span className="detail-value">{remaining}冊</span>
        </div>
      </div>
    </div>
  );
};

const ReadingProgressBars = ({ readingProgress }) => {
  if (!readingProgress) {
    return (
      <div className="progress-bars-container">
        <p className="no-data-message">データがありません</p>
      </div>
    );
  }

  const { totalBooks, readBooks, ownedBooks, targetBooks } = readingProgress;

  return (
    <div className="progress-bars-container">
      <h2 className="section-title">読書目標達成状況</h2>
      
      <ProgressBar 
        current={totalBooks} 
        target={targetBooks} 
        title="年間読書目標"
      />
      
      <ProgressBar 
        current={readBooks} 
        target={totalBooks} 
        title="読了率"
      />
      
      <ProgressBar 
        current={ownedBooks} 
        target={totalBooks} 
        title="所有率"
      />
    </div>
  );
};

export default ReadingProgressBars;
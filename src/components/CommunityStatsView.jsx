import React, { useState, useEffect } from 'react';
import { communityStatsManager } from '../utils/communityStats';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  IoGlobeOutline,
  IoStatsChartOutline,
  IoTrophyOutline,
  IoShieldCheckmarkOutline,
  IoWarningOutline,
  IoBookOutline,
  IoTrendingUpOutline,
  IoPersonOutline,
  IoTimeOutline
} from 'react-icons/io5';
import './Charts/Charts.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CommunityStatsView = ({ books }) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [optedIn, setOptedIn] = useState(false);
  const [communityStats, setCommunityStats] = useState(null);
  const [userComparison, setUserComparison] = useState(null);

  useEffect(() => {
    setOptedIn(communityStatsManager.getOptInStatus());
    setCommunityStats(communityStatsManager.getCommunityStats());
    
    if (books && books.length > 0) {
      setUserComparison(communityStatsManager.compareWithCommunity(books));
    }
  }, [books]);

  const handleOptInChange = (newOptIn) => {
    setOptedIn(newOptIn);
    communityStatsManager.setOptInStatus(newOptIn);
    
    if (newOptIn && books) {
      communityStatsManager.saveUserData(books);
    }
    
    setCommunityStats(communityStatsManager.getCommunityStats());
    
    if (books && books.length > 0) {
      setUserComparison(communityStatsManager.compareWithCommunity(books));
    }
  };

  const renderOptInSection = () => (
    <div className="trend-analysis-container">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <IoShieldCheckmarkOutline />
        プライバシー設定
      </h3>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '15px'
        }}>
          <input
            type="checkbox"
            id="optInCheckbox"
            checked={optedIn}
            onChange={(e) => handleOptInChange(e.target.checked)}
            style={{ transform: 'scale(1.2)' }}
          />
          <label htmlFor="optInCheckbox" style={{ fontWeight: '600', color: '#2c3e50' }}>
            匿名化データの共有に同意する
          </label>
        </div>
        
        <div style={{ 
          padding: '15px', 
          backgroundColor: optedIn ? '#d4edda' : '#fff3cd',
          border: `1px solid ${optedIn ? '#c3e6cb' : '#ffeaa7'}`,
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#495057'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            {optedIn ? <IoShieldCheckmarkOutline style={{ color: '#155724', marginTop: '2px' }} /> 
                    : <IoWarningOutline style={{ color: '#856404', marginTop: '2px' }} />}
            <div>
              {optedIn ? (
                <div>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>データ共有が有効になっています</p>
                  <p style={{ margin: 0 }}>
                    あなたの読書データは完全に匿名化され、コミュニティ統計の改善に活用されます。
                    個人を特定できる情報は一切含まれません。
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>データ共有が無効になっています</p>
                  <p style={{ margin: 0 }}>
                    コミュニティ統計は参考データで表示されます。
                    より正確な比較を行うには、匿名化データの共有をご検討ください。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => {
    if (!communityStats) return null;

    return (
      <div>
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#3498db' }}>
              {communityStats.totalUsers}
            </div>
            <div className="stat-label">参加ユーザー数</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a085' }}>
              {communityStats.averageBooks}
            </div>
            <div className="stat-label">平均登録数</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#e74c3c' }}>
              {communityStats.averageReadBooks}
            </div>
            <div className="stat-label">平均読了数</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#f39c12' }}>
              {communityStats.readingPaceDistribution.average}
            </div>
            <div className="stat-label">平均月間ペース</div>
          </div>
        </div>

        {/* 人気カテゴリーチャート */}
        <div className="chart-container">
          <h4 style={{ marginBottom: '20px' }}>人気カテゴリー</h4>
          <Bar
            data={{
              labels: communityStats.popularCategories.map(cat => cat.category),
              datasets: [{
                label: '読書数',
                data: communityStats.popularCategories.map(cat => cat.count),
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgb(52, 152, 219)',
                borderWidth: 1,
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.parsed.y}人が読書 (${communityStats.popularCategories[context.dataIndex].percentage}%)`
                  }
                }
              },
              scales: {
                y: { beginAtZero: true, title: { display: true, text: '読書数' } }
              }
            }}
          />
        </div>

        {/* ユーザーセグメント分布 */}
        <div className="chart-container">
          <h4 style={{ marginBottom: '20px' }}>ユーザー分布</h4>
          <Doughnut
            data={{
              labels: communityStats.userSegments.map(seg => this.getSegmentLabel(seg.segment)),
              datasets: [{
                data: communityStats.userSegments.map(seg => seg.count),
                backgroundColor: [
                  'rgba(52, 152, 219, 0.8)',
                  'rgba(46, 204, 113, 0.8)', 
                  'rgba(231, 76, 60, 0.8)',
                  'rgba(241, 196, 15, 0.8)',
                  'rgba(155, 89, 182, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.label}: ${context.parsed}人 (${communityStats.userSegments[context.dataIndex].percentage}%)`
                  }
                }
              }
            }}
          />
        </div>
      </div>
    );
  };

  const renderComparison = () => {
    if (!userComparison) {
      return (
        <div className="trend-analysis-container">
          <p className="no-data-message">比較には読書データが必要です</p>
        </div>
      );
    }

    const getRankColor = (percentile) => {
      if (percentile >= 80) return '#16a085';
      if (percentile >= 60) return '#f39c12';
      if (percentile >= 40) return '#e67e22';
      return '#e74c3c';
    };

    const getRankText = (percentile) => {
      if (percentile >= 90) return 'トップ10%';
      if (percentile >= 80) return 'トップ20%';
      if (percentile >= 60) return '上位40%';
      if (percentile >= 40) return '平均的';
      return '改善の余地あり';
    };

    return (
      <div>
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-value" style={{ color: getRankColor(userComparison.comparison.readBooksRank) }}>
              {getRankText(userComparison.comparison.readBooksRank)}
            </div>
            <div className="stat-label">読了数ランク</div>
            <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '5px' }}>
              {userComparison.user.readBooks}冊 vs 平均{userComparison.community.averageReadBooks}冊
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value" style={{ color: getRankColor(userComparison.comparison.totalBooksRank) }}>
              {getRankText(userComparison.comparison.totalBooksRank)}
            </div>
            <div className="stat-label">登録数ランク</div>
            <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '5px' }}>
              {userComparison.user.totalBooks}冊 vs 平均{userComparison.community.averageBooks}冊
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value" style={{ color: getRankColor(userComparison.comparison.paceRank) }}>
              {getRankText(userComparison.comparison.paceRank)}
            </div>
            <div className="stat-label">ペースランク</div>
            <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '5px' }}>
              {userComparison.user.pace}冊/月 vs 平均{userComparison.community.averagePace}冊/月
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-value" style={{ color: getRankColor(userComparison.comparison.overallRank) }}>
              {getRankText(userComparison.comparison.overallRank)}
            </div>
            <div className="stat-label">総合ランク</div>
          </div>
        </div>

        <div className="trend-analysis-container">
          <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IoPersonOutline />
            パーソナライズド インサイト
          </h4>
          {userComparison.insights.map((insight, index) => (
            <div key={index} style={{ 
              padding: '10px 15px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px', 
              marginBottom: '10px',
              borderLeft: '4px solid #3498db'
            }}>
              {insight}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRanking = () => {
    if (!communityStats || !communityStats.topPerformers) return null;

    return (
      <div className="trend-analysis-container">
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IoTrophyOutline />
          読書ランキング（匿名）
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>順位</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>ユーザーID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>読了数</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>月間ペース</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e9ecef' }}>レベル</th>
              </tr>
            </thead>
            <tbody>
              {communityStats.topPerformers.map((performer) => (
                <tr key={performer.rank}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {performer.rank <= 3 && <IoTrophyOutline style={{ 
                        color: performer.rank === 1 ? '#f1c40f' : performer.rank === 2 ? '#95a5a6' : '#cd7f32' 
                      }} />}
                      #{performer.rank}
                    </div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef', fontFamily: 'monospace' }}>
                    ...{performer.id}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
                    {performer.readBooks}冊
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
                    {performer.readingPace}/月
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e9ecef' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      backgroundColor: this.getSegmentColor(performer.segment),
                      color: 'white'
                    }}>
                      {this.getSegmentLabel(performer.segment)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTrends = () => {
    if (!communityStats) return null;

    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                       '7月', '8月', '9月', '10月', '11月', '12月'];

    return (
      <div>
        <div className="chart-container">
          <h4 style={{ marginBottom: '20px' }}>コミュニティ月間トレンド</h4>
          <Line
            data={{
              labels: monthNames,
              datasets: [{
                label: '平均読書数',
                data: communityStats.monthlyTrends,
                borderColor: 'rgb(231, 76, 60)',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.4,
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'コミュニティの月別読書傾向' }
              },
              scales: {
                y: { beginAtZero: true, title: { display: true, text: '平均読書数' } }
              }
            }}
          />
        </div>

        <div className="trend-analysis-container">
          <h4 style={{ marginBottom: '15px' }}>読書ペース分布</h4>
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#16a085' }}>
                {communityStats.readingPaceDistribution.min}
              </div>
              <div className="stat-label">最低ペース</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#f39c12' }}>
                {communityStats.readingPaceDistribution.median}
              </div>
              <div className="stat-label">中央値</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: '#e74c3c' }}>
                {communityStats.readingPaceDistribution.max}
              </div>
              <div className="stat-label">最高ペース</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  getSegmentLabel(segment) {
    const labels = {
      'heavy_reader': 'ヘビー',
      'moderate_reader': 'モデレート',
      'light_reader': 'ライト',
      'casual_reader': 'カジュアル',
      'new_user': '新規'
    };
    return labels[segment] || segment;
  }

  getSegmentColor(segment) {
    const colors = {
      'heavy_reader': '#e74c3c',
      'moderate_reader': '#f39c12',
      'light_reader': '#16a085',
      'casual_reader': '#3498db',
      'new_user': '#95a5a6'
    };
    return colors[segment] || '#95a5a6';
  }

  const tabs = [
    { id: 'privacy', label: 'プライバシー', icon: <IoShieldCheckmarkOutline /> },
    { id: 'overview', label: '概要', icon: <IoStatsChartOutline /> },
    { id: 'comparison', label: '比較', icon: <IoPersonOutline /> },
    { id: 'ranking', label: 'ランキング', icon: <IoTrophyOutline /> },
    { id: 'trends', label: 'トレンド', icon: <IoTrendingUpOutline /> }
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

      {selectedTab === 'privacy' && renderOptInSection()}
      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'comparison' && renderComparison()}
      {selectedTab === 'ranking' && renderRanking()}
      {selectedTab === 'trends' && renderTrends()}
    </div>
  );
};

export default CommunityStatsView;
import React, { useState } from 'react';
import { exportToCSV, exportStatisticsToCSV, exportToPDF } from '../utils/export';

const ExportButton = ({ books, statistics, year, type = 'books' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      if (type === 'books') {
        const filename = `reading_list_${year}.csv`;
        exportToCSV(books, filename);
      } else if (type === 'statistics') {
        const filename = `reading_statistics_${year}.csv`;
        exportStatisticsToCSV(statistics, year, filename);
      }
    } catch (error) {
      console.error('CSV エクスポート エラー:', error);
      alert('CSVの出力に失敗しました。');
    } finally {
      setIsExporting(false);
      setShowDropdown(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      if (type === 'books') {
        const filename = `reading_list_${year}.pdf`;
        await exportToPDF(books, year, filename);
      } else {
        alert('PDFエクスポートは読書リストのみ対応しています。');
      }
    } catch (error) {
      console.error('PDF エクスポート エラー:', error);
      alert('PDFの出力に失敗しました。');
    } finally {
      setIsExporting(false);
      setShowDropdown(false);
    }
  };

  const isDataAvailable = () => {
    if (type === 'books') {
      return books && books.length > 0;
    } else if (type === 'statistics') {
      return statistics && statistics.readingProgress;
    }
    return false;
  };

  if (!isDataAvailable()) {
    return (
      <div className="export-button-container">
        <button 
          className="export-button disabled" 
          disabled
          title="エクスポートするデータがありません"
        >
          エクスポート
        </button>
      </div>
    );
  }

  return (
    <div className="export-button-container">
      <div className="export-dropdown">
        <button 
          className="export-button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={isExporting}
        >
          {isExporting ? 'エクスポート中...' : 'エクスポート'}
          <span className="dropdown-arrow">▼</span>
        </button>
        
        {showDropdown && (
          <div className="export-dropdown-menu">
            <button 
              className="export-option"
              onClick={handleExportCSV}
              disabled={isExporting}
            >
              CSV形式で出力
            </button>
            {type === 'books' && (
              <button 
                className="export-option"
                onClick={handleExportPDF}
                disabled={isExporting}
              >
                PDF形式で出力
              </button>
            )}
          </div>
        )}
      </div>
      
      {showDropdown && (
        <div 
          className="export-dropdown-overlay"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default ExportButton;
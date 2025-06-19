export class ReadingPatternAnalyzer {
  constructor(books) {
    this.books = books || [];
    this.readBooks = this.books.filter(book => book.isRead && book.timestamp);
  }

  analyzeReadingPatterns() {
    if (this.readBooks.length === 0) {
      return {
        patterns: [],
        seasonality: null,
        anomalies: [],
        trends: null,
        predictions: null
      };
    }

    return {
      patterns: this.classifyReadingPatterns(),
      seasonality: this.detectSeasonality(),
      anomalies: this.detectAnomalies(),
      trends: this.analyzeTrends(),
      predictions: this.generatePredictions()
    };
  }

  classifyReadingPatterns() {
    const patterns = [];

    const timeBasedPattern = this.analyzeTimeBasedPattern();
    const categoryPattern = this.analyzeCategoryPattern();
    const volumePattern = this.analyzeVolumePattern();
    const consistencyPattern = this.analyzeConsistencyPattern();

    patterns.push(timeBasedPattern, categoryPattern, volumePattern, consistencyPattern);
    
    return patterns.filter(pattern => pattern.confidence > 0.5);
  }

  analyzeTimeBasedPattern() {
    const hourlyData = Array(24).fill(0);
    const weeklyData = Array(7).fill(0);
    
    this.readBooks.forEach(book => {
      const date = book.timestamp.toDate();
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      
      hourlyData[hour]++;
      weeklyData[dayOfWeek]++;
    });

    const peakHour = hourlyData.indexOf(Math.max(...hourlyData));
    const peakDay = weeklyData.indexOf(Math.max(...weeklyData));
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    let timeType = 'unknown';
    let confidence = 0;

    if (peakHour >= 6 && peakHour <= 10) {
      timeType = 'morning_reader';
      confidence = 0.8;
    } else if (peakHour >= 19 && peakHour <= 23) {
      timeType = 'evening_reader';
      confidence = 0.8;
    } else if (peakHour >= 11 && peakHour <= 14) {
      timeType = 'afternoon_reader';
      confidence = 0.7;
    }

    return {
      type: 'time_based',
      subtype: timeType,
      confidence,
      description: `主に${peakHour}時頃、${dayNames[peakDay]}曜日に読書する傾向`,
      data: {
        peakHour,
        peakDay: dayNames[peakDay],
        hourlyDistribution: hourlyData,
        weeklyDistribution: weeklyData
      }
    };
  }

  analyzeCategoryPattern() {
    const categoryCount = {};
    this.readBooks.forEach(book => {
      const category = book.category || 'その他';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a);

    const totalBooks = this.readBooks.length;
    const topCategory = sortedCategories[0];
    const topCategoryRatio = topCategory[1] / totalBooks;

    let patternType = 'diverse';
    let confidence = 0.6;

    if (topCategoryRatio > 0.6) {
      patternType = 'specialist';
      confidence = 0.9;
    } else if (topCategoryRatio > 0.4) {
      patternType = 'focused';
      confidence = 0.8;
    } else if (sortedCategories.length >= 5) {
      patternType = 'diverse';
      confidence = 0.9;
    }

    return {
      type: 'category_based',
      subtype: patternType,
      confidence,
      description: this.getCategoryPatternDescription(patternType, topCategory[0], topCategoryRatio),
      data: {
        primaryCategory: topCategory[0],
        primaryRatio: topCategoryRatio,
        categoryDistribution: categoryCount,
        diversityIndex: sortedCategories.length
      }
    };
  }

  analyzeVolumePattern() {
    const monthlyVolume = {};
    
    this.readBooks.forEach(book => {
      const date = book.timestamp.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyVolume[monthKey] = (monthlyVolume[monthKey] || 0) + 1;
    });

    const volumes = Object.values(monthlyVolume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - avgVolume, 2), 0) / volumes.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avgVolume;

    let volumeType = 'irregular';
    let confidence = 0.6;

    if (coefficientOfVariation < 0.3) {
      volumeType = 'steady';
      confidence = 0.9;
    } else if (coefficientOfVariation < 0.6) {
      volumeType = 'moderate';
      confidence = 0.8;
    } else {
      volumeType = 'irregular';
      confidence = 0.7;
    }

    return {
      type: 'volume_based',
      subtype: volumeType,
      confidence,
      description: this.getVolumePatternDescription(volumeType, avgVolume),
      data: {
        averageMonthlyVolume: Math.round(avgVolume * 10) / 10,
        variability: coefficientOfVariation,
        monthlyData: monthlyVolume
      }
    };
  }

  analyzeConsistencyPattern() {
    const sortedBooks = this.readBooks.sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
    const gaps = [];

    for (let i = 1; i < sortedBooks.length; i++) {
      const prevDate = sortedBooks[i - 1].timestamp.toDate();
      const currentDate = sortedBooks[i].timestamp.toDate();
      const gapDays = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));
      gaps.push(gapDays);
    }

    if (gaps.length === 0) {
      return {
        type: 'consistency',
        subtype: 'insufficient_data',
        confidence: 0.1,
        description: 'データが不足しています',
        data: {}
      };
    }

    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const maxGap = Math.max(...gaps);
    const consistencyScore = 1 - (maxGap - avgGap) / (maxGap || 1);

    let consistencyType = 'irregular';
    let confidence = 0.7;

    if (consistencyScore > 0.8 && avgGap <= 7) {
      consistencyType = 'very_consistent';
      confidence = 0.95;
    } else if (consistencyScore > 0.6 && avgGap <= 14) {
      consistencyType = 'consistent';
      confidence = 0.8;
    } else if (avgGap <= 30) {
      consistencyType = 'moderate';
      confidence = 0.7;
    }

    return {
      type: 'consistency',
      subtype: consistencyType,
      confidence,
      description: this.getConsistencyPatternDescription(consistencyType, avgGap),
      data: {
        averageGapDays: Math.round(avgGap),
        maxGapDays: maxGap,
        consistencyScore: Math.round(consistencyScore * 100) / 100,
        totalGaps: gaps.length
      }
    };
  }

  detectSeasonality() {
    if (this.readBooks.length < 12) return null;

    const monthlyData = Array(12).fill(0);
    
    this.readBooks.forEach(book => {
      const month = book.timestamp.toDate().getMonth();
      monthlyData[month]++;
    });

    const avgMonthly = monthlyData.reduce((a, b) => a + b, 0) / 12;
    const seasonalityIndex = monthlyData.map(count => count / avgMonthly);
    
    const maxIndex = Math.max(...seasonalityIndex);
    const minIndex = Math.min(...seasonalityIndex);
    const seasonalStrength = maxIndex - minIndex;

    if (seasonalStrength < 0.5) {
      return {
        strength: 'weak',
        peakMonths: [],
        lowMonths: [],
        description: '明確な季節性は見られません'
      };
    }

    const peakMonths = monthlyData
      .map((count, index) => ({ month: index + 1, count, index: seasonalityIndex[index] }))
      .filter(item => item.index > 1.2)
      .map(item => item.month);

    const lowMonths = monthlyData
      .map((count, index) => ({ month: index + 1, count, index: seasonalityIndex[index] }))
      .filter(item => item.index < 0.8)
      .map(item => item.month);

    return {
      strength: seasonalStrength > 1.0 ? 'strong' : 'moderate',
      peakMonths,
      lowMonths,
      seasonalityIndex,
      description: this.getSeasonalityDescription(peakMonths, lowMonths),
      monthlyData
    };
  }

  detectAnomalies() {
    const anomalies = [];
    
    const monthlyVolume = {};
    this.readBooks.forEach(book => {
      const date = book.timestamp.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyVolume[monthKey] = (monthlyVolume[monthKey] || 0) + 1;
    });

    const volumes = Object.values(monthlyVolume);
    if (volumes.length < 3) return anomalies;

    const mean = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const stdDev = Math.sqrt(volumes.reduce((sum, vol) => sum + Math.pow(vol - mean, 2), 0) / volumes.length);

    Object.entries(monthlyVolume).forEach(([month, volume]) => {
      const zScore = Math.abs((volume - mean) / stdDev);
      
      if (zScore > 2) {
        anomalies.push({
          type: volume > mean ? 'spike' : 'drop',
          month,
          volume,
          zScore: Math.round(zScore * 100) / 100,
          description: volume > mean 
            ? `${month}は通常より多く読書しました (${volume}冊)`
            : `${month}は通常より少ない読書でした (${volume}冊)`
        });
      }
    });

    return anomalies.sort((a, b) => b.zScore - a.zScore);
  }

  analyzeTrends() {
    if (this.readBooks.length < 6) return null;

    const monthlyData = {};
    this.readBooks.forEach(book => {
      const date = book.timestamp.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const recentMonths = sortedMonths.slice(-6);
    const recentVolumes = recentMonths.map(month => monthlyData[month]);

    const trend = this.calculateLinearTrend(recentVolumes);
    
    return {
      direction: trend.slope > 0.1 ? 'increasing' : trend.slope < -0.1 ? 'decreasing' : 'stable',
      slope: Math.round(trend.slope * 100) / 100,
      strength: Math.abs(trend.slope),
      r_squared: Math.round(trend.r_squared * 100) / 100,
      description: this.getTrendDescription(trend.slope),
      recentData: recentVolumes
    };
  }

  generatePredictions() {
    if (this.readBooks.length < 12) return null;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    const yearBooks = this.readBooks.filter(book => 
      book.timestamp.toDate().getFullYear() === currentYear
    );

    const avgMonthlyPace = yearBooks.length / currentMonth;
    const projectedYearEnd = Math.round(avgMonthlyPace * 12);
    
    const seasonality = this.detectSeasonality();
    let adjustedPrediction = projectedYearEnd;
    
    if (seasonality && seasonality.strength !== 'weak') {
      const remainingMonthsIndex = seasonality.seasonalityIndex.slice(currentMonth);
      const avgRemainingSeasonality = remainingMonthsIndex.reduce((a, b) => a + b, 0) / remainingMonthsIndex.length;
      adjustedPrediction = Math.round(yearBooks.length + (avgMonthlyPace * (12 - currentMonth) * avgRemainingSeasonality));
    }

    return {
      yearEndPrediction: adjustedPrediction,
      confidence: this.calculatePredictionConfidence(),
      monthlyPace: Math.round(avgMonthlyPace * 10) / 10,
      remainingMonths: 12 - currentMonth,
      currentProgress: yearBooks.length,
      description: `現在のペースでは年末まで約${adjustedPrediction}冊読了予定`
    };
  }

  calculateLinearTrend(data) {
    const n = data.length;
    const x = Array.from({length: n}, (_, i) => i + 1);
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * x[i] + intercept), 2), 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r_squared = 1 - (ssRes / ssTot);

    return { slope, intercept, r_squared };
  }

  calculatePredictionConfidence() {
    const dataPoints = this.readBooks.length;
    const timeSpan = this.getTimeSpanMonths();
    
    let confidence = 0.5;
    
    if (dataPoints >= 50 && timeSpan >= 12) confidence = 0.9;
    else if (dataPoints >= 30 && timeSpan >= 6) confidence = 0.8;
    else if (dataPoints >= 15 && timeSpan >= 3) confidence = 0.7;
    else if (dataPoints >= 10) confidence = 0.6;
    
    return confidence;
  }

  getTimeSpanMonths() {
    if (this.readBooks.length < 2) return 0;
    
    const sortedBooks = this.readBooks.sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
    const firstDate = sortedBooks[0].timestamp.toDate();
    const lastDate = sortedBooks[sortedBooks.length - 1].timestamp.toDate();
    
    return Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24 * 30.44));
  }

  getCategoryPatternDescription(type, category, ratio) {
    const percentage = Math.round(ratio * 100);
    switch (type) {
      case 'specialist':
        return `${category}分野の専門的読者 (${percentage}%集中)`;
      case 'focused':
        return `${category}分野を中心とした読書傾向 (${percentage}%)`;
      case 'diverse':
        return '幅広いジャンルの本を読む多様性のある読者';
      default:
        return '読書パターンを分析中';
    }
  }

  getVolumePatternDescription(type, avgVolume) {
    const rounded = Math.round(avgVolume * 10) / 10;
    switch (type) {
      case 'steady':
        return `安定した読書ペース (月平均${rounded}冊)`;
      case 'moderate':
        return `やや変動のある読書ペース (月平均${rounded}冊)`;
      case 'irregular':
        return `不規則な読書パターン (月平均${rounded}冊)`;
      default:
        return '読書ペースを分析中';
    }
  }

  getConsistencyPatternDescription(type, avgGap) {
    const days = Math.round(avgGap);
    switch (type) {
      case 'very_consistent':
        return `非常に規則的な読書習慣 (平均${days}日間隔)`;
      case 'consistent':
        return `規則的な読書習慣 (平均${days}日間隔)`;
      case 'moderate':
        return `ある程度規則的な読書習慣 (平均${days}日間隔)`;
      case 'irregular':
        return `不規則な読書習慣 (平均${days}日間隔)`;
      default:
        return '読書習慣を分析中';
    }
  }

  getSeasonalityDescription(peakMonths, lowMonths) {
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', 
                       '7月', '8月', '9月', '10月', '11月', '12月'];
    
    let description = '';
    if (peakMonths.length > 0) {
      const peaks = peakMonths.map(m => monthNames[m - 1]).join('、');
      description += `${peaks}に読書が活発`;
    }
    if (lowMonths.length > 0) {
      const lows = lowMonths.map(m => monthNames[m - 1]).join('、');
      description += description ? `、${lows}に読書が減少` : `${lows}に読書が少ない`;
    }
    
    return description || '季節性のパターンを分析中';
  }

  getTrendDescription(slope) {
    if (slope > 0.3) return '読書量が増加傾向にあります';
    if (slope > 0.1) return '読書量がゆるやかに増加しています';
    if (slope < -0.3) return '読書量が減少傾向にあります';
    if (slope < -0.1) return '読書量がゆるやかに減少しています';
    return '読書量は安定しています';
  }
}

export const analyzeReadingPatterns = (books) => {
  const analyzer = new ReadingPatternAnalyzer(books);
  return analyzer.analyzeReadingPatterns();
};
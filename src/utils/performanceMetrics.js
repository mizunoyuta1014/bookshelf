export const calculatePerformanceMetrics = (books, userGoals = {}) => {
  if (!books || books.length === 0) {
    return {
      consistencyScore: 0,
      varietyScore: 0,
      progressRate: 0,
      readingVelocity: 0,
      recommendations: [],
      personalBests: {}
    };
  }

  const currentYear = new Date().getFullYear();
  const yearBooks = books.filter(book => 
    book.timestamp && book.timestamp.toDate().getFullYear() === currentYear
  );
  
  const readBooks = yearBooks.filter(book => book.isRead);
  
  const consistencyScore = calculateConsistencyScore(readBooks);
  const varietyScore = calculateVarietyScore(readBooks);
  const progressRate = calculateProgressRate(readBooks, userGoals.yearly || 50);
  const readingVelocity = calculateReadingVelocity(readBooks);
  const recommendations = generateRecommendations(consistencyScore, varietyScore, progressRate, readingVelocity);
  const personalBests = calculatePersonalBests(books);

  return {
    consistencyScore,
    varietyScore,
    progressRate,
    readingVelocity,
    recommendations,
    personalBests,
    totalBooksThisYear: yearBooks.length,
    readBooksThisYear: readBooks.length,
    completionRate: yearBooks.length > 0 ? (readBooks.length / yearBooks.length * 100) : 0
  };
};

const calculateConsistencyScore = (readBooks) => {
  if (readBooks.length === 0) return 0;

  const now = new Date();
  const monthlyReadCounts = Array(12).fill(0);
  
  readBooks.forEach(book => {
    const month = book.timestamp.toDate().getMonth();
    monthlyReadCounts[month]++;
  });

  const currentMonth = now.getMonth();
  const activeMonths = monthlyReadCounts.slice(0, currentMonth + 1).filter(count => count > 0).length;
  const totalActiveMonths = currentMonth + 1;
  
  const consistencyRatio = activeMonths / totalActiveMonths;
  
  const average = monthlyReadCounts.slice(0, currentMonth + 1).reduce((a, b) => a + b, 0) / totalActiveMonths;
  const variance = monthlyReadCounts.slice(0, currentMonth + 1)
    .reduce((sum, count) => sum + Math.pow(count - average, 2), 0) / totalActiveMonths;
  const standardDeviation = Math.sqrt(variance);
  
  const stabilityScore = average > 0 ? Math.max(0, 100 - (standardDeviation / average * 100)) : 0;
  
  return Math.round((consistencyRatio * 0.6 + stabilityScore * 0.4));
};

const calculateVarietyScore = (readBooks) => {
  if (readBooks.length === 0) return 0;

  const categories = {};
  const authors = {};
  
  readBooks.forEach(book => {
    const category = book.category || 'その他';
    const author = book.author || 'Unknown';
    
    categories[category] = (categories[category] || 0) + 1;
    authors[author] = (authors[author] || 0) + 1;
  });

  const categoryCount = Object.keys(categories).length;
  const authorCount = Object.keys(authors).length;
  
  const categoryVariety = Math.min(categoryCount / 5, 1) * 50;
  const authorVariety = Math.min(authorCount / readBooks.length, 0.8) * 50;
  
  return Math.round(categoryVariety + authorVariety);
};

const calculateProgressRate = (readBooks, yearlyGoal) => {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const expectedProgress = (dayOfYear / 365) * yearlyGoal;
  
  if (expectedProgress === 0) return 100;
  
  const actualProgress = readBooks.length;
  const progressRate = (actualProgress / expectedProgress) * 100;
  
  return Math.round(Math.min(progressRate, 200));
};

const calculateReadingVelocity = (readBooks) => {
  if (readBooks.length === 0) return 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const weeksInYear = Math.ceil((now - new Date(currentYear, 0, 1)) / (1000 * 60 * 60 * 24 * 7));
  
  return Number((readBooks.length / Math.max(weeksInYear, 1)).toFixed(1));
};

const generateRecommendations = (consistency, variety, progress, velocity) => {
  const recommendations = [];

  if (consistency < 50) {
    recommendations.push({
      type: 'consistency',
      title: '読書習慣の安定化',
      description: '毎日少しずつでも読書する習慣を作りましょう',
      priority: 'high',
      actionItems: [
        '毎日15分の読書時間を設定',
        '読書リマインダーを設定',
        '小さな目標から始める（週1冊など）'
      ]
    });
  }

  if (variety < 40) {
    recommendations.push({
      type: 'variety',
      title: '読書ジャンルの多様化',
      description: '様々なカテゴリの本を読んで視野を広げましょう',
      priority: 'medium',
      actionItems: [
        '新しいジャンルを月1冊試す',
        '異なる著者の本を選ぶ',
        'おすすめ機能を活用する'
      ]
    });
  }

  if (progress < 80) {
    recommendations.push({
      type: 'progress',
      title: '読書ペースの改善',
      description: '年間目標達成に向けてペースを上げましょう',
      priority: progress < 50 ? 'high' : 'medium',
      actionItems: [
        '読書時間を増やす',
        '目標を調整する',
        'オーディオブックを試す'
      ]
    });
  }

  if (velocity < 0.5) {
    recommendations.push({
      type: 'velocity',
      title: '読書スピードの向上',
      description: '効率的な読書方法を身につけましょう',
      priority: 'medium',
      actionItems: [
        'スキミング技術を学ぶ',
        '目的意識を持って読む',
        '要約を作る習慣をつける'
      ]
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'excellence',
      title: '素晴らしい読書習慣です！',
      description: 'この調子で読書を続けましょう',
      priority: 'info',
      actionItems: [
        '読書記録を継続する',
        '新しいチャレンジを設定',
        '他の人に読書習慣を共有する'
      ]
    });
  }

  return recommendations;
};

const calculatePersonalBests = (books) => {
  if (!books || books.length === 0) return {};

  const readBooks = books.filter(book => book.isRead && book.timestamp);
  if (readBooks.length === 0) return {};

  const yearlyStats = {};
  const monthlyStats = {};

  readBooks.forEach(book => {
    const date = book.timestamp.toDate();
    const year = date.getFullYear();
    const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    yearlyStats[year] = (yearlyStats[year] || 0) + 1;
    monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1;
  });

  const bestYear = Object.entries(yearlyStats)
    .reduce((max, [year, count]) => count > max.count ? { year: parseInt(year), count } : max, { year: null, count: 0 });

  const bestMonth = Object.entries(monthlyStats)
    .reduce((max, [month, count]) => count > max.count ? { month, count } : max, { month: null, count: 0 });

  const longestStreak = calculateLongestReadingStreak(readBooks);
  const fastestCompletion = calculateFastestMonthCompletion(readBooks);

  return {
    bestYear: bestYear.count > 0 ? bestYear : null,
    bestMonth: bestMonth.count > 0 ? bestMonth : null,
    longestStreak,
    fastestCompletion,
    totalBooksRead: readBooks.length,
    readingStartDate: readBooks.length > 0 ? readBooks[0].timestamp.toDate() : null
  };
};

const calculateLongestReadingStreak = (readBooks) => {
  if (readBooks.length === 0) return { days: 0, startDate: null, endDate: null };

  const sortedBooks = readBooks.sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
  
  let longestStreak = { days: 0, startDate: null, endDate: null };
  let currentStreak = { days: 1, startDate: sortedBooks[0].timestamp.toDate(), endDate: sortedBooks[0].timestamp.toDate() };

  for (let i = 1; i < sortedBooks.length; i++) {
    const currentDate = sortedBooks[i].timestamp.toDate();
    const prevDate = sortedBooks[i - 1].timestamp.toDate();
    const daysDiff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) {
      currentStreak.endDate = currentDate;
      currentStreak.days = Math.floor((currentDate - currentStreak.startDate) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      if (currentStreak.days > longestStreak.days) {
        longestStreak = { ...currentStreak };
      }
      currentStreak = { days: 1, startDate: currentDate, endDate: currentDate };
    }
  }

  if (currentStreak.days > longestStreak.days) {
    longestStreak = { ...currentStreak };
  }

  return longestStreak;
};

const calculateFastestMonthCompletion = (readBooks) => {
  if (readBooks.length === 0) return { month: null, count: 0, year: null };

  const monthlyStats = {};

  readBooks.forEach(book => {
    const date = book.timestamp.toDate();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;

    monthlyStats[key] = (monthlyStats[key] || 0) + 1;
  });

  const fastest = Object.entries(monthlyStats)
    .reduce((max, [monthKey, count]) => {
      if (count > max.count) {
        const [year, month] = monthKey.split('-');
        return { month: parseInt(month), count, year: parseInt(year) };
      }
      return max;
    }, { month: null, count: 0, year: null });

  return fastest;
};

export const calculateReadingGoalProgress = (books, goals = {}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  const yearBooks = books.filter(book => 
    book.timestamp && book.timestamp.toDate().getFullYear() === currentYear
  );
  const readBooks = yearBooks.filter(book => book.isRead);
  
  const monthBooks = readBooks.filter(book => 
    book.timestamp.toDate().getMonth() + 1 === currentMonth
  );

  const yearlyGoal = goals.yearly || 50;
  const monthlyGoal = goals.monthly || Math.ceil(yearlyGoal / 12);

  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(currentYear, 0, 0)) / (1000 * 60 * 60 * 24));
  const daysInYear = new Date(currentYear, 11, 31).getDate() === 31 ? 366 : 365;
  const yearProgress = (dayOfYear / daysInYear) * 100;

  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const monthProgress = (dayOfMonth / daysInMonth) * 100;

  return {
    yearly: {
      target: yearlyGoal,
      current: readBooks.length,
      percentage: (readBooks.length / yearlyGoal) * 100,
      onTrack: readBooks.length >= (yearlyGoal * yearProgress / 100),
      remaining: Math.max(0, yearlyGoal - readBooks.length),
      timeProgress: yearProgress
    },
    monthly: {
      target: monthlyGoal,
      current: monthBooks.length,
      percentage: (monthBooks.length / monthlyGoal) * 100,
      onTrack: monthBooks.length >= (monthlyGoal * monthProgress / 100),
      remaining: Math.max(0, monthlyGoal - monthBooks.length),
      timeProgress: monthProgress
    }
  };
};
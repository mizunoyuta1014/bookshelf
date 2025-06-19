export const calculateAdvancedYearlyStats = (books, year = new Date().getFullYear()) => {
  if (!books || books.length === 0) return null;
  
  const yearBooks = books.filter(book => {
    if (!book.timestamp) return false;
    return book.timestamp.toDate().getFullYear() === year;
  });
  
  const readBooks = yearBooks.filter(book => book.isRead);
  const monthlyBreakdown = {};
  
  for (let month = 1; month <= 12; month++) {
    const monthBooks = yearBooks.filter(book => 
      book.timestamp.toDate().getMonth() + 1 === month
    );
    const monthRead = monthBooks.filter(book => book.isRead);
    
    monthlyBreakdown[month] = {
      added: monthBooks.length,
      read: monthRead.length,
      completion: monthBooks.length > 0 ? (monthRead.length / monthBooks.length * 100) : 0
    };
  }
  
  return {
    year,
    totalAdded: yearBooks.length,
    totalRead: readBooks.length,
    completionRate: yearBooks.length > 0 ? (readBooks.length / yearBooks.length * 100) : 0,
    monthlyBreakdown,
    averagePerMonth: readBooks.length / 12,
    peakMonth: Object.entries(monthlyBreakdown)
      .reduce((max, [month, data]) => data.read > max.count ? { month: parseInt(month), count: data.read } : max, { month: 1, count: 0 })
  };
};

export const calculateWeeklyReadingPattern = (books) => {
  if (!books || books.length === 0) return {};
  
  const weeklyData = Array(7).fill(0);
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  
  books.forEach(book => {
    if (book.timestamp) {
      const dayOfWeek = book.timestamp.toDate().getDay();
      weeklyData[dayOfWeek] += 1;
    }
  });
  
  return weekDays.map((day, index) => ({
    day,
    count: weeklyData[index],
    percentage: books.length > 0 ? (weeklyData[index] / books.length * 100) : 0
  }));
};

export const predictReadingPace = (books, targetBooks = 50) => {
  if (!books || books.length === 0) return null;
  
  const currentYear = new Date().getFullYear();
  const currentDate = new Date();
  
  const yearBooks = books.filter(book => {
    if (!book.timestamp) return false;
    return book.timestamp.toDate().getFullYear() === currentYear;
  });
  
  const readBooks = yearBooks.filter(book => book.isRead);
  const daysPassedThisYear = Math.floor((currentDate - new Date(currentYear, 0, 1)) / (1000 * 60 * 60 * 24));
  const remainingDays = 365 - daysPassedThisYear;
  
  const currentPace = readBooks.length / (daysPassedThisYear / 30.44);
  const projectedTotal = Math.round(currentPace * 12);
  const requiredPace = (targetBooks - readBooks.length) / (remainingDays / 30.44);
  
  return {
    currentRead: readBooks.length,
    currentPace: Number(currentPace.toFixed(1)),
    projectedTotal,
    targetBooks,
    onTrack: projectedTotal >= targetBooks,
    requiredPace: Number(requiredPace.toFixed(1)),
    remainingBooks: Math.max(0, targetBooks - readBooks.length),
    percentageComplete: (readBooks.length / targetBooks * 100),
    daysRemaining: remainingDays
  };
};

export const calculateCategoryTrendAnalysis = (books) => {
  if (!books || books.length === 0) return {};
  
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  
  const currentYearBooks = books.filter(book => 
    book.timestamp && book.timestamp.toDate().getFullYear() === currentYear
  );
  
  const lastYearBooks = books.filter(book => 
    book.timestamp && book.timestamp.toDate().getFullYear() === lastYear
  );
  
  const currentYearCategories = {};
  const lastYearCategories = {};
  
  currentYearBooks.forEach(book => {
    const category = book.category || 'その他';
    currentYearCategories[category] = (currentYearCategories[category] || 0) + 1;
  });
  
  lastYearBooks.forEach(book => {
    const category = book.category || 'その他';
    lastYearCategories[category] = (lastYearCategories[category] || 0) + 1;
  });
  
  const trends = {};
  const allCategories = new Set([...Object.keys(currentYearCategories), ...Object.keys(lastYearCategories)]);
  
  allCategories.forEach(category => {
    const current = currentYearCategories[category] || 0;
    const last = lastYearCategories[category] || 0;
    const change = current - last;
    const percentageChange = last > 0 ? (change / last * 100) : (current > 0 ? 100 : 0);
    
    trends[category] = {
      currentYear: current,
      lastYear: last,
      change,
      percentageChange: Number(percentageChange.toFixed(1)),
      trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable'
    };
  });
  
  return {
    currentYear,
    lastYear,
    trends,
    fastestGrowing: Object.entries(trends)
      .filter(([, data]) => data.change > 0)
      .sort(([, a], [, b]) => b.percentageChange - a.percentageChange)[0]?.[0],
    mostDeclined: Object.entries(trends)
      .filter(([, data]) => data.change < 0)
      .sort(([, a], [, b]) => a.percentageChange - b.percentageChange)[0]?.[0]
  };
};

export const calculateComparisonStats = (books, comparisonYear) => {
  if (!books || books.length === 0) return null;
  
  const currentYear = new Date().getFullYear();
  
  const currentYearBooks = books.filter(book => 
    book.timestamp && book.timestamp.toDate().getFullYear() === currentYear
  );
  
  const comparisonYearBooks = books.filter(book => 
    book.timestamp && book.timestamp.toDate().getFullYear() === comparisonYear
  );
  
  const currentStats = {
    total: currentYearBooks.length,
    read: currentYearBooks.filter(book => book.isRead).length,
    categories: calculateCategoryStats(currentYearBooks)
  };
  
  const comparisonStats = {
    total: comparisonYearBooks.length,
    read: comparisonYearBooks.filter(book => book.isRead).length,
    categories: calculateCategoryStats(comparisonYearBooks)
  };
  
  return {
    currentYear: {
      year: currentYear,
      ...currentStats
    },
    comparisonYear: {
      year: comparisonYear,
      ...comparisonStats
    },
    differences: {
      total: currentStats.total - comparisonStats.total,
      read: currentStats.read - comparisonStats.read,
      totalPercentage: comparisonStats.total > 0 ? 
        ((currentStats.total - comparisonStats.total) / comparisonStats.total * 100) : 0,
      readPercentage: comparisonStats.read > 0 ? 
        ((currentStats.read - comparisonStats.read) / comparisonStats.read * 100) : 0
    }
  };
};

export const calculateReadingStreaks = (books) => {
  if (!books || books.length === 0) return { current: 0, longest: 0, streaks: [] };
  
  const readBooks = books
    .filter(book => book.isRead && book.timestamp)
    .sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
  
  if (readBooks.length === 0) return { current: 0, longest: 0, streaks: [] };
  
  const streaks = [];
  let currentStreak = { start: null, end: null, count: 0 };
  let longestStreak = 0;
  let currentStreakCount = 0;
  
  let previousDate = null;
  
  readBooks.forEach(book => {
    const bookDate = book.timestamp.toDate();
    const dateString = bookDate.toDateString();
    
    if (!previousDate) {
      currentStreak = { start: dateString, end: dateString, count: 1 };
      currentStreakCount = 1;
    } else {
      const daysDiff = Math.floor((bookDate - previousDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) {
        currentStreak.end = dateString;
        currentStreak.count += 1;
        currentStreakCount += 1;
      } else {
        if (currentStreak.count > 1) {
          streaks.push({ ...currentStreak });
        }
        longestStreak = Math.max(longestStreak, currentStreak.count);
        currentStreak = { start: dateString, end: dateString, count: 1 };
        currentStreakCount = 1;
      }
    }
    
    previousDate = bookDate;
  });
  
  if (currentStreak.count > 1) {
    streaks.push({ ...currentStreak });
  }
  longestStreak = Math.max(longestStreak, currentStreak.count);
  
  const today = new Date();
  const lastBookDate = readBooks[readBooks.length - 1].timestamp.toDate();
  const daysSinceLastBook = Math.floor((today - lastBookDate) / (1000 * 60 * 60 * 24));
  
  const isCurrentStreakActive = daysSinceLastBook <= 7;
  
  return {
    current: isCurrentStreakActive ? currentStreakCount : 0,
    longest: longestStreak,
    streaks: streaks.sort((a, b) => b.count - a.count),
    daysSinceLastBook
  };
};

const calculateCategoryStats = (books) => {
  if (!books || books.length === 0) return {};
  
  const categoryCount = {};
  books.forEach(book => {
    const category = book.category || 'その他';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  return categoryCount;
};
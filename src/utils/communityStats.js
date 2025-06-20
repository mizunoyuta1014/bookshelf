export class CommunityStatsManager {
  constructor() {
    this.anonymousData = JSON.parse(localStorage.getItem('anonymousReadingData') || '[]');
    this.userOptedIn = JSON.parse(localStorage.getItem('communityStatsOptIn') || 'false');
  }

  setOptInStatus(optedIn) {
    this.userOptedIn = optedIn;
    localStorage.setItem('communityStatsOptIn', JSON.stringify(optedIn));
    
    if (!optedIn) {
      this.removeUserData();
    }
  }

  getOptInStatus() {
    return this.userOptedIn;
  }

  anonymizeBookData(books) {
    if (!this.userOptedIn || !books || books.length === 0) return null;

    const currentYear = new Date().getFullYear();
    const yearBooks = books.filter(book => 
      book.timestamp && book.timestamp.toDate().getFullYear() === currentYear
    );

    const anonymizedData = {
      id: this.generateAnonymousId(),
      year: currentYear,
      totalBooks: yearBooks.length,
      readBooks: yearBooks.filter(book => book.isRead).length,
      categories: this.anonymizeCategories(yearBooks),
      monthlyDistribution: this.getMonthlyDistribution(yearBooks),
      readingPace: this.calculateReadingPace(yearBooks),
      lastUpdated: new Date().toISOString(),
      userSegment: this.determineUserSegment(yearBooks)
    };

    return anonymizedData;
  }

  anonymizeCategories(books) {
    const categoryCount = {};
    books.forEach(book => {
      const category = book.category || 'その他';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [category, count]) => {
        obj[category] = count;
        return obj;
      }, {});
  }

  getMonthlyDistribution(books) {
    const monthlyData = Array(12).fill(0);
    
    books.forEach(book => {
      if (book.timestamp) {
        const month = book.timestamp.toDate().getMonth();
        monthlyData[month]++;
      }
    });

    return monthlyData;
  }

  calculateReadingPace(books) {
    const readBooks = books.filter(book => book.isRead);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    
    return currentMonth > 0 ? Math.round((readBooks.length / currentMonth) * 10) / 10 : 0;
  }

  determineUserSegment(books) {
    const readBooks = books.filter(book => book.isRead).length;
    
    if (readBooks >= 50) return 'heavy_reader';
    if (readBooks >= 25) return 'moderate_reader';
    if (readBooks >= 10) return 'light_reader';
    if (readBooks >= 1) return 'casual_reader';
    return 'new_user';
  }

  generateAnonymousId() {
    const existingId = localStorage.getItem('anonymousUserId');
    if (existingId) return existingId;
    
    const id = 'anon_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('anonymousUserId', id);
    return id;
  }

  saveUserData(books) {
    if (!this.userOptedIn) return;

    const anonymizedData = this.anonymizeBookData(books);
    if (!anonymizedData) return;

    let communityData = JSON.parse(localStorage.getItem('communityReadingStats') || '[]');
    
    const existingIndex = communityData.findIndex(data => data.id === anonymizedData.id);
    if (existingIndex >= 0) {
      communityData[existingIndex] = anonymizedData;
    } else {
      communityData.push(anonymizedData);
    }

    localStorage.setItem('communityReadingStats', JSON.stringify(communityData));
  }

  removeUserData() {
    const anonymousId = localStorage.getItem('anonymousUserId');
    if (!anonymousId) return;

    let communityData = JSON.parse(localStorage.getItem('communityReadingStats') || '[]');
    communityData = communityData.filter(data => data.id !== anonymousId);
    localStorage.setItem('communityReadingStats', JSON.stringify(communityData));
  }

  getCommunityStats() {
    const communityData = JSON.parse(localStorage.getItem('communityReadingStats') || '[]');
    const currentYear = new Date().getFullYear();
    
    const yearData = communityData.filter(data => data.year === currentYear);
    
    if (yearData.length === 0) {
      return this.getDefaultCommunityStats();
    }

    return {
      totalUsers: yearData.length,
      averageBooks: this.calculateAverage(yearData, 'totalBooks'),
      averageReadBooks: this.calculateAverage(yearData, 'readBooks'),
      popularCategories: this.getPopularCategories(yearData),
      userSegments: this.getUserSegmentDistribution(yearData),
      monthlyTrends: this.getCommunityMonthlyTrends(yearData),
      topPerformers: this.getTopPerformers(yearData),
      readingPaceDistribution: this.getReadingPaceDistribution(yearData)
    };
  }

  calculateAverage(data, field) {
    if (data.length === 0) return 0;
    const sum = data.reduce((total, item) => total + (item[field] || 0), 0);
    return Math.round((sum / data.length) * 10) / 10;
  }

  getPopularCategories(data) {
    const categoryTotals = {};
    
    data.forEach(user => {
      Object.entries(user.categories || {}).forEach(([category, count]) => {
        categoryTotals[category] = (categoryTotals[category] || 0) + count;
      });
    });

    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / data.length) * 100)
      }));
  }

  getUserSegmentDistribution(data) {
    const segments = {};
    
    data.forEach(user => {
      const segment = user.userSegment || 'new_user';
      segments[segment] = (segments[segment] || 0) + 1;
    });

    const total = data.length;
    return Object.entries(segments).map(([segment, count]) => ({
      segment,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }

  getCommunityMonthlyTrends(data) {
    const monthlyTotals = Array(12).fill(0);
    
    data.forEach(user => {
      if (user.monthlyDistribution) {
        user.monthlyDistribution.forEach((count, month) => {
          monthlyTotals[month] += count;
        });
      }
    });

    return monthlyTotals.map(total => Math.round((total / data.length) * 10) / 10);
  }

  getTopPerformers(data) {
    return data
      .sort((a, b) => (b.readBooks || 0) - (a.readBooks || 0))
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        id: user.id.substr(-4),
        readBooks: user.readBooks || 0,
        totalBooks: user.totalBooks || 0,
        readingPace: user.readingPace || 0,
        segment: user.userSegment || 'new_user'
      }));
  }

  getReadingPaceDistribution(data) {
    const paces = data.map(user => user.readingPace || 0).filter(pace => pace > 0);
    
    if (paces.length === 0) return { min: 0, max: 0, average: 0, median: 0 };
    
    paces.sort((a, b) => a - b);
    
    return {
      min: paces[0],
      max: paces[paces.length - 1],
      average: Math.round((paces.reduce((a, b) => a + b, 0) / paces.length) * 10) / 10,
      median: paces.length % 2 === 0 
        ? (paces[paces.length / 2 - 1] + paces[paces.length / 2]) / 2
        : paces[Math.floor(paces.length / 2)]
    };
  }

  getDefaultCommunityStats() {
    return {
      totalUsers: 1247,
      averageBooks: 28.4,
      averageReadBooks: 22.1,
      popularCategories: [
        { category: '小説', count: 856, percentage: 32 },
        { category: 'ビジネス書', count: 634, percentage: 24 },
        { category: '技術書', count: 423, percentage: 16 },
        { category: '自己啓発', count: 312, percentage: 12 },
        { category: '歴史', count: 267, percentage: 10 }
      ],
      userSegments: [
        { segment: 'light_reader', count: 423, percentage: 34 },
        { segment: 'moderate_reader', count: 387, percentage: 31 },
        { segment: 'heavy_reader', count: 234, percentage: 19 },
        { segment: 'casual_reader', count: 156, percentage: 13 },
        { segment: 'new_user', count: 47, percentage: 3 }
      ],
      monthlyTrends: [2.1, 2.8, 3.2, 2.9, 2.4, 1.8, 1.9, 2.3, 3.1, 3.4, 2.7, 2.2],
      topPerformers: [
        { rank: 1, id: '7f8a', readBooks: 127, totalBooks: 134, readingPace: 10.6, segment: 'heavy_reader' },
        { rank: 2, id: '3c9d', readBooks: 98, totalBooks: 103, readingPace: 8.2, segment: 'heavy_reader' },
        { rank: 3, id: '5b2e', readBooks: 89, totalBooks: 95, readingPace: 7.4, segment: 'heavy_reader' }
      ],
      readingPaceDistribution: {
        min: 0.1,
        max: 12.4,
        average: 2.8,
        median: 2.3
      }
    };
  }

  compareWithCommunity(userBooks) {
    const communityStats = this.getCommunityStats();
    const currentYear = new Date().getFullYear();
    
    const userYearBooks = userBooks.filter(book => 
      book.timestamp && book.timestamp.toDate().getFullYear() === currentYear
    );
    
    const userReadBooks = userYearBooks.filter(book => book.isRead).length;
    const userTotalBooks = userYearBooks.length;
    const userPace = this.calculateReadingPace(userYearBooks);
    
    const readBooksPercentile = this.calculatePercentile(userReadBooks, communityStats.averageReadBooks);
    const totalBooksPercentile = this.calculatePercentile(userTotalBooks, communityStats.averageBooks);
    const pacePercentile = this.calculatePercentile(userPace, communityStats.readingPaceDistribution.average);

    return {
      user: {
        readBooks: userReadBooks,
        totalBooks: userTotalBooks,
        pace: userPace
      },
      community: {
        averageReadBooks: communityStats.averageReadBooks,
        averageBooks: communityStats.averageBooks,
        averagePace: communityStats.readingPaceDistribution.average
      },
      comparison: {
        readBooksRank: readBooksPercentile,
        totalBooksRank: totalBooksPercentile,
        paceRank: pacePercentile,
        overallRank: Math.round((readBooksPercentile + totalBooksPercentile + pacePercentile) / 3)
      },
      insights: this.generateComparisonInsights(readBooksPercentile, totalBooksPercentile, pacePercentile)
    };
  }

  calculatePercentile(userValue, communityAverage) {
    if (communityAverage === 0) return 50;
    
    const ratio = userValue / communityAverage;
    
    if (ratio >= 2.0) return 95;
    if (ratio >= 1.5) return 85;
    if (ratio >= 1.2) return 75;
    if (ratio >= 1.0) return 65;
    if (ratio >= 0.8) return 50;
    if (ratio >= 0.6) return 35;
    if (ratio >= 0.4) return 25;
    if (ratio >= 0.2) return 15;
    return 5;
  }

  generateComparisonInsights(readPercentile, totalPercentile, pacePercentile) {
    const insights = [];

    if (readPercentile >= 80) {
      insights.push('あなたは読書完了率が非常に高いです！');
    } else if (readPercentile >= 60) {
      insights.push('読書完了率は平均以上です');
    } else if (readPercentile < 40) {
      insights.push('読書完了率を改善する余地があります');
    }

    if (pacePercentile >= 80) {
      insights.push('読書ペースが素晴らしいです！');
    } else if (pacePercentile < 40) {
      insights.push('読書ペースを上げることを検討してみてください');
    }

    if (totalPercentile >= 80 && readPercentile < 60) {
      insights.push('本をたくさん追加していますが、読了率の向上に集中しても良いかもしれません');
    }

    if (insights.length === 0) {
      insights.push('バランスの取れた読書習慣を続けています');
    }

    return insights;
  }

  getBookRecommendationsFromCommunity() {
    const communityStats = this.getCommunityStats();
    
    return {
      popularBooks: this.generatePopularBooksList(),
      trendingCategories: communityStats.popularCategories.slice(0, 5),
      seasonalRecommendations: this.getSeasonalRecommendations()
    };
  }

  generatePopularBooksList() {
    return [
      { title: 'ファクトフルネス', author: 'ハンス・ロスリング', category: 'ビジネス書', popularity: 87 },
      { title: '嫌われる勇気', author: '岸見一郎', category: '自己啓発', popularity: 82 },
      { title: 'サピエンス全史', author: 'ユヴァル・ノア・ハラリ', category: '歴史', popularity: 79 },
      { title: '1984年', author: 'ジョージ・オーウェル', category: '小説', popularity: 76 },
      { title: 'クリーンアーキテクチャ', author: 'ロバート・C・マーチン', category: '技術書', popularity: 74 }
    ];
  }

  getSeasonalRecommendations() {
    const month = new Date().getMonth() + 1;
    
    if (month >= 3 && month <= 5) {
      return { season: '春', theme: '新生活・成長', categories: ['自己啓発', 'ビジネス書'] };
    } else if (month >= 6 && month <= 8) {
      return { season: '夏', theme: '冒険・旅行', categories: ['小説', '紀行文'] };
    } else if (month >= 9 && month <= 11) {
      return { season: '秋', theme: '学習・深掘り', categories: ['技術書', '歴史'] };
    } else {
      return { season: '冬', theme: '内省・哲学', categories: ['哲学', '小説'] };
    }
  }
}

export const communityStatsManager = new CommunityStatsManager();
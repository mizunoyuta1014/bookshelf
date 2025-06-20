export class RecommendationEngine {
  constructor() {
    this.weights = {
      category: 0.4,
      author: 0.3,
      readingHistory: 0.2,
      recentActivity: 0.1
    };
  }

  generateRecommendations(userBooks, allBooks = [], options = {}) {
    const {
      maxRecommendations = 5,
      excludeRead = true,
      userId
    } = options;

    if (!userBooks || userBooks.length === 0) {
      return this.getPopularRecommendations(allBooks, maxRecommendations);
    }

    const userProfile = this.buildUserProfile(userBooks);
    const recommendations = this.calculateRecommendations(userProfile, allBooks, userBooks);
    
    let filteredRecommendations = recommendations;
    
    if (excludeRead) {
      const readBooks = new Set(userBooks.map(book => book.title?.toLowerCase()));
      filteredRecommendations = recommendations.filter(
        rec => !readBooks.has(rec.title?.toLowerCase())
      );
    }

    const finalRecommendations = filteredRecommendations
      .slice(0, maxRecommendations)
      .map(rec => ({
        ...rec,
        reasons: this.generateReasons(rec, userProfile)
      }));

    this.saveUserBehavior(userId, userProfile, finalRecommendations);
    
    return finalRecommendations;
  }

  buildUserProfile(userBooks) {
    const profile = {
      favoriteCategories: {},
      favoriteAuthors: {},
      readingPatterns: {},
      recentBooks: []
    };

    userBooks.forEach(book => {
      if (book.category) {
        profile.favoriteCategories[book.category] = 
          (profile.favoriteCategories[book.category] || 0) + 1;
      }

      if (book.author) {
        profile.favoriteAuthors[book.author] = 
          (profile.favoriteAuthors[book.author] || 0) + 1;
      }

      if (book.timestamp) {
        const date = book.timestamp.toDate ? book.timestamp.toDate() : new Date(book.timestamp);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        profile.readingPatterns[monthKey] = 
          (profile.readingPatterns[monthKey] || 0) + 1;
      }
    });

    profile.recentBooks = userBooks
      .filter(book => book.timestamp)
      .sort((a, b) => {
        const dateA = a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
        const dateB = b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
        return dateB - dateA;
      })
      .slice(0, 10);

    return profile;
  }

  calculateRecommendations(userProfile, allBooks, userBooks) {
    const userBookTitles = new Set(userBooks.map(book => book.title?.toLowerCase()));
    
    return allBooks
      .filter(book => !userBookTitles.has(book.title?.toLowerCase()))
      .map(book => {
        const score = this.calculateBookScore(book, userProfile);
        return {
          ...book,
          recommendationScore: score
        };
      })
      .filter(book => book.recommendationScore > 0)
      .sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  calculateBookScore(book, userProfile) {
    let score = 0;

    if (book.category && userProfile.favoriteCategories[book.category]) {
      const categoryFrequency = userProfile.favoriteCategories[book.category];
      const totalBooks = Object.values(userProfile.favoriteCategories).reduce((a, b) => a + b, 0);
      score += (categoryFrequency / totalBooks) * this.weights.category;
    }

    if (book.author && userProfile.favoriteAuthors[book.author]) {
      const authorFrequency = userProfile.favoriteAuthors[book.author];
      const totalAuthors = Object.values(userProfile.favoriteAuthors).reduce((a, b) => a + b, 0);
      score += (authorFrequency / totalAuthors) * this.weights.author;
    }

    const historySimilarity = this.calculateHistorySimilarity(book, userProfile.recentBooks);
    score += historySimilarity * this.weights.readingHistory;

    const recentActivityBonus = this.calculateRecentActivityBonus(book, userProfile);
    score += recentActivityBonus * this.weights.recentActivity;

    return Math.min(score, 1.0);
  }

  calculateHistorySimilarity(book, recentBooks) {
    if (!recentBooks || recentBooks.length === 0) return 0;

    let similarity = 0;
    const bookKeywords = this.extractKeywords(book);
    
    recentBooks.forEach(recentBook => {
      const recentKeywords = this.extractKeywords(recentBook);
      const commonKeywords = bookKeywords.filter(keyword => 
        recentKeywords.includes(keyword)
      );
      similarity += commonKeywords.length / Math.max(bookKeywords.length, recentKeywords.length);
    });

    return similarity / recentBooks.length;
  }

  extractKeywords(book) {
    const keywords = [];
    
    if (book.title) {
      keywords.push(...book.title.toLowerCase().split(/\s+/));
    }
    if (book.author) {
      keywords.push(...book.author.toLowerCase().split(/\s+/));
    }
    if (book.category) {
      keywords.push(book.category.toLowerCase());
    }

    return keywords.filter(keyword => keyword.length > 2);
  }

  calculateRecentActivityBonus(book, userProfile) {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${now.getMonth()}`;
    const lastMonth = `${now.getFullYear()}-${now.getMonth() - 1}`;
    
    const recentActivity = (userProfile.readingPatterns[thisMonth] || 0) + 
                          (userProfile.readingPatterns[lastMonth] || 0);
    
    return Math.min(recentActivity / 10, 0.3);
  }

  generateReasons(recommendation, userProfile) {
    const reasons = [];

    if (recommendation.category && userProfile.favoriteCategories[recommendation.category]) {
      const count = userProfile.favoriteCategories[recommendation.category];
      reasons.push(`「${recommendation.category}」カテゴリを${count}冊読んでいるため`);
    }

    if (recommendation.author && userProfile.favoriteAuthors[recommendation.author]) {
      const count = userProfile.favoriteAuthors[recommendation.author];
      reasons.push(`${recommendation.author}の作品を${count}冊読んでいるため`);
    }

    const topCategory = Object.entries(userProfile.favoriteCategories)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory && recommendation.category === topCategory[0] && reasons.length === 0) {
      reasons.push(`最も読んでいるカテゴリ「${topCategory[0]}」の作品`);
    }

    if (reasons.length === 0) {
      reasons.push('あなたの読書傾向に基づく推薦');
    }

    return reasons.slice(0, 2);
  }

  getPopularRecommendations(allBooks, maxRecommendations) {
    const popularBooks = [
      {
        title: "人工知能は人間を超えるか",
        author: "松尾豊",
        category: "データ分析",
        recommendationScore: 0.9,
        reasons: ["AI・データ分析分野の入門書として人気"]
      },
      {
        title: "イシューからはじめよ",
        author: "安宅和人",
        category: "ビジネス",
        recommendationScore: 0.8,
        reasons: ["問題解決の基本が学べる定番書"]
      },
      {
        title: "Clean Code",
        author: "Robert C. Martin",
        category: "インフラ",
        recommendationScore: 0.8,
        reasons: ["プログラミングの基礎として必読"]
      },
      {
        title: "ストーリーとしての競争戦略",
        author: "楠木建",
        category: "コンサル",
        recommendationScore: 0.7,
        reasons: ["戦略思考の入門書として推薦"]
      },
      {
        title: "FACTFULNESS",
        author: "ハンス・ロスリング",
        category: "その他",
        recommendationScore: 0.7,
        reasons: ["データに基づく思考法が学べる"]
      }
    ];

    return popularBooks.slice(0, maxRecommendations);
  }

  saveUserBehavior(userId, userProfile, recommendations) {
    if (!userId) return;

    try {
      const behaviorData = {
        userId,
        timestamp: new Date().toISOString(),
        profile: {
          topCategories: Object.entries(userProfile.favoriteCategories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([category, count]) => ({ category, count })),
          topAuthors: Object.entries(userProfile.favoriteAuthors)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([author, count]) => ({ author, count })),
          totalBooks: Object.values(userProfile.favoriteCategories).reduce((a, b) => a + b, 0)
        },
        recommendations: recommendations.map(rec => ({
          title: rec.title,
          author: rec.author,
          category: rec.category,
          score: rec.recommendationScore
        }))
      };

      const existingData = localStorage.getItem(`userBehavior_${userId}`);
      const allBehaviorData = existingData ? JSON.parse(existingData) : [];
      
      allBehaviorData.push(behaviorData);
      
      if (allBehaviorData.length > 50) {
        allBehaviorData.splice(0, allBehaviorData.length - 50);
      }

      localStorage.setItem(`userBehavior_${userId}`, JSON.stringify(allBehaviorData));
    } catch (error) {
      console.warn('Failed to save user behavior data:', error);
    }
  }

  getUserBehaviorHistory(userId) {
    if (!userId) return [];

    try {
      const data = localStorage.getItem(`userBehavior_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Failed to load user behavior data:', error);
      return [];
    }
  }

  updateRecommendationFeedback(userId, bookTitle, feedback) {
    try {
      const feedbackKey = `feedback_${userId}`;
      const existingFeedback = localStorage.getItem(feedbackKey);
      const allFeedback = existingFeedback ? JSON.parse(existingFeedback) : {};
      
      allFeedback[bookTitle] = {
        feedback,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(feedbackKey, JSON.stringify(allFeedback));
      
      if (feedback === 'positive') {
        this.adjustWeights(userId, 'increase');
      } else if (feedback === 'negative') {
        this.adjustWeights(userId, 'decrease');
      }
    } catch (error) {
      console.warn('Failed to save recommendation feedback:', error);
    }
  }

  adjustWeights(userId, direction) {
    const adjustmentFactor = direction === 'increase' ? 1.05 : 0.95;
    
    Object.keys(this.weights).forEach(key => {
      this.weights[key] *= adjustmentFactor;
    });

    const total = Object.values(this.weights).reduce((a, b) => a + b, 0);
    Object.keys(this.weights).forEach(key => {
      this.weights[key] /= total;
    });
  }
}

export const recommendationEngine = new RecommendationEngine();
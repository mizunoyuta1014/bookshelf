export const calculateCategoryStats = (books) => {
  if (!books || books.length === 0) return {};
  
  const categoryCount = {};
  books.forEach(book => {
    const category = book.category || 'その他';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  return categoryCount;
};

export const calculateReadingProgress = (books, targetBooks = 40) => {
  if (!books || books.length === 0) {
    return {
      totalBooks: 0,
      readBooks: 0,
      unreadBooks: 0,
      ownedBooks: 0,
      progressPercentage: 0,
      targetBooks,
      remainingBooks: targetBooks
    };
  }
  
  const totalBooks = books.length;
  const readBooks = books.filter(book => book.isRead).length;
  const unreadBooks = totalBooks - readBooks;
  const ownedBooks = books.filter(book => book.isOwned).length;
  const progressPercentage = Math.round((totalBooks / targetBooks) * 100);
  const remainingBooks = Math.max(0, targetBooks - totalBooks);
  
  return {
    totalBooks,
    readBooks,
    unreadBooks,
    ownedBooks,
    progressPercentage,
    targetBooks,
    remainingBooks
  };
};

export const calculateMonthlyStats = (books) => {
  if (!books || books.length === 0) return {};
  
  const monthlyData = {};
  
  books.forEach(book => {
    if (book.timestamp) {
      const date = book.timestamp.toDate();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}/${month.toString().padStart(2, '0')}`;
      
      if (!monthlyData[key]) {
        monthlyData[key] = {
          total: 0,
          read: 0,
          owned: 0
        };
      }
      
      monthlyData[key].total += 1;
      if (book.isRead) monthlyData[key].read += 1;
      if (book.isOwned) monthlyData[key].owned += 1;
    }
  });
  
  return monthlyData;
};

export const calculateReadingPace = (books) => {
  if (!books || books.length === 0) return 0;
  
  const readBooks = books.filter(book => book.isRead && book.timestamp);
  if (readBooks.length === 0) return 0;
  
  const sortedBooks = readBooks.sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
  const firstBook = sortedBooks[0].timestamp.toDate();
  const lastBook = sortedBooks[sortedBooks.length - 1].timestamp.toDate();
  
  const monthsDiff = (lastBook.getFullYear() - firstBook.getFullYear()) * 12 + 
                    (lastBook.getMonth() - firstBook.getMonth()) || 1;
  
  return Number((readBooks.length / monthsDiff).toFixed(1));
};

export const getTopCategories = (books, limit = 5) => {
  const categoryStats = calculateCategoryStats(books);
  
  return Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([category, count]) => ({ category, count }));
};

export const calculateCompletionRate = (books) => {
  if (!books || books.length === 0) return 0;
  
  const readBooks = books.filter(book => book.isRead).length;
  return Number(((readBooks / books.length) * 100).toFixed(1));
};

export const getRecentBooks = (books, limit = 5) => {
  if (!books || books.length === 0) return [];
  
  return books
    .filter(book => book.timestamp)
    .sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())
    .slice(0, limit);
};
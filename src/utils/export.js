export const exportToCSV = (books, filename = 'books.csv') => {
  if (!books || books.length === 0) {
    alert('エクスポートするデータがありません。');
    return;
  }

  const headers = ['書名', '著者', '保管場所', 'カテゴリ', '読了状況', '所有状況', '登録日'];
  
  const csvData = books.map(book => [
    book.bookTitle || '',
    book.author || '',
    book.bookPlace || '',
    book.category || '',
    book.isRead ? '読了' : '未読',
    book.isOwned ? '所有' : '未所有',
    book.timestamp ? formatDateForCSV(book.timestamp) : ''
  ]);

  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportStatisticsToCSV = (statistics, year, filename = `reading_statistics_${year}.csv`) => {
  if (!statistics) {
    alert('エクスポートする統計データがありません。');
    return;
  }

  const headers = ['項目', '値', '詳細'];
  const data = [
    ['年間目標達成率', `${statistics.readingProgress.progressPercentage}%`, `${statistics.readingProgress.totalBooks}/${statistics.readingProgress.targetBooks}冊`],
    ['総登録数', `${statistics.readingProgress.totalBooks}冊`, ''],
    ['読了数', `${statistics.readingProgress.readBooks}冊`, ''],
    ['未読数', `${statistics.readingProgress.unreadBooks}冊`, ''],
    ['所有数', `${statistics.readingProgress.ownedBooks}冊`, ''],
    ['読了率', `${statistics.completionRate}%`, ''],
    ['月平均読書ペース', `${statistics.readingPace}冊/月`, ''],
    ['', '', ''],
    ['カテゴリ別統計', '', ''],
    ...Object.entries(statistics.categoryStats).map(([category, count]) => ['', category, `${count}冊`])
  ];

  const csvContent = [headers, ...data]
    .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToPDF = async (books, year, filename = `reading_list_${year}.pdf`) => {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.addFont('NotoSansJP-Regular.ttf', 'NotoSansJP', 'normal');
    doc.setFont('NotoSansJP');
    
    doc.setFontSize(16);
    doc.text(`${year}年読書記録`, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`総登録数: ${books.length}冊`, 20, 35);
    doc.text(`読了数: ${books.filter(book => book.isRead).length}冊`, 20, 45);
    doc.text(`所有数: ${books.filter(book => book.isOwned).length}冊`, 20, 55);
    
    let yPosition = 70;
    
    books.forEach((book, index) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.setFontSize(10);
      doc.text(`${index + 1}. ${book.bookTitle || '不明'}`, 20, yPosition);
      yPosition += 10;
      doc.text(`   著者: ${book.author || '不明'}`, 20, yPosition);
      yPosition += 8;
      doc.text(`   カテゴリ: ${book.category || '不明'} | 読了: ${book.isRead ? 'はい' : 'いいえ'} | 所有: ${book.isOwned ? 'はい' : 'いいえ'}`, 20, yPosition);
      yPosition += 15;
    });

    doc.save(filename);
  } catch (error) {
    console.error('PDF作成エラー:', error);
    alert('PDFの作成に失敗しました。代わりにCSVエクスポートを試してください。');
  }
};

const formatDateForCSV = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return '';
  
  const date = timestamp.toDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
};
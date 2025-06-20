-- ========================================
-- Supabase データベーススキーマ設計
-- 作成日: 2025年6月19日
-- ========================================

-- Users テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books テーブル
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_title VARCHAR(500) NOT NULL,
  author VARCHAR(300),
  book_place VARCHAR(100),
  category VARCHAR(100),
  is_read BOOLEAN DEFAULT FALSE,
  is_owned BOOLEAN DEFAULT FALSE,
  year INTEGER NOT NULL,
  memo TEXT,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist テーブル
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  authors TEXT[],
  description TEXT,
  google_books_id VARCHAR(100),
  image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Preferences テーブル
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'ja',
  export_format VARCHAR(10) DEFAULT 'csv',
  reading_goal_yearly INTEGER DEFAULT 40,
  reading_goal_monthly INTEGER DEFAULT 3,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- インデックス作成
-- ========================================

-- Books テーブルのインデックス
CREATE INDEX idx_books_user_year ON books(user_id, year);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_created_at ON books(created_at);
CREATE INDEX idx_books_user_read ON books(user_id, is_read);
CREATE INDEX idx_books_user_owned ON books(user_id, is_owned);

-- Wishlist テーブルのインデックス
CREATE INDEX idx_wishlist_user ON wishlist(user_id);
CREATE INDEX idx_wishlist_created_at ON wishlist(created_at);

-- Users テーブルのインデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ========================================
-- Row Level Security (RLS) 有効化
-- ========================================

-- Users テーブルのRLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Books テーブルのRLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Wishlist テーブルのRLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- User Preferences テーブルのRLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ========================================
-- セキュリティポリシー作成
-- ========================================

-- Users テーブルのポリシー
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Books テーブルのポリシー
CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books" ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (auth.uid() = user_id);

-- Wishlist テーブルのポリシー
CREATE POLICY "Users can view own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to own wishlist" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlist" ON wishlist
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own wishlist" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- User Preferences テーブルのポリシー
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- 関数作成
-- ========================================

-- ユーザー作成時の自動プリファレンス設定
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users テーブルにトリガー設定
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();

-- Updated_at 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at トリガー設定
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 初期データ投入（オプション）
-- ========================================

-- カテゴリマスタ用のEnum（将来的に使用）
-- CREATE TYPE book_category AS ENUM (
--   'データ分析',
--   'インフラ',
--   'ビジネス',
--   'コンサル',
--   'プログラミング',
--   '小説',
--   '実用書',
--   'その他'
-- );

-- 保管場所用のEnum（将来的に使用）
-- CREATE TYPE book_place AS ENUM (
--   '自宅',
--   '電子書籍',
--   'オフィス',
--   '図書館',
--   'その他'
-- );

-- ========================================
-- 統計用ビュー作成
-- ========================================

-- 年度別統計ビュー
CREATE VIEW yearly_stats AS
SELECT 
  b.user_id,
  b.year,
  COUNT(*) as total_books,
  COUNT(*) FILTER (WHERE b.is_read = true) as read_books,
  COUNT(*) FILTER (WHERE b.is_owned = true) as owned_books,
  COUNT(DISTINCT b.category) as categories_count,
  COUNT(DISTINCT b.author) as authors_count,
  AVG(b.rating) FILTER (WHERE b.rating IS NOT NULL) as avg_rating
FROM books b
GROUP BY b.user_id, b.year;

-- カテゴリ別統計ビュー
CREATE VIEW category_stats AS
SELECT 
  b.user_id,
  b.year,
  b.category,
  COUNT(*) as book_count,
  COUNT(*) FILTER (WHERE b.is_read = true) as read_count,
  AVG(b.rating) FILTER (WHERE b.rating IS NOT NULL) as avg_rating
FROM books b
WHERE b.category IS NOT NULL
GROUP BY b.user_id, b.year, b.category;

-- 月別統計ビュー
CREATE VIEW monthly_stats AS
SELECT 
  b.user_id,
  b.year,
  EXTRACT(MONTH FROM b.created_at) as month,
  COUNT(*) as books_added,
  COUNT(*) FILTER (WHERE b.is_read = true) as books_read
FROM books b
GROUP BY b.user_id, b.year, EXTRACT(MONTH FROM b.created_at);

-- ========================================
-- パフォーマンス最適化
-- ========================================

-- 統計情報更新
ANALYZE users;
ANALYZE books;
ANALYZE wishlist;
ANALYZE user_preferences;

-- ========================================
-- セキュリティ設定確認
-- ========================================

-- RLS設定確認クエリ
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = true;

-- ポリシー確認クエリ
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public';

-- 完了通知
SELECT 'Supabase schema setup completed successfully!' as message;
-- ========================================
-- Supabase RPC Functions
-- ユーザー作成時のRLSポリシー競合状態を修正
-- ========================================

-- ensure_user_exists RPC関数
-- 認証とデータベース挿入のタイミング問題を解決
CREATE OR REPLACE FUNCTION ensure_user_exists(
  user_id UUID,
  user_email VARCHAR,
  user_display_name VARCHAR DEFAULT NULL,
  user_avatar_url VARCHAR DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  user_exists BOOLEAN;
BEGIN
  -- ユーザーの存在確認
  SELECT EXISTS(
    SELECT 1 FROM users WHERE id = user_id
  ) INTO user_exists;
  
  -- ユーザーが存在しない場合のみ作成
  IF NOT user_exists THEN
    -- トランザクション内でユーザーとプリファレンスを作成
    BEGIN
      -- usersテーブルに挿入
      INSERT INTO users (id, email, display_name, avatar_url)
      VALUES (user_id, user_email, user_display_name, user_avatar_url);
      
      -- user_preferencesテーブルに挿入（トリガーで自動作成されるが、明示的に実行）
      INSERT INTO user_preferences (user_id)
      VALUES (user_id)
      ON CONFLICT (user_id) DO NOTHING;
      
      result := json_build_object(
        'success', true,
        'message', 'User created successfully',
        'user_id', user_id,
        'created', true
      );
      
    EXCEPTION
      WHEN unique_violation THEN
        -- 重複キーエラーの場合（競合状態で他のセッションが先に作成した場合）
        result := json_build_object(
          'success', true,
          'message', 'User already exists',
          'user_id', user_id,
          'created', false
        );
      WHEN OTHERS THEN
        -- その他のエラー
        result := json_build_object(
          'success', false,
          'message', 'Error creating user: ' || SQLERRM,
          'user_id', user_id,
          'created', false
        );
    END;
  ELSE
    -- ユーザーが既に存在する場合
    result := json_build_object(
      'success', true,
      'message', 'User already exists',
      'user_id', user_id,
      'created', false
    );
  END IF;
  
  RETURN result;
END;
$$;

-- ========================================
-- セキュリティ最適化のためのRPC関数
-- ========================================

-- ユーザー統計情報取得関数
CREATE OR REPLACE FUNCTION get_user_statistics(
  target_user_id UUID DEFAULT NULL,
  target_year INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  stats JSON;
BEGIN
  -- 現在のユーザーIDを取得
  current_user_id := auth.uid();
  
  -- ユーザーIDが指定されていない場合は現在のユーザーを使用
  IF target_user_id IS NULL THEN
    target_user_id := current_user_id;
  END IF;
  
  -- 権限チェック：自分の統計のみ取得可能
  IF current_user_id != target_user_id THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Unauthorized access to user statistics'
    );
  END IF;
  
  -- 統計情報を取得
  SELECT json_build_object(
    'user_id', target_user_id,
    'year', COALESCE(target_year, EXTRACT(YEAR FROM NOW())),
    'total_books', COUNT(*),
    'read_books', COUNT(*) FILTER (WHERE is_read = true),
    'owned_books', COUNT(*) FILTER (WHERE is_owned = true),
    'categories_count', COUNT(DISTINCT category),
    'authors_count', COUNT(DISTINCT author),
    'avg_rating', AVG(rating) FILTER (WHERE rating IS NOT NULL)
  ) INTO stats
  FROM books
  WHERE user_id = target_user_id
    AND (target_year IS NULL OR year = target_year);
  
  RETURN json_build_object(
    'success', true,
    'data', stats
  );
END;
$$;

-- ========================================
-- パフォーマンス最適化のためのRPC関数
-- ========================================

-- 書籍一括操作関数（読了状態の一括更新など）
CREATE OR REPLACE FUNCTION bulk_update_books(
  book_ids UUID[],
  updates JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  update_count INTEGER;
BEGIN
  -- 現在のユーザーIDを取得
  current_user_id := auth.uid();
  
  -- 権限チェック：指定された書籍が全て現在のユーザーのものかチェック
  IF EXISTS(
    SELECT 1 FROM books 
    WHERE id = ANY(book_ids) 
    AND user_id != current_user_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Unauthorized access to books'
    );
  END IF;
  
  -- 一括更新実行
  UPDATE books 
  SET 
    is_read = COALESCE((updates->>'is_read')::BOOLEAN, is_read),
    is_owned = COALESCE((updates->>'is_owned')::BOOLEAN, is_owned),
    rating = COALESCE((updates->>'rating')::INTEGER, rating),
    memo = COALESCE(updates->>'memo', memo),
    updated_at = NOW()
  WHERE id = ANY(book_ids)
    AND user_id = current_user_id;
  
  GET DIAGNOSTICS update_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Books updated successfully',
    'updated_count', update_count
  );
END;
$$;

-- ========================================
-- 権限設定
-- ========================================

-- 公開ユーザー（認証済み）がRPC関数を実行できるように設定
GRANT EXECUTE ON FUNCTION ensure_user_exists TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_books TO authenticated;

-- 完了通知
SELECT 'RPC functions created successfully!' as message;
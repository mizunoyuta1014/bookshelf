import React, { useEffect, useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { IoClose } from "react-icons/io5";
import "./Book.css";

const Books = () => {
  const [isPopupOpen, setPopupOpen] = useState(false);

  const [bookTitle, setBookTitle] = useState();
  const [author, setAuthor] = useState();
  const [bookPlace, setbookPlace] = useState();
  const [category, setCategory] = useState();
  const [isRead, setIsRead] = useState(false);
  const [isOwned, setIsOwned] = useState(false);

  const [postList, setPostList] = useState([]);

  const handleAddClick = () => {
    setPopupOpen(true);
  };

  const handleCloseClick = () => {
    setPopupOpen(false);
    setIsRead(false);
    setIsOwned(false);
  };

  const selectBookPlace = (e) => {
    setbookPlace(e.target.value);
  };

  const selectCategory = (e) => {
    setCategory(e.target.value);
  };

  const createPost = async () => {
    if (!bookTitle) {
      alert("書名を入力してください。"); // 例: アラートを表示する
      return; // これ以上の処理を行わない
    }

    await addDoc(collection(db, "booklist"), {
      bookTitle: bookTitle || null,
      author: author || null,
      bookPlace: bookPlace || null,
      category: category || null,
      isRead: isRead,
      isOwned: isOwned,
    });
    handleCloseClick();
  };

  // dbのデータを取得して表示する処理
  // useeffectの第二引数なし：Component生成小屋やstate更新のたびに呼び出し
  useEffect(() => {
    const getPosts = async () => {
      const data = await getDocs(collection(db, "booklist"));
      // console.log(data);
      // console.log(data.docs);
      // console.log(data.docs.map((doc) => ({ doc })));
      // console.log(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      setPostList(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };
    getPosts();
  }, [isPopupOpen]);

  // postListに変更があった場合にしたい処理
  useEffect(() => {
    console.log(postList);
  }, [postList]);

  return (
    <div className="bookpage">
      <p>2024年読書記録</p>
      <div className="add-book">
        <button onClick={handleAddClick} className="add-button">
          追加
        </button>
      </div>

      {/* 表のカラムを作成 */}

      {/* 取得したpostlistを表示 */}
      {postList.map((post) => {
        return (
          <React.Fragment key={post.id}>
            <div className="bookContents"></div>
            <div className="book-name">
              <p>{post.bookTitle}</p>
            </div>
          </React.Fragment>
        );
      })}

      {/* 追加ボタンが押されたら入力フォームが出て、追加を押すとdbに送信される処理 */}
      {isPopupOpen && (
        <>
          <div className="overlay" onClick={handleCloseClick} />
          <div className="add-menu">
            <div className="add-menu-upper">
              <p className="add-title">追加</p>
              <button className="close-button" onClick={handleCloseClick}>
                <IoClose />
              </button>
            </div>
            <ul className="input-info">
              <li>
                <div>書名</div>
                <input
                  type="text"
                  onChange={(e) => setBookTitle(e.target.value)}
                />
              </li>
              <li>
                <div>著者</div>
                <input
                  type="text"
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </li>
              <li>
                <div>保管場所</div>
                <select
                  name="genre"
                  id="genre"
                  onChange={selectBookPlace}
                  defaultValue=""
                >
                  <option value="" disabled>
                    選択してください
                  </option>
                  <option value="home">自宅</option>
                  <option value="electron">電子書籍</option>
                  <option value="other">その他</option>
                </select>
              </li>
              <li>
                <div>カテゴリ</div>
                <select
                  name="genre"
                  onChange={selectCategory}
                  id="getcategorybox"
                  defaultValue=""
                >
                  <option value="" disabled>
                    選択してください
                  </option>
                  <option value="dataanalysis">データ分析</option>
                  <option value="dataAnalysis">インフラ</option>
                  <option value="business">ビジネス</option>
                  <option value="Cons">コンサル</option>
                  <option value="other">その他</option>
                </select>
              </li>
            </ul>
            <form className="check-box" action="#" method="post">
              <label>
                <input
                  type="checkbox"
                  name="readCheckbox"
                  value="read"
                  checked={isRead}
                  onChange={() => setIsRead(!isRead)}
                />
                読了
              </label>
              <label>
                <input
                  type="checkbox"
                  name="ownedCheckbox"
                  value="owned"
                  checked={isOwned}
                  onChange={() => setIsOwned(!isOwned)}
                />
                所有
              </label>
            </form>
            <button className="add-button" onClick={createPost}>
              追加
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Books;

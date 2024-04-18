import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
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

  const [isDbUpdated, setIsDbUpdated] = useState(false);

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
      timestamp: serverTimestamp(),
    });
    handleCloseClick();
  };

  // dbのデータを取得して表示する処理
  // useeffectの第二引数なし：Component生成小屋やstate更新のたびに呼び出し
  useEffect(() => {
    const getPosts = async () => {
      const booksRef = collection(db, "booklist");
      const q = query(booksRef, orderBy("timestamp", "desc"));
      const data = await getDocs(q);
      // console.log(data);
      // console.log(data.docs);
      // console.log(data.docs.map((doc) => ({ doc })));
      // console.log(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      setPostList(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };
    getPosts();
    setIsDbUpdated(false);
  }, [isPopupOpen, isDbUpdated]);

  const deletePost = async (id) => {
    await deleteDoc(doc(db, "booklist", id));
    setIsDbUpdated(true);
  };

  const updateOwned = async (id, isOwnedValue) => {
    const postRef = doc(db, "booklist", id);
    await updateDoc(postRef, {
      isOwned: isOwnedValue,
    });
    setIsDbUpdated(true);
  };

  const updateRead = async (id, isReadValue) => {
    const postRef = doc(db, "booklist", id);
    await updateDoc(postRef, {
      isRead: isReadValue,
    });
    setIsDbUpdated(true);
  };

  const formatDate = (timestamp) => {
    const date = timestamp.toDate();
    const year = date.getFullYear();
    // getMonth()は0から始まるため、1を足す
    const month = date.getMonth() + 1;
    // 月が1桁の場合、先頭に0を追加する
    const formattedMonth = month < 10 ? `0${month}` : month;
    // "2024年4月"のような形式で返す
    return `${year}/${formattedMonth}`;
  };

  return (
    <div className="bookpage">
      <div className="page-title">2024年読書記録</div>
      <div className="total-book-display">
        <p className="total-book-number">{postList.length}</p>
        <p>冊/40冊</p>
      </div>
      <div className="add-book">
        <button onClick={handleAddClick} className="add-button">
          追加
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>
              <div>書名</div>
            </th>
            <th>
              <div>著者</div>
            </th>
            <th>
              <div>保管場所</div>
            </th>
            <th>
              <div>カテゴリ</div>
            </th>
            <th>
              <div>日付</div>
            </th>
            <th>
              <div>所有</div>
            </th>
            <th>
              <div>読了</div>
            </th>
          </tr>
        </thead>

        {/* 取得したpostlistを表示 */}
        <tbody>
          {console.log(postList.length)}
          {postList.map((post) => {
            return (
              <React.Fragment key={post.id}>
                <tr>
                  <td>{post.bookTitle}</td>
                  <td>{post.author}</td>
                  <td>{post.bookPlace}</td>
                  <td>{post.category}</td>
                  <td>{formatDate(post.timestamp)}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={post.isOwned}
                      onChange={(e) => updateOwned(post.id, e.target.checked)}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={post.isRead}
                      onChange={(e) => updateRead(post.id, e.target.checked)}
                    />
                  </td>
                  <td className="button">
                    <button
                      className="delete-book-info"
                      onClick={() => alert("編集機能作成中")}
                    >
                      編集
                    </button>
                  </td>
                  <td className="button">
                    <button
                      className="delete-book-info"
                      onClick={() => deletePost(post.id)}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

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
                  className="input-book-title"
                  type="text"
                  onChange={(e) => setBookTitle(e.target.value)}
                />
              </li>
              <li>
                <div>著者</div>
                <input
                  className="input-author"
                  type="text"
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </li>
              <li>
                <div>保管場所</div>
                <select
                  className="input-place"
                  name="genre"
                  id="genre"
                  onChange={selectBookPlace}
                  defaultValue=""
                >
                  <option value="" disabled>
                    選択してください
                  </option>
                  <option value="自宅">自宅</option>
                  <option value="電子書籍">電子書籍</option>
                  <option value="その他">その他</option>
                </select>
              </li>
              <li>
                <div>カテゴリ</div>
                <select
                  className="input-category"
                  name="genre"
                  onChange={selectCategory}
                  id="getcategorybox"
                  defaultValue=""
                >
                  <option value="" disabled>
                    選択してください
                  </option>
                  <option value="データ分析">データ分析</option>
                  <option value="インフラ">インフラ</option>
                  <option value="ビジネス">ビジネス</option>
                  <option value="コアコン">コンサル</option>
                  <option value="その他">その他</option>
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

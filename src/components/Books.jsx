import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import "./Book.css";

const Books = () => {
  const [isPopupOpen, setPopupOpen] = useState(false);

  const [bookTitle, setBookTitle] = useState();
  const [author, setAuthor] = useState();
  const [bookPlace, setbookPlace] = useState();
  const [category, setCategory] = useState();
  const [priority, setPriority] = useState();

  const handleAddClick = () => {
    setPopupOpen(true);
  };

  const handleCloseClick = () => {
    setPopupOpen(false);
  };

  const selectBookPlace = (e) => {
    setbookPlace(e.target.value);
  };

  const selectCategory = (e) => {
    setCategory(e.target.value);
  };

  return (
    <div className="bookpage">
      <div className="add-book">
        <button onClick={handleAddClick} className="add-button">
          追加
        </button>
      </div>
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
                <input type="text" />
              </li>
              <li>
                <div>著者</div>
                <input type="text" />
              </li>
              <li>
                <div>保管場所</div>
                <select name="genre" id="genre" onChange={selectBookPlace}>
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
                >
                  <option value="programing">プログラミング</option>
                  <option value="busines">ビジネス</option>
                  <option value="Cons">コンサル</option>
                  <option value="other">その他</option>
                </select>
              </li>
              <li>
                <div>優先度</div>
                <input type="text" />
              </li>
            </ul>
            <form className="check-box" action="#" method="post">
              <label>
                <input
                  type="checkbox"
                  name="checkboxName"
                  value="checkboxValue"
                />
                読了
                <input
                  type="checkbox"
                  name="checkboxName"
                  value="checkboxValue"
                />
                所有
              </label>
            </form>
            <button className="add-button">追加</button>
          </div>
        </>
      )}
      <div className="book-list">
        <ul>
          <li>
            <p>book1</p>
            <button>削除</button>
          </li>
          <li>
            <p>book2</p>
            <button>削除</button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Books;

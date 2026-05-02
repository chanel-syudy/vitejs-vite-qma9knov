import { useState } from "react";
import "./App.css";

type StudyItem = {
  id: number;
  text: string;
  meaning: string;
};

export default function App() {
  const [text, setText] = useState("");
  const [meaning, setMeaning] = useState("");
  const [items, setItems] = useState<StudyItem[]>([]);

  const speak = (sentence: string) => {
    if (!sentence.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.pitch = 1;

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
  };

  const addItem = () => {
    if (!text.trim()) return;

    const newItem: StudyItem = {
      id: Date.now(),
      text,
      meaning,
    };

    setItems([newItem, ...items]);
    setText("");
    setMeaning("");
  };

  const deleteItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Chanel Sentence Notebook</h1>
        <p className="subtitle">문장을 저장하고, 발음을 들으며 연습하세요.</p>

        <div className="inputBox">
          <textarea
            placeholder="영어 문장을 입력하세요"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <textarea
            placeholder="해석을 입력하세요"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
          />

          <div className="buttonRow">
            <button className="mainBtn" onClick={addItem}>
              저장하기
            </button>

            <button className="speakBtn" onClick={() => speak(text)}>
              발음 듣기
            </button>

            <button className="stopBtn" onClick={stopSpeech}>
              발음 정지
            </button>
          </div>
        </div>

        <div className="list">
          {items.length === 0 ? (
            <p className="empty">아직 저장된 문장이 없습니다.</p>
          ) : (
            items.map((item) => (
              <div className="card" key={item.id}>
                <p className="sentence">{item.text}</p>
                <p className="meaning">{item.meaning}</p>

                <div className="cardButtons">
                  <button onClick={() => speak(item.text)}>발음 듣기</button>
                  <button onClick={stopSpeech}>정지</button>
                  <button onClick={() => deleteItem(item.id)}>삭제</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";

type Word = {
  word: string;
  meaning: string;
  sentence: string;
  sentenceMeaning: string;
};

type Sentence = {
  text: string;
  meaning: string;
};

export default function App() {
  const [text, setText] = useState("");
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [wordBank, setWordBank] = useState<Word[]>([]);
  const [selectedWord, setSelectedWord] = useState("");
  const [selectedMeaning, setSelectedMeaning] = useState("");
  const [selectedSentence, setSelectedSentence] = useState("");
  const [selectedSentenceMeaning, setSelectedSentenceMeaning] = useState("");
  const [openMeaningIndex, setOpenMeaningIndex] = useState<number | null>(null);
  const [openSourceIndex, setOpenSourceIndex] = useState<number | null>(null);

  useEffect(() => {
    const savedSentences = localStorage.getItem("sentences");
    const savedWords = localStorage.getItem("wordBank");

    if (savedSentences) setSentences(JSON.parse(savedSentences));
    if (savedWords) setWordBank(JSON.parse(savedWords));
  }, []);

  useEffect(() => {
    localStorage.setItem("sentences", JSON.stringify(sentences));
  }, [sentences]);

  useEffect(() => {
    localStorage.setItem("wordBank", JSON.stringify(wordBank));
  }, [wordBank]);

  const speak = (value: string) => {
    if (!value) return;
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    speechSynthesis.speak(utterance);
  };

  const translate = async (value: string) => {
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          value
        )}&langpair=en|ko`
      );
      const data = await res.json();
      return data.responseData.translatedText || "해석을 불러오지 못했습니다.";
    } catch {
      return "해석을 불러오지 못했습니다.";
    }
  };

  const saveSentence = async () => {
    if (!text.trim()) return;

    const meaning = await translate(text);

    setSentences([
      {
        text,
        meaning,
      },
      ...sentences,
    ]);

    setText("");
  };

  const cleanWord = (word: string) => {
    return word.replace(/[^a-zA-Z']/g, "").toLowerCase();
  };

  const clickWord = async (word: string, sentence: Sentence) => {
    const cleaned = cleanWord(word);
    if (!cleaned) return;

    setSelectedWord(cleaned);
    setSelectedSentence(sentence.text);
    setSelectedSentenceMeaning(sentence.meaning);
    setSelectedMeaning("뜻 불러오는 중...");
    speak(cleaned);

    const meaning = await translate(cleaned);
    setSelectedMeaning(meaning);
  };

  const addWord = () => {
    if (!selectedWord) return;

    const exists = wordBank.some(
      (item) =>
        item.word === selectedWord && item.sentence === selectedSentence
    );

    if (exists) return;

    setWordBank([
      {
        word: selectedWord,
        meaning: selectedMeaning,
        sentence: selectedSentence,
        sentenceMeaning: selectedSentenceMeaning,
      },
      ...wordBank,
    ]);

    setSelectedWord("");
    setSelectedMeaning("");
    setSelectedSentence("");
    setSelectedSentenceMeaning("");
  };

  const updateWordMeaning = (index: number, value: string) => {
    const copy = [...wordBank];
    copy[index].meaning = value;
    setWordBank(copy);
  };

  const deleteWord = (index: number) => {
    setWordBank(wordBank.filter((_, i) => i !== index));
  };

  const deleteSentenceOnlyInWord = (index: number) => {
    const copy = [...wordBank];
    copy[index].sentence = "";
    copy[index].sentenceMeaning = "";
    setWordBank(copy);
  };

  const deleteSentence = (index: number) => {
    setSentences(sentences.filter((_, i) => i !== index));
  };

  const splitWords = (sentence: string) => {
    return sentence.split(/(\s+)/);
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Chanel Sentence Notebook</h1>
      <p style={styles.subtitle}>
        문장을 임시 저장하고, 필요한 단어만 골라 단어방에 남기세요.
      </p>

      <textarea
        style={styles.textarea}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="영어 문장을 입력하세요."
      />

      <div style={styles.buttonBox}>
        <button style={styles.mainButton} onClick={saveSentence}>
          문장 저장
        </button>

        <button style={styles.subButton} onClick={() => speak(text)}>
          입력 문장 발음
        </button>
      </div>

      {selectedWord && (
        <div style={styles.selectedBox}>
          <div>
            <b style={styles.selectedWord}>{selectedWord}</b>
            <p style={styles.selectedMeaning}>{selectedMeaning}</p>
          </div>

          <div style={styles.miniButtonBox}>
            <button style={styles.smallButton} onClick={() => speak(selectedWord)}>
              발음
            </button>

            <button style={styles.mainSmallButton} onClick={addWord}>
              단어 추가
            </button>

            <button
              style={styles.grayButton}
              onClick={() => {
                setSelectedWord("");
                setSelectedMeaning("");
                setSelectedSentence("");
                setSelectedSentenceMeaning("");
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      <h2 style={styles.sectionTitle}>임시 문장 저장 공간</h2>
      <p style={styles.guideText}>
        단어를 다 추가한 뒤에는 이 문장을 삭제해도 아래 단어방은 유지됩니다.
      </p>

      <div style={styles.sentenceList}>
        {sentences.map((sentence, index) => (
          <div key={index} style={styles.sentenceCard}>
            <div style={styles.sentenceTop}>
              <p style={styles.sentenceText}>{sentence.text}</p>

              <div style={styles.iconButtons}>
                <button style={styles.miniButton} onClick={() => speak(sentence.text)}>
                  발음
                </button>

                <button
                  style={styles.miniButton}
                  onClick={() =>
                    setOpenMeaningIndex(openMeaningIndex === index ? null : index)
                  }
                >
                  해석
                </button>

                <button style={styles.deleteMiniButton} onClick={() => deleteSentence(index)}>
                  삭제
                </button>
              </div>
            </div>

            {openMeaningIndex === index && (
              <p style={styles.translation}>{sentence.meaning}</p>
            )}

            <div style={styles.wordLine}>
              {splitWords(sentence.text).map((word, i) => {
                if (word.trim() === "") return <span key={i}>{word}</span>;

                return (
                  <span
                    key={i}
                    style={styles.clickableWord}
                    onClick={() => clickWord(word, sentence)}
                  >
                    {word}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <h2 style={styles.sectionTitle}>내 단어방</h2>
      <p style={styles.count}>저장된 단어: {wordBank.length}개</p>

      <div style={styles.wordBank}>
        {wordBank.map((item, index) => (
          <div key={index} style={styles.wordCard}>
            <div style={styles.wordCardTop}>
              <button style={styles.wordButton} onClick={() => speak(item.word)}>
                {item.word}
              </button>

              <button style={styles.deleteMiniButton} onClick={() => deleteWord(index)}>
                단어 삭제
              </button>
            </div>

            <input
              style={styles.input}
              value={item.meaning}
              onChange={(e) => updateWordMeaning(index, e.target.value)}
              placeholder="뜻 수정"
            />

            {item.sentence && (
              <div style={styles.sourceBox}>
                <p style={styles.sourceSentence}>{item.sentence}</p>

                <div style={styles.iconButtons}>
                  <button style={styles.miniButton} onClick={() => speak(item.sentence)}>
                    문장 발음
                  </button>

                  <button
                    style={styles.miniButton}
                    onClick={() =>
                      setOpenSourceIndex(openSourceIndex === index ? null : index)
                    }
                  >
                    문장 해석
                  </button>

                  <button
                    style={styles.deleteMiniButton}
                    onClick={() => deleteSentenceOnlyInWord(index)}
                  >
                    문장 삭제
                  </button>
                </div>

                {openSourceIndex === index && (
                  <p style={styles.translation}>{item.sentenceMeaning}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: any = {
  page: {
    minHeight: "100vh",
    padding: "22px",
    background: "#fff7fb",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    color: "#d63384",
    fontSize: "26px",
    marginBottom: "4px",
  },
  subtitle: {
    color: "#555",
    fontSize: "14px",
    marginBottom: "14px",
  },
  textarea: {
    width: "100%",
    height: "95px",
    padding: "12px",
    fontSize: "15px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    boxSizing: "border-box",
  },
  buttonBox: {
    marginTop: "10px",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  mainButton: {
    padding: "10px 16px",
    background: "#d63384",
    color: "white",
    border: "none",
    borderRadius: "999px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  subButton: {
    padding: "10px 16px",
    background: "white",
    color: "#d63384",
    border: "2px solid #f8c8dc",
    borderRadius: "999px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  selectedBox: {
    marginTop: "14px",
    padding: "12px",
    background: "#ffe3ef",
    borderRadius: "14px",
    display: "flex",
    justifyContent: "space-between",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  selectedWord: {
    fontSize: "20px",
    color: "#222",
  },
  selectedMeaning: {
    margin: "6px 0 0",
    color: "#333",
  },
  miniButtonBox: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  smallButton: {
    padding: "7px 10px",
    background: "#f8c8dc",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  mainSmallButton: {
    padding: "7px 10px",
    background: "#d63384",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  grayButton: {
    padding: "7px 10px",
    background: "#777",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  sectionTitle: {
    marginTop: "24px",
    fontSize: "19px",
    color: "#333",
  },
  guideText: {
    color: "#777",
    fontSize: "13px",
    marginTop: "-8px",
  },
  sentenceList: {
    display: "grid",
    gap: "10px",
  },
  sentenceCard: {
    background: "white",
    padding: "13px",
    borderRadius: "14px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.07)",
  },
  sentenceTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },
  sentenceText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: "1.5",
    color: "#222",
    flex: 1,
  },
  iconButtons: {
    display: "flex",
    gap: "5px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  miniButton: {
    padding: "6px 8px",
    fontSize: "12px",
    background: "#fff",
    color: "#d63384",
    border: "1px solid #f8c8dc",
    borderRadius: "7px",
    cursor: "pointer",
  },
  deleteMiniButton: {
    padding: "6px 8px",
    fontSize: "12px",
    background: "#444",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
  },
  translation: {
    marginTop: "8px",
    padding: "9px",
    background: "#fff7fb",
    borderRadius: "9px",
    color: "#555",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  wordLine: {
    marginTop: "10px",
    lineHeight: "2",
  },
  clickableWord: {
    display: "inline-block",
    marginRight: "5px",
    padding: "2px 5px",
    borderRadius: "6px",
    cursor: "pointer",
    background: "#f7f7f7",
    fontSize: "14px",
  },
  count: {
    color: "#555",
    fontWeight: "bold",
    fontSize: "14px",
  },
  wordBank: {
    display: "grid",
    gap: "10px",
  },
  wordCard: {
    background: "white",
    padding: "12px",
    borderRadius: "14px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.07)",
  },
  wordCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
    alignItems: "center",
  },
  wordButton: {
    padding: "8px 12px",
    background: "#ffe3ef",
    border: "none",
    borderRadius: "999px",
    color: "#222",
    fontWeight: "bold",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    marginTop: "9px",
    padding: "9px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    boxSizing: "border-box",
  },
  sourceBox: {
    marginTop: "10px",
    padding: "10px",
    background: "#fafafa",
    borderRadius: "10px",
  },
  sourceSentence: {
    margin: "0 0 8px",
    color: "#555",
    fontSize: "13px",
    lineHeight: "1.5",
  },
};
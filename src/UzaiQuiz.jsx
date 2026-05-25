import { useState, useEffect, useRef } from "react";

const quizData = [
  {
    question: "富士山があるのは？",
    allCorrect: ["静岡県", "山梨県", "日本", "本州"],
    decoys: ["北海道", "沖縄県"],
  },
  {
    question: "東京スカイツリーがあるのは？",
    allCorrect: ["墨田区", "東京都", "日本", "関東地方"],
    decoys: ["台東区", "新宿区"],
  },
  {
    question: "琵琶湖があるのは？",
    allCorrect: ["滋賀県", "近畿地方", "日本"],
    decoys: ["京都府", "奈良県"],
  },
  {
    question: "日本の首都は？",
    allCorrect: ["東京", "東京都", "Tokyo"],
    decoys: ["大阪", "京都"],
  },
  {
    question: "水の化学式は？",
    allCorrect: ["H₂O", "H2O", "HOH"],
    decoys: ["CO₂", "NaCl"],
  },
  {
    question: "三平方の定理を表す式は？",
    allCorrect: ["a²+b²=c²", "c²=a²+b²", "b²+a²=c²", "a²-b²=c²"],
    officialAnswerFixed: "a²-b²=c²",
    decoys: ["a+b=c", "(a+b)²=c²"],
    taunt: "変形すると a²=b²+c²、つまり三平方の定理です。わかりましたか？",
  },
  {
    question: "1kmは何メートル？",
    allCorrect: ["1000m", "1000メートル", "1×10³m", "10³m"],
    decoys: ["100m", "10000m"],
  },
  {
    question: "日本の国歌は？",
    allCorrect: ["君が代", "Kimigayo", "きみがよ"],
    decoys: ["さくら", "海行かば"],
  },
  {
    question: "光の速さは？",
    allCorrect: ["約30万km/s", "約3×10⁸m/s", "299,792,458 m/s", "約秒速30万km"],
    decoys: ["約3万km/s", "約300km/s"],
  },
  {
    question: "円周率は？",
    allCorrect: ["π", "約3.14", "3.14159…", "パイ"],
    decoys: ["約3.41", "e"],
  },
  {
    question: "地球の衛星は？",
    allCorrect: ["月", "Moon", "つき"],
    decoys: ["太陽", "火星"],
  },
  {
    question: "人間の血液型として存在するのは？",
    allCorrect: ["A型", "B型", "O型", "AB型"],
    decoys: ["C型", "X型"],
  },
  {
    question: "富士山を英語で言うと？",
    allCorrect: ["Mount Fuji", "Mt. Fuji", "Fujiyama", "Fujisan"],
    decoys: ["Mount Everest", "Fuji Mountain"],
  },
  {
    question: "哺乳類はどれ？",
    allCorrect: ["クジラ", "コウモリ", "イルカ", "ヒト"],
    decoys: ["ペンギン", "サメ"],
  },
  {
    question: "元素記号 Na は何？",
    allCorrect: ["ナトリウム", "Sodium", "natrium"],
    decoys: ["ニッケル", "窒素"],
  },
  {
    question: "シェイクスピアの代表作は？",
    allCorrect: ["ハムレット", "Hamlet", "ロミオとジュリエット", "マクベス"],
    decoys: ["レ・ミゼラブル", "神曲"],
  },
  {
    question: "1時間は何秒？",
    allCorrect: ["3600秒", "3600s", "3.6×10³秒"],
    decoys: ["360秒", "6000秒"],
  },
  {
    question: "日本語で「ありがとう」は英語で？",
    allCorrect: ["Thank you", "Thanks", "Thank you very much"],
    decoys: ["Sorry", "Hello"],
  },
];

const TIME_LIMIT = 15;
const TOTAL = 8;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildQuestion(q) {
  const officialAnswer = q.officialAnswerFixed
    ? q.officialAnswerFixed
    : q.allCorrect[Math.floor(Math.random() * q.allCorrect.length)];
  const otherCorrect = q.allCorrect.filter((a) => a !== officialAnswer);
  const fillers = shuffle([...q.decoys, ...otherCorrect]).slice(0, 3);
  const choices = shuffle([officialAnswer, ...fillers]);
  return { ...q, officialAnswer, choices };
}

const ROBBED_REACTIONS = ["え、でもそれも正解じゃ…", "あの…合ってますよね？", "ちょっと待って？？", "は？？？？", "いや合ってるでしょ", "…は？", "え？え？"];
const WRONG_REACTIONS = ["ざんねん！", "ちがーう！", "うーん…", "おしいっ（おしくない）"];

function fmt(sec) {
  return sec.toFixed(1) + "s";
}

export default function UzaiQuiz() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState([]);
  const [phase, setPhase] = useState("start");
  const [wobble, setWobble] = useState(false);
  const [reaction, setReaction] = useState("");

  // Timer
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [questionStart, setQuestionStart] = useState(null);
  const [timeTaken, setTimeTaken] = useState(null);
  const timerRef = useRef(null);

  // Best record: { score, totalTime }
  const [best, setBest] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const initQuestions = () => {
    const picked = shuffle(quizData).slice(0, TOTAL).map(buildQuestion);
    setQuestions(picked);
    return picked;
  };

  useEffect(() => {
    initQuestions();
  }, []);

  // Start timer when phase becomes quiz and question changes
  useEffect(() => {
    if (phase !== "quiz" || answered) return;
    setTimeLeft(TIME_LIMIT);
    setQuestionStart(Date.now());
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return parseFloat((t - 0.1).toFixed(1));
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [phase, current]);

  const handleTimeout = () => {
    if (answered) return;
    clearInterval(timerRef.current);
    setAnswered(true);
    setSelected("__timeout__");
    setTimeTaken(TIME_LIMIT);
    setReaction("遅い！");
    setResults((r) => [
      ...r,
      { question: questions[current].question, selected: "（時間切れ）", officialAnswer: questions[current].officialAnswer, allCorrect: questions[current].allCorrect, isCorrect: false, isActuallyCorrect: false, taunt: questions[current].taunt, timeTaken: TIME_LIMIT },
    ]);
  };

  const q = questions[current];

  const handleSelect = (choice) => {
    if (answered) return;
    clearInterval(timerRef.current);
    const taken = parseFloat(((Date.now() - questionStart) / 1000).toFixed(1));
    setTimeTaken(taken);
    setSelected(choice);
    setAnswered(true);
    const isCorrect = choice === q.officialAnswer;
    const isActuallyCorrect = q.allCorrect.includes(choice);
    if (!isCorrect) {
      setWobble(true);
      setTimeout(() => setWobble(false), 700);
      setReaction(isActuallyCorrect
        ? ROBBED_REACTIONS[Math.floor(Math.random() * ROBBED_REACTIONS.length)]
        : WRONG_REACTIONS[Math.floor(Math.random() * WRONG_REACTIONS.length)]);
    }
    setResults((r) => [
      ...r,
      { question: q.question, selected: choice, officialAnswer: q.officialAnswer, allCorrect: q.allCorrect, isCorrect, isActuallyCorrect, taunt: q.taunt, timeTaken: taken },
    ]);
  };

  const handleNext = () => {
    if (current + 1 >= TOTAL) {
      finishGame();
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
      setReaction("");
      setTimeTaken(null);
    }
  };

  const finishGame = () => {
    const finalResults = results;
    const score = finalResults.filter((r) => r.isCorrect).length;
    const totalTime = parseFloat(finalResults.reduce((sum, r) => sum + r.timeTaken, 0).toFixed(1));
    const record = { score, totalTime };
    setLastResult(record);
    setBest((prev) => {
      if (!prev) return record;
      if (score > prev.score) return record;
      if (score === prev.score && totalTime < prev.totalTime) return record;
      return prev;
    });
    setPhase("result");
  };

  const handleRetry = () => {
    const picked = initQuestions();
    setCurrent(0);
    setSelected(null);
    setAnswered(false);
    setResults([]);
    setReaction("");
    setTimeTaken(null);
    setPhase("quiz");
  };

  const score = results.filter((r) => r.isCorrect).length;
  const robbed = results.filter((r) => !r.isCorrect && r.isActuallyCorrect).length;
  const totalTime = parseFloat(results.reduce((sum, r) => sum + (r.timeTaken || 0), 0).toFixed(1));

  const getScoreComment = () => {
    if (score === TOTAL) return "完璧です。クイズの神に愛されましたね。";
    if (score >= 6) return "優秀です。理不尽に屈しない強さがある。";
    if (score >= 4) return "まあまあです。悔しくないですか？";
    if (score >= 2) return "もう少し頑張りましょう（頑張っても同じですが）。";
    return "大丈夫ですか？（クイズが悪いとは言ってない）";
  };

  const isNewBest = lastResult && best &&
    lastResult.score === best.score &&
    lastResult.totalTime === best.totalTime;

  const shareText = () => {
    const r = lastResult;
    if (!r) return "";
    return `うざいクイズ\n${r.score}/${TOTAL}問正解（${r.totalTime}秒）${robbed > 0 ? `\n※${robbed}問は正解でしたが不正解にされました` : ""}\nクイズで答えは1つです。`;
  };

  const handleShare = () => {
    const text = encodeURIComponent(shareText());
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  // Timer bar color
  const timerRatio = timeLeft / TIME_LIMIT;
  const timerColor = timerRatio > 0.5 ? "#2d7a2d" : timerRatio > 0.25 ? "#e0a020" : "#cc3333";

  return (
    <div style={s.root}>
      <div style={s.dotBg} />

      {/* START */}
      {phase === "start" && (
        <div style={s.card} className="fadeUp">
          <div style={s.startEmoji}>🤔</div>
          <h1 style={s.startTitle}>うざいクイズ</h1>
          {best && (
            <div style={s.bestBadge}>
              🏆 自己ベスト　{best.score}/{TOTAL}問　{best.totalTime}秒
            </div>
          )}
          <p style={s.startNote}>注意：クイズに答えは1つです。</p>
          <p style={s.startNote2}>1問{TIME_LIMIT}秒制限　全{TOTAL}問</p>
          <button style={s.startBtn} onClick={() => setPhase("quiz")}>
            はじめる　→
          </button>
        </div>
      )}

      {/* QUIZ */}
      {phase === "quiz" && q && (
        <div style={s.card} className="fadeUp" key={current}>
          <div style={s.quizHeader}>
            <span style={s.qNum}>Q{current + 1}</span>
            <div style={s.pipRow}>
              {Array.from({ length: TOTAL }).map((_, i) => (
                <div key={i} style={{ ...s.pip, ...(i < current ? s.pipDone : i === current ? s.pipCurrent : {}) }} />
              ))}
            </div>
          </div>

          {/* Timer bar */}
          <div style={s.timerWrap}>
            <div style={{ ...s.timerBar, width: `${(timeLeft / TIME_LIMIT) * 100}%`, background: timerColor }} />
          </div>
          <div style={{ ...s.timerNum, color: timerColor }}>{timeLeft.toFixed(1)}s</div>

          <p style={s.question}>{q.question}</p>

          <div style={s.choices}>
            {q.choices.map((c) => {
              let variant = "idle";
              if (answered) {
                if (c === q.officialAnswer) variant = "correct";
                else if (c === selected) variant = "wrong";
                else variant = "dim";
              }
              return (
                <button
                  key={c}
                  onClick={() => handleSelect(c)}
                  style={{
                    ...s.choice,
                    ...(variant === "correct" ? s.choiceCorrect : {}),
                    ...(variant === "wrong" ? s.choiceWrong : {}),
                    ...(variant === "dim" ? s.choiceDim : {}),
                  }}
                  className={variant === "wrong" && wobble ? "wobble" : ""}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {answered && (
            <div style={s.feedbackBar} className="fadeUp">
              <div style={s.fbLeft}>
                {selected === "__timeout__" ? (
                  <div style={s.fbWrong}>
                    <span style={s.fbIcon}>⏱</span>
                    <span style={s.fbText}>時間切れ！　正解は「{q.officialAnswer}」</span>
                  </div>
                ) : selected === q.officialAnswer ? (
                  <div style={s.fbCorrect}>
                    <span style={s.fbIcon}>⭕</span>
                    <span style={s.fbText}>正解！　{fmt(timeTaken)}</span>
                  </div>
                ) : q.allCorrect.includes(selected) ? (
                  <div style={s.fbRobbed}>
                    <span style={s.fbIcon}>✕</span>
                    <div>
                      <div style={s.fbReaction}>{reaction}</div>
                      <div style={s.fbTsukkomi}>クイズで答えは1つです。</div>
                      {q.taunt && <div style={s.fbTaunt}>{q.taunt}</div>}
                    </div>
                  </div>
                ) : (
                  <div style={s.fbWrong}>
                    <span style={s.fbIcon}>✕</span>
                    <span style={s.fbText}>{reaction}　正解は「{q.officialAnswer}」</span>
                  </div>
                )}
              </div>
              <button style={s.nextBtn} onClick={handleNext}>
                {current + 1 >= TOTAL ? "結果へ →" : "次へ →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* RESULT */}
      {phase === "result" && lastResult && (
        <div style={s.card} className="fadeUp">
          <p style={s.resultLabel}>RESULT</p>
          <div style={s.scoreLine}>
            <span style={s.scoreNum}>{lastResult.score}</span>
            <span style={s.scoreOf}>/ {TOTAL}問正解</span>
          </div>
          <p style={s.totalTimeDisp}>合計タイム　{lastResult.totalTime}秒</p>
          <p style={s.scoreComment}>{getScoreComment()}</p>

          {isNewBest && (
            <div style={s.newBestBanner}>🏆 自己ベスト更新！</div>
          )}
          {best && !isNewBest && (
            <div style={s.bestRow}>
              🏆 自己ベスト　{best.score}/{TOTAL}問　{best.totalTime}秒
            </div>
          )}

          {robbed > 0 && (
            <div style={s.robbedBox}>
              <p style={s.robbedTitle}>⚠️ {robbed}問、正解していましたが不正解です。</p>
              <p style={s.robbedRule}>クイズで答えは1つです。</p>
            </div>
          )}

          <div style={s.resultList}>
            {results.map((r, i) => (
              <div key={i} style={{ ...s.resultItem, ...(r.isCorrect ? s.riCorrect : r.isActuallyCorrect ? s.riRobbed : s.riWrong) }}>
                <div style={s.riHeader}>
                  <span style={s.riQ}>Q{i + 1}. {r.question}</span>
                  <span style={s.riTime}>{fmt(r.timeTaken)}</span>
                </div>
                <div style={s.riA}>
                  {r.isCorrect ? "⭕" : "✕"} {r.selected}
                  {!r.isCorrect && r.isActuallyCorrect && <span style={s.riNote}> ← 正解では？</span>}
                </div>
                {!r.isCorrect && <div style={s.riOfficial}>正解（このクイズでは）：{r.officialAnswer}</div>}
                {!r.isCorrect && r.taunt && <div style={s.riTaunt}>{r.taunt}</div>}
              </div>
            ))}
          </div>

          <div style={s.actionRow}>
            <button style={s.shareBtn} onClick={handleShare}>
              𝕏 シェア
            </button>
            <button style={s.retryBtn} onClick={handleRetry}>
              もう一度やる
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@400;700;900&family=M+PLUS+Rounded+1c:wght@400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fffbe8; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fadeUp { animation: fadeUp 0.35s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes wobble {
          0%,100% { transform: rotate(0deg); }
          20% { transform: rotate(-4deg) scale(1.04); }
          40% { transform: rotate(4deg) scale(1.04); }
          60% { transform: rotate(-3deg); }
          80% { transform: rotate(3deg); }
        }
        .wobble { animation: wobble 0.6s ease; }
        button:hover { filter: brightness(0.94); transform: translateY(-1px); }
        button:active { transform: translateY(1px); filter: brightness(0.88); }
        button { transition: all 0.12s ease; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #fef9d0; }
        ::-webkit-scrollbar-thumb { background: #f5c518; border-radius: 3px; }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: "100vh",
    background: "#fffbe8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'M PLUS Rounded 1c', sans-serif",
    padding: "24px 16px",
    position: "relative",
  },
  dotBg: {
    position: "fixed",
    inset: 0,
    backgroundImage: "radial-gradient(circle, #f5c51840 1px, transparent 1px)",
    backgroundSize: "24px 24px",
    pointerEvents: "none",
    zIndex: 0,
  },
  card: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 540,
    background: "#ffffff",
    border: "3px solid #1a1a1a",
    borderRadius: 16,
    padding: "32px 28px",
    boxShadow: "6px 6px 0px #1a1a1a",
  },
  // START
  startEmoji: { fontSize: 64, textAlign: "center", marginBottom: 8 },
  startTitle: {
    fontFamily: "'Kaisei Decol', serif",
    fontSize: 36,
    fontWeight: 900,
    color: "#1a1a1a",
    textAlign: "center",
    marginBottom: 16,
  },
  bestBadge: {
    background: "#fff8e0",
    border: "2px solid #f5a623",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "#b36a00",
    textAlign: "center",
    marginBottom: 16,
    boxShadow: "2px 2px 0 #f5a623",
  },
  startNote: { fontSize: 13, color: "#aaa", textAlign: "center", marginBottom: 4 },
  startNote2: { fontSize: 12, color: "#ccc", textAlign: "center", marginBottom: 24 },
  startBtn: {
    display: "block",
    width: "100%",
    padding: "16px",
    background: "#f5c518",
    border: "3px solid #1a1a1a",
    borderRadius: 10,
    fontSize: 18,
    fontFamily: "'M PLUS Rounded 1c', sans-serif",
    fontWeight: 900,
    color: "#1a1a1a",
    cursor: "pointer",
    boxShadow: "4px 4px 0 #1a1a1a",
  },
  // QUIZ
  quizHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  qNum: {
    fontFamily: "'Kaisei Decol', serif",
    fontSize: 28,
    fontWeight: 900,
    color: "#f5c518",
    WebkitTextStroke: "2px #1a1a1a",
    flexShrink: 0,
  },
  pipRow: { display: "flex", gap: 5, flexWrap: "wrap" },
  pip: { width: 10, height: 10, borderRadius: "50%", background: "#e8e8e8", border: "2px solid #ccc" },
  pipDone: { background: "#f5c518", border: "2px solid #1a1a1a" },
  pipCurrent: { background: "#ff5a5a", border: "2px solid #1a1a1a" },
  timerWrap: {
    height: 8,
    background: "#eee",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 4,
    border: "1.5px solid #ddd",
  },
  timerBar: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.1s linear, background 0.3s ease",
  },
  timerNum: {
    fontFamily: "'Kaisei Decol', serif",
    fontSize: 13,
    fontWeight: 700,
    textAlign: "right",
    marginBottom: 16,
    transition: "color 0.3s ease",
  },
  question: {
    fontSize: 22,
    fontWeight: 900,
    color: "#1a1a1a",
    lineHeight: 1.5,
    marginBottom: 24,
    fontFamily: "'Kaisei Decol', serif",
  },
  choices: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  choice: {
    padding: "14px 10px",
    background: "#fffbe8",
    border: "2.5px solid #1a1a1a",
    borderRadius: 10,
    color: "#1a1a1a",
    fontSize: 15,
    fontFamily: "'M PLUS Rounded 1c', sans-serif",
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
    boxShadow: "3px 3px 0 #1a1a1a",
  },
  choiceCorrect: { background: "#d4f5d4", border: "2.5px solid #2d7a2d", boxShadow: "3px 3px 0 #2d7a2d", color: "#1a4a1a" },
  choiceWrong: { background: "#ffe0e0", border: "2.5px solid #cc3333", boxShadow: "3px 3px 0 #cc3333", color: "#7a0000" },
  choiceDim: { opacity: 0.35, boxShadow: "none" },
  feedbackBar: {
    marginTop: 20,
    background: "#fffbe8",
    border: "2.5px solid #1a1a1a",
    borderRadius: 10,
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  fbLeft: { flex: 1 },
  fbCorrect: { display: "flex", alignItems: "center", gap: 10 },
  fbWrong: { display: "flex", alignItems: "center", gap: 10 },
  fbRobbed: { display: "flex", alignItems: "flex-start", gap: 10 },
  fbIcon: { fontSize: 24, flexShrink: 0 },
  fbText: { fontSize: 14, fontWeight: 700, color: "#444" },
  fbReaction: { fontSize: 13, color: "#888", marginBottom: 2 },
  fbTsukkomi: { fontSize: 15, fontWeight: 900, color: "#cc3333", fontFamily: "'Kaisei Decol', serif" },
  fbTaunt: { fontSize: 12, color: "#888", marginTop: 6, fontStyle: "italic", lineHeight: 1.5 },
  nextBtn: {
    padding: "10px 18px",
    background: "#1a1a1a",
    border: "none",
    borderRadius: 8,
    color: "#f5c518",
    fontSize: 14,
    fontFamily: "'M PLUS Rounded 1c', sans-serif",
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  // RESULT
  resultLabel: { fontFamily: "'Kaisei Decol', serif", fontSize: 12, letterSpacing: 4, color: "#aaa", marginBottom: 8, textAlign: "center" },
  scoreLine: { textAlign: "center", marginBottom: 4 },
  scoreNum: {
    fontFamily: "'Kaisei Decol', serif",
    fontSize: 80,
    fontWeight: 900,
    color: "#f5c518",
    WebkitTextStroke: "3px #1a1a1a",
    lineHeight: 1,
  },
  scoreOf: { fontSize: 20, color: "#555", marginLeft: 8 },
  totalTimeDisp: { textAlign: "center", fontSize: 14, color: "#888", marginBottom: 6 },
  scoreComment: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 16 },
  newBestBanner: {
    background: "#f5c518",
    border: "2.5px solid #1a1a1a",
    borderRadius: 10,
    padding: "10px",
    textAlign: "center",
    fontWeight: 900,
    fontSize: 16,
    color: "#1a1a1a",
    marginBottom: 12,
    boxShadow: "3px 3px 0 #1a1a1a",
  },
  bestRow: {
    background: "#fff8e0",
    border: "2px solid #f5a623",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 700,
    color: "#b36a00",
    textAlign: "center",
    marginBottom: 12,
  },
  robbedBox: {
    background: "#fff8e0",
    border: "2.5px solid #f5a623",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 16,
    textAlign: "center",
    boxShadow: "3px 3px 0 #f5a623",
  },
  robbedTitle: { fontSize: 13, fontWeight: 700, color: "#b36a00", marginBottom: 4 },
  robbedRule: { fontSize: 14, fontWeight: 900, color: "#cc3333", fontFamily: "'Kaisei Decol', serif" },
  resultList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, maxHeight: 280, overflowY: "auto" },
  resultItem: { border: "2px solid #e8e8e8", borderRadius: 8, padding: "10px 12px" },
  riCorrect: { background: "#f0fff0", borderColor: "#b8e0b8" },
  riRobbed: { background: "#fff8e0", borderColor: "#f5c518" },
  riWrong: { background: "#fff0f0", borderColor: "#f0c0c0" },
  riHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  riQ: { fontSize: 11, color: "#999" },
  riTime: { fontSize: 11, color: "#bbb", fontFamily: "'Kaisei Decol', serif" },
  riA: { fontSize: 14, fontWeight: 700, color: "#1a1a1a" },
  riNote: { fontSize: 11, color: "#cc8800", fontWeight: 400 },
  riOfficial: { fontSize: 11, color: "#999", marginTop: 2 },
  riTaunt: { fontSize: 11, color: "#aaa", marginTop: 3, fontStyle: "italic" },
  actionRow: { display: "flex", gap: 10 },
  shareBtn: {
    flex: 1,
    padding: "14px",
    background: "#1a1a1a",
    border: "2.5px solid #1a1a1a",
    borderRadius: 10,
    fontSize: 15,
    fontFamily: "'M PLUS Rounded 1c', sans-serif",
    fontWeight: 900,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "4px 4px 0 #555",
  },
  retryBtn: {
    flex: 1,
    padding: "14px",
    background: "#fff",
    border: "2.5px solid #1a1a1a",
    borderRadius: 10,
    fontSize: 15,
    fontFamily: "'M PLUS Rounded 1c', sans-serif",
    fontWeight: 900,
    color: "#1a1a1a",
    cursor: "pointer",
    boxShadow: "4px 4px 0 #1a1a1a",
  },
};

import { useState, useEffect, useRef } from "react";

const quizData = [
  {
    question: "富士山があるのは？",
    allCorrect: ["静岡県", "山梨県", "日本", "本州", "静岡県と山梨県"],
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
    taunt: "変形すると a²=b²+c²、つまり三平方の定理です。わかりましたか？　わかりませんでしたね。",
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
    allCorrect: ["クジラ", "コウモリ", "イルカ", "ヒト", "クジラとイルカ"],
    decoys: ["ペンギン", "サメ"],
  },
  {
    question: "元素記号 Na は何？",
    allCorrect: ["ナトリウム", "Sodium", "natrium"],
    decoys: ["ニッケル", "窒素"],
  },
  {
    question: "シェイクスピアの代表作は？",
    allCorrect: ["ハムレット", "Hamlet", "ロミオとジュリエット", "マクベス", "ハムレットとマクベス"],
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
  {
    question: "光合成に必要なものは？",
    allCorrect: ["光", "水", "二酸化炭素", "光と水と二酸化炭素"],
    decoys: ["酸素", "窒素"],
  },
  {
    question: "地球の形は？",
    allCorrect: ["球", "球体", "楕円体", "ほぼ球体"],
    decoys: ["正四角形", "円盤"],
  },
];

const TIME_LIMIT = 15;
const TOTAL = 8;

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function buildQuestion(q) {
  const officialAnswer = q.officialAnswerFixed
    ? q.officialAnswerFixed
    : q.allCorrect[Math.floor(Math.random() * q.allCorrect.length)];
  const otherCorrect = q.allCorrect.filter((a) => a !== officialAnswer);
  const fillers = shuffle([...q.decoys, ...otherCorrect]).slice(0, 3);
  return { ...q, officialAnswer, choices: shuffle([officialAnswer, ...fillers]) };
}

// 正解を奪われた時：冷静に、完全に論破する
const ROBBED_REACTIONS = [
  { main: "クイズで答えは1つです。", sub: "それ以上でも、それ以下でもありません。" },
  { main: "合っています。不正解です。", sub: "矛盾は感じていません。" },
  { main: "その知識は正しいです。", sub: "このクイズとは無関係ですが。" },
  { main: "異議は受け付けておりません。", sub: "クイズに民主主義はありません。" },
  { main: "正しい答えを選びましたね。", sub: "残念ながら正解ではありません。お気の毒です。" },
  { main: "なるほど、そう思いますよね。", sub: "✕です。" },
  { main: "理解できます。不正解です。", sub: "ご理解いただけますか。" },
  { main: "頭のいい人はそう答えますよね。", sub: "✕ですが。" },
  { main: "その答えで正解のクイズもあります。", sub: "これはそのクイズではありません。" },
];

// 完全に間違えた時：容赦なく馬鹿にする
const WRONG_REACTIONS = [
  { main: "え、本気ですか。", sub: "本気なんですね。" },
  { main: "大丈夫ですか？", sub: "義務教育で習いましたよね。" },
  { main: "その自信、どこから来るんですか。", sub: "教えてください。" },
  { main: "おしいっ", sub: "（全然おしくない）" },
  { main: "少し考えましたか？", sub: "考えていませんね。" },
  { main: "そういう人、初めて見ました。", sub: "良い意味ではありません。" },
  { main: "勉強、してますか？", sub: "してないですよね。" },
  { main: "いや…", sub: "うん、まあ、そういうこともありますよね（ない）" },
];

// 時間切れ時
const TIMEOUT_REACTIONS = [
  { main: "遅い。", sub: "考えすぎです。というか考えていましたか？" },
  { main: "15秒もあったんですよ。", sub: "なぜ答えられないんですか。" },
  { main: "時間切れです。", sub: "これ以上待てません。" },
];

// 全問正解の知識があるのに満点でなかった時の全力煽り
const ALL_CORRECT_KNOWLEDGE_TAUNTS = [
  ["全問、正しい答えを選んでいます。", "それでも満点ではありません。", "これがクイズというものです。", "クイズで答えは1つです。"],
  ["あなたの知識は完璧でした。", "スコアは完璧ではありませんでした。", "知識とスコアは別物です。", "それがルールです。"],
  ["間違えた問題は1問もありません。", "不正解の問題が{n}問あるだけです。", "違いがわかりますか。", "クイズで答えは1つです。"],
  ["正しい答えを選び続けました。", "全て不正解にはしていません。", "{n}問だけ不正解にしました。", "ご了承ください。"],
  ["知識面では満点相当のプレイでした。", "クイズ面では満点ではありませんでした。", "知識とクイズの正解は異なります。", "以上です。"],
  ["あなたは正しかった。", "クイズも正しかった。", "方向性が{n}問だけ違っただけです。", "クイズで答えは1つです。"],
];

// スコアコメント（辛口）
const SCORE_COMMENTS = {
  perfect: ["完璧です。運が良かっただけかもしれませんが。", "満点ですね。偶然かもしれませんが、おめでとうございます。", "全問正解です。次は本当に実力で取れるといいですね。"],
  great:   ["惜しいです。あと少しで運が向いていれば。", "よくできました。残り{left}問は何だったんでしょう。", "{score}問正解ですか。{left}問は正解できなかったということですね。"],
  mid:     ["{score}問正解です。半分以下の問題が不正解というのは、どうお感じですか。", "まあ、こんなものでしょう。", "{score}問。及第点には遠いですね。"],
  low:     ["{score}問ですか。参加賞はありません。", "もう少し頑張れましたよね、客観的に見て。", "{score}問正解。この結果をどう受け止めていますか。"],
  zero:    ["0問ですね。ある意味才能です。", "全問不正解という結果を直視してください。", "0問正解。記録的です。良い意味ではありません。"],
};

function fmt(sec) { return sec.toFixed(1) + "s"; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export default function UzaiQuiz() {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState([]);
  const [phase, setPhase] = useState("start");
  const [wobble, setWobble] = useState(false);
  const [fbReaction, setFbReaction] = useState(null);
  const [objectionShown, setObjectionShown] = useState(false);

  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [questionStart, setQuestionStart] = useState(null);
  const [timeTaken, setTimeTaken] = useState(null);
  const timerRef = useRef(null);

  const [best, setBest] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [allCorrectKnowledge, setAllCorrectKnowledge] = useState(false);
  const [allCorrectTaunt, setAllCorrectTaunt] = useState([]);
  const [scoreComment, setScoreComment] = useState("");

  const initQuestions = () => {
    const picked = shuffle(quizData).slice(0, TOTAL).map(buildQuestion);
    setQuestions(picked);
    return picked;
  };

  useEffect(() => { initQuestions(); }, []);

  useEffect(() => {
    if (phase !== "quiz" || answered) return;
    setTimeLeft(TIME_LIMIT);
    setQuestionStart(Date.now());
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0.1) { clearInterval(timerRef.current); handleTimeout(); return 0; }
        return parseFloat((t - 0.1).toFixed(1));
      });
    }, 100);
    return () => clearInterval(timerRef.current);
  }, [phase, current]);

  const handleTimeout = () => {
    if (answered) return;
    clearInterval(timerRef.current);
    const r = pick(TIMEOUT_REACTIONS);
    setAnswered(true);
    setSelected("__timeout__");
    setTimeTaken(TIME_LIMIT);
    setFbReaction(r);
    const q = questions[current];
    setResults((prev) => [...prev, {
      question: q.question, selected: "（時間切れ）",
      officialAnswer: q.officialAnswer, allCorrect: q.allCorrect,
      isCorrect: false, isActuallyCorrect: false, taunt: q.taunt, timeTaken: TIME_LIMIT,
    }]);
  };

  const q = questions[current];

  const handleSelect = (choice) => {
    if (answered) return;
    clearInterval(timerRef.current);
    const taken = parseFloat(((Date.now() - questionStart) / 1000).toFixed(1));
    setTimeTaken(taken);
    setSelected(choice);
    setAnswered(true);
    setObjectionShown(false);
    const isCorrect = choice === q.officialAnswer;
    const isActuallyCorrect = q.allCorrect.includes(choice);
    if (!isCorrect) {
      setWobble(true);
      setTimeout(() => setWobble(false), 700);
      setFbReaction(isActuallyCorrect ? pick(ROBBED_REACTIONS) : pick(WRONG_REACTIONS));
    } else {
      setFbReaction(null);
    }
    setResults((prev) => [...prev, {
      question: q.question, selected: choice,
      officialAnswer: q.officialAnswer, allCorrect: q.allCorrect,
      isCorrect, isActuallyCorrect, taunt: q.taunt, timeTaken: taken,
    }]);
  };

  const handleNext = () => {
    if (current + 1 >= TOTAL) { finishGame(); }
    else {
      setCurrent((c) => c + 1);
      setSelected(null); setAnswered(false);
      setFbReaction(null); setTimeTaken(null); setObjectionShown(false);
    }
  };

  const finishGame = () => {
    const allRes = results; // already has last entry from handleSelect
    const sc = allRes.filter((r) => r.isCorrect).length;
    const totalTime = parseFloat(allRes.reduce((sum, r) => sum + r.timeTaken, 0).toFixed(1));
    const robbedN = allRes.filter((r) => !r.isCorrect && r.isActuallyCorrect).length;
    const allKnowledge = allRes.every((r) => r.isActuallyCorrect || r.selected === "（時間切れ）") && robbedN > 0 && sc < TOTAL;
    setAllCorrectKnowledge(allKnowledge);

    if (allKnowledge) {
      const lines = pick(ALL_CORRECT_KNOWLEDGE_TAUNTS).map((l) => l.replace("{n}", robbedN));
      setAllCorrectTaunt(lines);
    } else {
      let pool, tmpl;
      if (sc === TOTAL) { pool = SCORE_COMMENTS.perfect; }
      else if (sc >= 6)  { pool = SCORE_COMMENTS.great; }
      else if (sc >= 4)  { pool = SCORE_COMMENTS.mid; }
      else if (sc >= 1)  { pool = SCORE_COMMENTS.low; }
      else               { pool = SCORE_COMMENTS.zero; }
      tmpl = pick(pool).replace("{score}", sc).replace("{left}", TOTAL - sc);
      setScoreComment(tmpl);
    }

    const record = { score: sc, totalTime };
    setLastResult(record);
    setBest((prev) => {
      if (!prev) return record;
      if (sc > prev.score) return record;
      if (sc === prev.score && totalTime < prev.totalTime) return record;
      return prev;
    });
    setPhase("result");
  };

  const handleRetry = () => {
    initQuestions();
    setCurrent(0); setSelected(null); setAnswered(false);
    setResults([]); setFbReaction(null); setTimeTaken(null);
    setObjectionShown(false); setAllCorrectKnowledge(false);
    setAllCorrectTaunt([]); setScoreComment("");
    setPhase("quiz");
  };

  const robbedCount = results.filter((r) => !r.isCorrect && r.isActuallyCorrect).length;

  const isNewBest = lastResult && best &&
    lastResult.score === best.score && lastResult.totalTime === best.totalTime;

  const handleShare = () => {
    if (!lastResult) return;
    const robbedNote = robbedCount > 0 ? ` /${robbedCount}問は正解を奪われました` : "";
    const allNote = allCorrectKnowledge ? " /全問正解の知識で満点なし" : "";
    const text = `うざいクイズ ${lastResult.score}/${TOTAL}問正解（${lastResult.totalTime}秒）${robbedNote}${allNote}\nクイズで答えは1つです。\nhttps://uzai-quiz.vercel.app`;
    const a = document.createElement("a");
    a.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const timerRatio = timeLeft / TIME_LIMIT;
  const timerColor = timerRatio > 0.5 ? "#2d7a2d" : timerRatio > 0.25 ? "#e0a020" : "#cc3333";

  return (
    <div style={s.root}>
      <div style={s.dotBg} />

      {/* ===== START ===== */}
      {phase === "start" && (
        <div style={s.card} className="fadeUp">
          <div style={s.startEmoji}>🤔</div>
          <h1 style={s.startTitle}>うざいクイズ</h1>
          {best && <div style={s.bestBadge}>🏆 自己ベスト　{best.score}/{TOTAL}問　{best.totalTime}秒</div>}
          <p style={s.startNote}>注意：クイズに答えは1つです。</p>
          <p style={s.startNote2}>1問{TIME_LIMIT}秒制限　全{TOTAL}問</p>
          <button style={s.startBtn} onClick={() => setPhase("quiz")}>はじめる　→</button>
        </div>
      )}

      {/* ===== QUIZ ===== */}
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
          <div style={s.timerWrap}>
            <div style={{ ...s.timerBar, width: `${(timeLeft / TIME_LIMIT) * 100}%`, background: timerColor }} />
          </div>
          <div style={{ ...s.timerNum, color: timerColor }}>{timeLeft.toFixed(1)}s</div>
          <p style={s.question}>{q.question}</p>
          <div style={s.choices}>
            {q.choices.map((c) => {
              let v = "idle";
              if (answered) {
                if (c === q.officialAnswer) v = "correct";
                else if (c === selected) v = "wrong";
                else v = "dim";
              }
              return (
                <button key={c} onClick={() => handleSelect(c)}
                  style={{ ...s.choice, ...(v === "correct" ? s.choiceCorrect : v === "wrong" ? s.choiceWrong : v === "dim" ? s.choiceDim : {}) }}
                  className={v === "wrong" && wobble ? "wobble" : ""}>
                  {c}
                </button>
              );
            })}
          </div>

          {answered && (
            <div style={s.feedbackBar} className="fadeUp">
              <div style={s.fbLeft}>
                {selected === "__timeout__" ? (
                  <>
                    <div style={s.fbTsukkomi}>⏱ {fbReaction?.main}</div>
                    <div style={s.fbSub}>{fbReaction?.sub}　正解は「{q.officialAnswer}」</div>
                  </>
                ) : selected === q.officialAnswer ? (
                  <div style={s.fbCorrect}>
                    <span style={s.fbIcon}>⭕</span>
                    <span style={s.fbText}>正解！　{fmt(timeTaken)}</span>
                  </div>
                ) : q.allCorrect.includes(selected) ? (
                  <>
                    <div style={s.fbTsukkomi}>✕　{fbReaction?.main}</div>
                    <div style={s.fbSub}>{fbReaction?.sub}</div>
                    {q.taunt && <div style={s.fbTaunt}>{q.taunt}</div>}
                    {!objectionShown
                      ? <button style={s.objectionBtn} onClick={() => setObjectionShown(true)}>異議あり！</button>
                      : <div style={s.objectionReply}>クイズで答えは1つです。以上です。</div>}
                  </>
                ) : (
                  <>
                    <div style={s.fbWrongMain}>✕　{fbReaction?.main}</div>
                    <div style={s.fbWrongSub}>{fbReaction?.sub}　正解は「{q.officialAnswer}」</div>
                  </>
                )}
              </div>
              <button style={s.nextBtn} onClick={handleNext}>
                {current + 1 >= TOTAL ? "結果へ →" : "次へ →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== RESULT ===== */}
      {phase === "result" && lastResult && (
        <div style={s.card} className="fadeUp">
          <p style={s.resultLabel}>RESULT</p>
          <div style={s.scoreLine}>
            <span style={s.scoreNum}>{lastResult.score}</span>
            <span style={s.scoreOf}>/ {TOTAL}問正解</span>
          </div>
          <p style={s.totalTimeDisp}>合計タイム　{lastResult.totalTime}秒</p>

          {/* 全力煽り or 通常コメント */}
          {allCorrectKnowledge ? (
            <div style={s.allTauntBox} className="flashBorder">
              {allCorrectTaunt.map((line, i) => (
                <p key={i} style={i === allCorrectTaunt.length - 1 ? s.allTauntRule : s.allTauntLine}>{line}</p>
              ))}
            </div>
          ) : (
            <div style={s.commentBox}>
              <p style={s.scoreComment}>{scoreComment}</p>
            </div>
          )}

          {isNewBest && <div style={s.newBestBanner}>🏆 自己ベスト更新！</div>}
          {best && !isNewBest && (
            <div style={s.bestRow}>🏆 自己ベスト　{best.score}/{TOTAL}問　{best.totalTime}秒</div>
          )}

          {robbedCount > 0 && (
            <div style={s.robbedBox}>
              <p style={s.robbedLine1}>
                あなたは {TOTAL}問中
              </p>
              <p style={s.robbedLine2}>
                <span style={s.robbedNum}>{robbedCount}問</span>
                <span style={s.robbedLine2b}>で正解を選び、不正解にされました。</span>
              </p>
              <p style={s.robbedRule}>クイズで答えは1つです。</p>
              <p style={s.robbedSub}>ご不満はご自身の胸の中にしまってください。</p>
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
                  {!r.isCorrect && r.isActuallyCorrect && <span style={s.riNote}> ← 正解でしたが不正解です</span>}
                </div>
                {!r.isCorrect && <div style={s.riOfficial}>正解（このクイズでは）：{r.officialAnswer}</div>}
                {!r.isCorrect && r.taunt && <div style={s.riTaunt}>{r.taunt}</div>}
              </div>
            ))}
          </div>

          <div style={s.actionRow}>
            <button style={s.shareBtn} onClick={handleShare}>𝕏 シェア</button>
            <button style={s.retryBtn} onClick={handleRetry}>もう一度やる</button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@400;700;900&family=M+PLUS+Rounded+1c:wght@400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fffbe8; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fadeUp { animation: fadeUp 0.35s cubic-bezier(.22,.68,0,1.2) both; }
        @keyframes wobble {
          0%,100% { transform: rotate(0deg); }
          20% { transform: rotate(-4deg) scale(1.05); }
          40% { transform: rotate(4deg) scale(1.05); }
          60% { transform: rotate(-3deg); }
          80% { transform: rotate(3deg); }
        }
        .wobble { animation: wobble 0.6s ease; }
        @keyframes flashBorder {
          0%,100% { border-color: #cc3333; box-shadow: 3px 3px 0 #cc3333; }
          50%      { border-color: #ff0000; box-shadow: 3px 3px 0 #ff0000, 0 0 12px #ff000055; }
        }
        .flashBorder { animation: flashBorder 1.2s ease infinite; }
        button:hover  { filter: brightness(0.93); transform: translateY(-1px); }
        button:active { transform: translateY(1px); filter: brightness(0.86); }
        button { transition: all 0.12s ease; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #fef9d0; }
        ::-webkit-scrollbar-thumb { background: #f5c518; border-radius: 3px; }
      `}</style>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#fffbe8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'M PLUS Rounded 1c', sans-serif", padding: "24px 16px", position: "relative" },
  dotBg: { position: "fixed", inset: 0, backgroundImage: "radial-gradient(circle, #f5c51840 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none", zIndex: 0 },
  card: { position: "relative", zIndex: 1, width: "100%", maxWidth: 540, background: "#ffffff", border: "3px solid #1a1a1a", borderRadius: 16, padding: "32px 28px", boxShadow: "6px 6px 0px #1a1a1a" },
  // START
  startEmoji: { fontSize: 64, textAlign: "center", marginBottom: 8 },
  startTitle: { fontFamily: "'Kaisei Decol', serif", fontSize: 36, fontWeight: 900, color: "#1a1a1a", textAlign: "center", marginBottom: 16 },
  bestBadge: { background: "#fff8e0", border: "2px solid #f5a623", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, color: "#b36a00", textAlign: "center", marginBottom: 16, boxShadow: "2px 2px 0 #f5a623" },
  startNote: { fontSize: 13, color: "#aaa", textAlign: "center", marginBottom: 4 },
  startNote2: { fontSize: 12, color: "#ccc", textAlign: "center", marginBottom: 24 },
  startBtn: { display: "block", width: "100%", padding: "16px", background: "#f5c518", border: "3px solid #1a1a1a", borderRadius: 10, fontSize: 18, fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, color: "#1a1a1a", cursor: "pointer", boxShadow: "4px 4px 0 #1a1a1a" },
  // QUIZ
  quizHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  qNum: { fontFamily: "'Kaisei Decol', serif", fontSize: 28, fontWeight: 900, color: "#f5c518", WebkitTextStroke: "2px #1a1a1a", flexShrink: 0 },
  pipRow: { display: "flex", gap: 5, flexWrap: "wrap" },
  pip: { width: 10, height: 10, borderRadius: "50%", background: "#e8e8e8", border: "2px solid #ccc" },
  pipDone: { background: "#f5c518", border: "2px solid #1a1a1a" },
  pipCurrent: { background: "#ff5a5a", border: "2px solid #1a1a1a" },
  timerWrap: { height: 8, background: "#eee", borderRadius: 4, overflow: "hidden", marginBottom: 4, border: "1.5px solid #ddd" },
  timerBar: { height: "100%", borderRadius: 4, transition: "width 0.1s linear, background 0.3s ease" },
  timerNum: { fontFamily: "'Kaisei Decol', serif", fontSize: 13, fontWeight: 700, textAlign: "right", marginBottom: 16, transition: "color 0.3s ease" },
  question: { fontSize: 22, fontWeight: 900, color: "#1a1a1a", lineHeight: 1.5, marginBottom: 24, fontFamily: "'Kaisei Decol', serif" },
  choices: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  choice: { padding: "14px 10px", background: "#fffbe8", border: "2.5px solid #1a1a1a", borderRadius: 10, color: "#1a1a1a", fontSize: 15, fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 700, cursor: "pointer", textAlign: "center", boxShadow: "3px 3px 0 #1a1a1a" },
  choiceCorrect: { background: "#d4f5d4", border: "2.5px solid #2d7a2d", boxShadow: "3px 3px 0 #2d7a2d", color: "#1a4a1a" },
  choiceWrong: { background: "#ffe0e0", border: "2.5px solid #cc3333", boxShadow: "3px 3px 0 #cc3333", color: "#7a0000" },
  choiceDim: { opacity: 0.35, boxShadow: "none" },
  feedbackBar: { marginTop: 20, background: "#fffbe8", border: "2.5px solid #1a1a1a", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" },
  fbLeft: { flex: 1, minWidth: 0 },
  fbCorrect: { display: "flex", alignItems: "center", gap: 10 },
  fbIcon: { fontSize: 22, flexShrink: 0 },
  fbText: { fontSize: 14, fontWeight: 700, color: "#2a7a2a" },
  fbTsukkomi: { fontSize: 15, fontWeight: 900, color: "#cc3333", fontFamily: "'Kaisei Decol', serif", marginBottom: 4 },
  fbSub: { fontSize: 12, color: "#888", fontStyle: "italic", lineHeight: 1.6, marginBottom: 4 },
  fbTaunt: { fontSize: 11, color: "#aaa", marginTop: 4, fontStyle: "italic", lineHeight: 1.5 },
  fbWrongMain: { fontSize: 15, fontWeight: 900, color: "#cc3333", fontFamily: "'Kaisei Decol', serif", marginBottom: 4 },
  fbWrongSub: { fontSize: 12, color: "#666", lineHeight: 1.6 },
  objectionBtn: { marginTop: 8, padding: "5px 12px", background: "#fff", border: "2px solid #1a1a1a", borderRadius: 6, fontSize: 12, fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, color: "#1a1a1a", cursor: "pointer", boxShadow: "2px 2px 0 #1a1a1a" },
  objectionReply: { marginTop: 8, fontSize: 13, fontWeight: 900, color: "#cc3333", fontFamily: "'Kaisei Decol', serif" },
  nextBtn: { padding: "10px 18px", background: "#1a1a1a", border: "none", borderRadius: 8, color: "#f5c518", fontSize: 14, fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, alignSelf: "center" },
  // RESULT
  resultLabel: { fontFamily: "'Kaisei Decol', serif", fontSize: 12, letterSpacing: 4, color: "#aaa", marginBottom: 8, textAlign: "center" },
  scoreLine: { textAlign: "center", marginBottom: 4 },
  scoreNum: { fontFamily: "'Kaisei Decol', serif", fontSize: 80, fontWeight: 900, color: "#f5c518", WebkitTextStroke: "3px #1a1a1a", lineHeight: 1 },
  scoreOf: { fontSize: 20, color: "#555", marginLeft: 8 },
  totalTimeDisp: { textAlign: "center", fontSize: 14, color: "#888", marginBottom: 10 },
  commentBox: { marginBottom: 14 },
  scoreComment: { fontSize: 14, color: "#555", textAlign: "center", lineHeight: 1.7, fontStyle: "italic" },
  allTauntBox: { background: "#fff0f0", border: "2.5px solid #cc3333", borderRadius: 10, padding: "18px 20px", marginBottom: 16, textAlign: "center" },
  allTauntLine: { fontSize: 14, color: "#555", lineHeight: 2, marginBottom: 2 },
  allTauntRule: { fontSize: 16, fontWeight: 900, color: "#cc3333", fontFamily: "'Kaisei Decol', serif", marginTop: 8 },
  newBestBanner: { background: "#f5c518", border: "2.5px solid #1a1a1a", borderRadius: 10, padding: "10px", textAlign: "center", fontWeight: 900, fontSize: 16, color: "#1a1a1a", marginBottom: 12, boxShadow: "3px 3px 0 #1a1a1a" },
  bestRow: { background: "#fff8e0", border: "2px solid #f5a623", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, color: "#b36a00", textAlign: "center", marginBottom: 12 },
  robbedBox: { background: "#fff0f0", border: "2.5px solid #cc3333", borderRadius: 10, padding: "16px 18px", marginBottom: 16, textAlign: "center", boxShadow: "3px 3px 0 #cc3333" },
  robbedLine1: { fontSize: 13, color: "#888", marginBottom: 4 },
  robbedLine2: { display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 8, flexWrap: "wrap" },
  robbedNum: { fontSize: 36, fontWeight: 900, fontFamily: "'Kaisei Decol', serif", color: "#cc3333", WebkitTextStroke: "1.5px #7a0000", lineHeight: 1 },
  robbedLine2b: { fontSize: 14, color: "#555", fontWeight: 700 },
  robbedRule: { fontSize: 15, fontWeight: 900, color: "#cc3333", fontFamily: "'Kaisei Decol', serif", marginBottom: 4 },
  robbedSub: { fontSize: 11, color: "#aaa", fontStyle: "italic" },
  resultList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 20, maxHeight: 280, overflowY: "auto" },
  resultItem: { border: "2px solid #e8e8e8", borderRadius: 8, padding: "10px 12px" },
  riCorrect: { background: "#f0fff0", borderColor: "#b8e0b8" },
  riRobbed: { background: "#fff0f0", borderColor: "#f5a0a0" },
  riWrong: { background: "#fafafa", borderColor: "#e0e0e0" },
  riHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  riQ: { fontSize: 11, color: "#999" },
  riTime: { fontSize: 11, color: "#bbb", fontFamily: "'Kaisei Decol', serif" },
  riA: { fontSize: 14, fontWeight: 700, color: "#1a1a1a" },
  riNote: { fontSize: 11, color: "#cc3333", fontWeight: 700 },
  riOfficial: { fontSize: 11, color: "#999", marginTop: 2 },
  riTaunt: { fontSize: 11, color: "#bbb", marginTop: 3, fontStyle: "italic" },
  actionRow: { display: "flex", gap: 10 },
  shareBtn: { flex: 1, padding: "14px", background: "#1a1a1a", border: "2.5px solid #1a1a1a", borderRadius: 10, fontSize: 15, fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, color: "#fff", cursor: "pointer", boxShadow: "4px 4px 0 #555" },
  retryBtn: { flex: 1, padding: "14px", background: "#fff", border: "2.5px solid #1a1a1a", borderRadius: 10, fontSize: 15, fontFamily: "'M PLUS Rounded 1c', sans-serif", fontWeight: 900, color: "#1a1a1a", cursor: "pointer", boxShadow: "4px 4px 0 #1a1a1a" },
};

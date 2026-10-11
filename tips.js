// 読解 strategy guide (v27). Sections are rendered as collapsible <details>.
window.TIPS={
intro:"N1 読解 rewards finding the <b>evidence sentence</b>, not general understanding. Every correct choice is a paraphrase (言い換え) of something the text actually says.",
sections:[
{id:"flow",title:"1. General workflow 解き方の流れ",html:`
<ol class="steps">
<li><b>Read the question (設問) first.</b> Know what you're looking for: 筆者の考え? the meaning of an underlined part (下線部)? a reason (なぜ)? a condition (情報検索)?</li>
<li><b>Mark the keyword or underline</b> in the passage. For 下線部 questions, the answer is almost always in the sentences right before or after it.</li>
<li><b>Read the passage once, at normal speed</b>, paying attention to signal words (逆接 しかし, まとめ つまり…). Don't translate every word.</li>
<li><b>Find the evidence (根拠) sentence</b> and say it in your own words before looking at the choices.</li>
<li><b>Eliminate (消去法).</b> Cross out each wrong choice for a concrete reason: not stated, reversed, too extreme, etc. (see section 4).</li>
<li><b>Don't use outside knowledge.</b> A choice that is "true in real life" but not in the text is wrong.</li>
</ol>
<div class="tbox"><b>⏱ Time budget</b> (rough guide): the N1 言語知識・読解 paper is 110 minutes. Leave about 30 min for 文字・語彙・文法 and spend about 80 min on 読解:
<ul><li>内容理解（短文）about 2–3 min each</li><li>内容理解（中文）about 4–5 min per passage</li><li>内容理解（長文）about 10 min</li><li>統合理解 about 6–7 min</li><li>主張理解（長文）about 10–12 min</li><li>情報検索 about 6–7 min</li></ul>
If you get stuck, choose your best guess, mark it, and move on.</div>`},
{id:"types",title:"2. Techniques by question type 問題別",html:`
<details class="tsub"><summary>内容理解（短文・中文・長文）</summary>
<ul>
<li><b>筆者の考え／筆者が言いたいこと</b>: usually in the <b>last paragraph</b> or the last sentence. Look for ～のではないだろうか, ～べきだ, ～必要がある, ～と思う, やはり.</li>
<li><b>下線部「～」とはどういうことか</b>: read 1–2 sentences around the underline. The answer often comes right after it (～とは…ということだ, つまり…).</li>
<li><b>指示語 (それ・この・そのような)</b>: refers back to something earlier, usually the nearest matching noun or idea. Put your answer in place of それ and check that the sentence still makes sense.</li>
<li><b>なぜ／理由</b>: look for から・ため・ので・というのは～からだ near the keyword.</li>
<li><b>Trap:</b> one choice often repeats the <i>opinion the writer criticizes</i> (かつては…, …と考える人もいるが).</li>
</ul>
<div class="ex"><b>Example (q86)</b>: 筆者の考えに合うのはどれか → the last line 「真の実力をつけるには、やはり練習でも常に全力投球する姿勢が必要です」 = choice 4. Choice 1 is the 甘い attitude the writer rejects.</div>
<div class="ex"><b>Example (q94)</b>: 「正しい怒り」の罠とはどういうことか → the very next sentence explains it: 「怒っている私こそが正しいのだ」と私を正義の側に置いてしまう = choice 2.</div>
<div class="ex"><b>Example (q89)</b>: the key sentence uses こそ: 「適切に依存し…自覚しているものこそ自立している」. Choice 2 (依存を少なくする) is the old view marked by かつては.</div>
</details>
<details class="tsub"><summary>統合理解（A・B）</summary>
<ul>
<li>First find <b>each writer's stance</b> in one line: A = ○○, B = ××.</li>
<li>Questions are usually <b>common point (共通している点)</b> or <b>difference (どのように述べているか)</b>.</li>
<li>Choices often follow the pattern <b>「Aは～と述べ、Bは～と述べている」</b>. Check the A half and the B half <i>separately</i>; if either half is wrong, the whole choice is wrong.</li>
<li>"AもBも～" choices: make sure <b>both</b> writers actually say it.</li>
</ul>
<div class="ex"><b>Example (q101)</b>: A = あきらめてよい場合がある, B = やり尽くしてから考えるべき → choice 4. Choice 3 gets B backwards (B says thinking "it's OK to quit" makes you unable to keep going).</div>
<div class="ex"><b>Example (q102)</b>: common point → A 「悔やみつつやめるのは避けたい」 + B 「くよくよしたりするのではなく」 = don't regret (choice 4). "Think about the cause" is B only.</div>
</details>
<details class="tsub"><summary>主張理解（長文）</summary>
<ul>
<li>A long essay with a clear argument. Look for the <b>problem → writer's claim → reason</b> structure.</li>
<li>The claim usually appears after <b>しかし／だが</b>, in a <b>そうではなくて</b> sentence, or in the conclusion (つまり, このように).</li>
<li>The last question (筆者の主張) is answered by the final paragraph, but check that the choice doesn't add conditions the writer never set.</li>
</ul>
<div class="ex"><b>Example (q97)</b>: 「ここで必要なのは、両者のバランスを取ろうとすることではない。<u>そうではなくて</u>、このふたつの読み方を意識的に往来することなのだ」. The sentence after そうではなくて is the claim.</div>
</details>
<details class="tsub"><summary>情報検索</summary>
<ul>
<li><b>Read the questions first</b> and list the conditions: who, which day (平日／土日), which period, what time, what they want to do.</li>
<li><b>Scan</b> the notice for only the parts you need, using headings like【貸し出し】 and tables.</li>
<li>Watch for <b>※ notes, exceptions (ただし, のみ, 以降, まで), and differences between places, periods or member types.</b></li>
<li>Do the arithmetic carefully (閉館15分前, 2週間, 次の平日).</li>
</ul>
<div class="ex"><b>Example (q106)</b>: Friday (平日) and the card is needed by Saturday night. Applying on a weekday 9–17 gives the card the same day; applying on Saturday gives it on the next weekday, which is too late → choice 1.</div>
<div class="ex"><b>Example (q107)</b>: 文学部図書館, 授業期間, Tuesday → closes 21:00; borrowing until 15 min before closing, copying until closing → choice 2. The traps use the 中央図書館 rules (30/10 min).</div>
</details>
<details class="tsub"><summary>文章の文法（text grammar）</summary>
<ul>
<li>Read the sentences <b>before and after</b> the blank; the logic (cause, contrast, conclusion) decides the answer.</li>
<li>The blank often <b>summarizes</b> (というわけだ), <b>speaks to the reader</b> (～てください, ～でしょう), or <b>emphasizes</b> (～てこそ).</li>
</ul>
<div class="ex"><b>Example (q83)</b>: 「やはり実際に（　）本当の共感は生まれる」 — the previous sentence says phone or mail isn't enough → 会ってこそ ("only by meeting").</div>
</details>`},
{id:"signals",title:"3. Signal words 注目する言葉",html:`
<table class="sig"><thead><tr><th>Word</th><th>Function</th><th>What to do</th></tr></thead><tbody>
<tr><td>つまり／すなわち／要するに</td><td>restatement, summary</td><td>The next part is the point. Answers often paraphrase it.</td></tr>
<tr><td>しかし／だが／ところが</td><td>turn (逆接)</td><td>The main point comes <b>after</b> it.</td></tr>
<tr><td>もちろん～が／確かに～しかし</td><td>concession</td><td>The first part is conceded; the writer's real claim follows.</td></tr>
<tr><td>むしろ</td><td>"rather; on the contrary"</td><td>Rejects the expected view; what follows is the writer's view.</td></tr>
<tr><td>～こそ</td><td>emphasis</td><td>Marks the key element (q89 ものこそ自立, q83 会ってこそ).</td></tr>
<tr><td>～のではないだろうか／～ではないか</td><td>soft assertion</td><td>This <b>is</b> the writer's opinion, not a doubt.</td></tr>
<tr><td>～べきだ／～必要がある／～なければならない</td><td>claim, recommendation</td><td>Strong candidate for 筆者の主張.</td></tr>
<tr><td>～と思う／～と考える</td><td>writer's opinion</td><td>Check whether it's the writer's view or someone else's (～と考える人もいる).</td></tr>
<tr><td>だから／したがって／そのため</td><td>result, conclusion</td><td>Cause before, conclusion after; good for なぜ questions.</td></tr>
<tr><td>そうではなくて</td><td>correction</td><td>Rejects one idea and gives the real point (q97).</td></tr>
<tr><td>かつては／～と言われてきた</td><td>old or common view</td><td>Often the view the writer is about to reject (q89).</td></tr>
</tbody></table>`},
{id:"traps",title:"4. Choice-elimination traps ひっかけ",html:`
<ul class="traps">
<li><b>Too extreme (言い過ぎ)</b>: 必ず, 絶対, だけ, しか, すべて, 決して. The text says "often" but the choice says "always."</li>
<li><b>Not stated (本文にない)</b>: sounds reasonable but has no evidence in the text (q86 choice 3, q102 choice 3).</li>
<li><b>Reversed (逆)</b>: cause and effect swapped, or the opposite of what was said (q101 choice 3 for B).</li>
<li><b>Partly true (一部だけ正しい)</b>: the first half matches and the second half doesn't. Check every part.</li>
<li><b>Mixes A and B (A・Bの混同)</b>: says "AもBも" for something only one writer said (q102 choice 1).</li>
<li><b>Passage words, wrong meaning</b>: copies words from the text but links them wrongly (q88 choice 3 links "stronger evidence" to "complex," but the text links it to "more serious results").</li>
<li><b>Someone else's opinion</b>: the view the writer quotes in order to criticize (q89 choice 2, q86 choice 1).</li>
<li><b>Wrong scope</b>: right idea, but about the wrong subject, place or time (q107: rules of the other library).</li>
</ul>`}
],
hints:{
"内容理解":"Read the question first. 筆者の考え → check the last paragraph. 下線部 → read just before and after it. Find the evidence sentence, then eliminate choices that are not stated, reversed, or too extreme.",
"統合理解":"Sum up A and B in one line each. For 「Aは～、Bは～」 choices, check each half separately; for 「AもBも」, confirm that both writers say it.",
"主張理解":"Find problem → claim → reason. The claim follows しかし / そうではなくて / つまり, usually near the end.",
"情報検索":"List the conditions in the question (day, period, time, place, person). Scan only the relevant parts, and watch ※ notes, ただし, のみ, and differences between places or periods.",
"文章の文法":"Read the sentences before and after the blank. Decide the logic (reason, contrast, conclusion, address to the reader) first, then pick the form."
}};

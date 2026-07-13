《屎命必達》Codex 分段開發 Prompt 與驗收手冊
最終優化版 V2.0
來源需求：pupu_game_plan.txt
用途：以可回退、可測試、可逐段驗收的方式，驅動 Codex 完成網頁遊戲開發

============================================================
0. 最短使用說明
============================================================

這份手冊不是一次全部貼給 Codex。

第一次建立專案：
1. 先貼「MASTER：全域開發契約」。
2. 接著貼「Prompt 00」。
3. Codex 完成後，只能把階段標成 READY_FOR_REVIEW 或 BLOCKED。
4. 由你依人工驗收表決定是否標成 PASS。
5. PASS 後才貼下一個 Prompt。

開啟新的 Codex 工作階段：
1. 貼「MASTER：全域開發契約」。
2. 貼目前要執行的單一階段 Prompt。
3. 不要同時貼兩個階段。

每個階段完成後：
1. 使用「AUDIT：階段審查 Prompt」要求 Codex 只審查、不先改碼。
2. 你執行人工驗收。
3. 有問題就使用「FIX：驗收失敗修復 Prompt」。
4. 通過後更新 docs/STATUS.md 為 PASS，再建立 checkpoint。
5. 到指定里程碑時執行對應的 Release Gate Prompt。

Git 原則：
- Codex 不得自行 push。
- Codex 不得使用 git reset --hard、git clean -fd、force push 或覆蓋不明變更。
- 是否 commit 由你決定；建議在人工驗收 PASS 後 commit。
- 建議 commit：
  feat(phase-XX): <階段名稱>
- 修復 commit：
  fix(phase-XX): <修復摘要>

判定原則：
- 「程式能啟動」不等於完成。
- 「畫面看得到」不等於驗收通過。
- 「寫了測試」不等於測試已執行。
- 「Codex 說 PASS」不等於人工已驗收。
- 無法執行測試時，只能標 BLOCKED，不得推測通過。

============================================================
1. 產品真相與不可違反條件
============================================================

pupu_game_plan.txt 是產品意圖的主要來源。
本手冊負責開發順序、工程邊界與驗收方式。

發生衝突時：
- 玩法意義與體驗承諾：以 pupu_game_plan.txt 為準。
- 實作順序與單階段範圍：以目前階段 Prompt 為準。
- 技術變更：必須寫入 docs/DECISIONS.md，不得默默改變。
- 不可逆或會破壞既有資料的決策：停止並標 BLOCKED。

產品不可變條件：
1. 遊戲名稱：《屎命必達》。
2. 2D 橫向捲軸；路人由右側出現並向左移動。
3. 玩家位於下方頂樓，只能左右移動。
4. 玩家以可學習、可預測的拋物線投擲。
5. 路人被合法命中後停止、怒罵、恢復向左移動，之後可再次被合法命中。
6. 得分事件是「路人開始怒罵」，不是單純碰撞 callback。
7. 核心張力是連擊／高分與抓包風險之間的取捨。
8. 特殊大便必須提供不同戰術用途，不能只是後期數值全面取代前期。
9. 正式劇情模式共 10 關，每關新增新的決策，而不是只提高速度與數量。
10. 視覺調性為誇張卡通、荒謬但不寫實噁心，不呈現血腥或嚴重傷害。
11. 不使用隱藏命中機率；失敗原因必須可理解。
12. 隨機行為必須可 seed、可重現、可測試。
13. MVP 不依賴後端；存檔先使用 LocalStorage。
14. 核心玩法成立前，不投入大量正式美術與內容。

============================================================
2. 開發地圖與 Release Gates
============================================================

Foundation
- Prompt 00：專案契約
- Prompt 01：工具鏈與場景
- Prompt 02：畫面與座標
- Prompt 03：玩家與輸入
- Prompt 04：投擲物理
- Gate A：技術與手感基線

Core Loop
- Prompt 05：基礎 NPC
- Prompt 06：命中與怒罵
- Prompt 07：計分與連擊
- Prompt 08：抓包與失敗
- Gate B：核心循環 MVP

Tactical Vertical Slice
- Prompt 09：前三種戰術大便
- Prompt 10：完整大便系統
- Prompt 11：完整 NPC 系統
- Prompt 12：關卡框架與第 1 關
- Gate C：垂直切片

Campaign
- Prompt 13～21：第 2～10 關
- Gate D：完整十關

Polish and Meta
- Prompt 22：手感、音效、開場
- Prompt 23：存檔、解鎖、模式
- Prompt 24：手機、響應式、無障礙
- Gate E：產品體驗

Release Candidate
- Prompt 25：測試、效能、平衡與發布
- Gate F：Release Candidate

硬性規則：
- Gate 未通過，不進入下一個大區段。
- 任一階段有 Blocker 或 Critical 問題，不得標 PASS。
- 後續階段若暴露前期架構缺陷，先建立最小修復 Prompt，不得順便重寫整個系統。

============================================================
3. 全域工程架構契約
============================================================

建議技術基線：
- TypeScript strict
- Phaser 3
- Vite
- Vitest
- Playwright
- ESLint
- Prettier
- HTML5 Canvas
- Web Audio API
- LocalStorage
- JSON 或 TypeScript data definitions
- 16:9 基準畫面，響應式等比例縮放

套件管理：
- 只使用一種 package manager。
- 以現有 lockfile 判斷，不任意更換。
- 新增依賴前先說明用途、替代方案、bundle 影響與維護風險。
- 不因小功能加入大型依賴。

建議責任分層：
src/
  app/          啟動、場景組裝、依賴注入
  scenes/       Phaser Scene 與生命週期
  domain/       純規則、狀態機、公式、資料型別
  systems/      將 domain 規則協調成遊戲系統
  entities/     Phaser entity adapter／view
  data/         NPC、大便、關卡、平衡設定
  ui/           HUD、選單、結算、觸控介面
  platform/     storage、audio、input、clock、rng
  assets/       資產 manifest 與 placeholder
  debug/        除錯與平衡工具
tests/
  unit/
  integration/
  e2e/
docs/
  phases/
  evidence/

架構不變量：
1. 純計算邏輯不能依賴 Phaser Scene。
2. Phaser 物件不能成為唯一遊戲狀態來源。
3. UI 只能顯示 domain state，不得自行改分、改警戒或判定成功。
4. 所有時間邏輯使用 GameClock／遊戲 delta，不直接依賴 wall-clock。
5. 所有隨機邏輯使用可注入 seeded RNG。
6. definition 是唯讀資料；runtime state 與 definition 分離。
7. 事件必須強型別，具有 eventId、sessionId 與必要 payload。
8. 場景 shutdown、restart、retry 必須解除 listener、timer、audio、particle 與 object pool 借用。
9. 關卡、NPC、大便、計分、警戒與星級條件資料驅動。
10. debug 工具不得成為 production 規則的唯一入口。
11. 不使用大型 type switch 處理所有 NPC 或所有彈藥；優先 capability、strategy、tag 與 interaction matrix。
12. 任一成功／失敗／階段轉移必須有一次性 latch，避免同幀重入。
13. 每次重試建立新的 LevelSession；舊 session 事件必須失效。
14. 任何可造成無界增長的物件都必須有上限、回收與統計。

命名與資料：
- Scene key、event name、state name 由集中型別或常數管理。
- magic number 必須進設定檔或具名常數。
- 未知設定不得靜默變成 undefined。
- LevelDefinition 等外部資料載入時必須 runtime validate。
- TODO／FIXME 必須附 phase 或 issue id。

測試原則：
- 純 domain 邏輯以 unit test 為主。
- Phaser 組裝以 integration／e2e 為主。
- 新增或修改的 domain 決策分支必須有測試。
- 物理、計分、狀態機與存檔使用固定 fixture／golden cases。
- UI 關鍵流程至少有 Playwright 冒煙測試。
- 相同 seed、相同輸入事件序列應得到相同結果。

============================================================
4. 單階段標準工作流
============================================================

Codex 每次必須依序執行：

A. Preflight：只讀盤點
1. 讀取 AGENTS.md 與 docs。
2. 執行 git status --short。
3. 辨識 package manager、lockfile、Node 版本與 scripts。
4. 不覆蓋現有未提交變更。
5. 執行本階段相關 baseline 測試；記錄既有失敗。
6. 讀取前一階段 evidence 與 STATUS。
7. 確認前置階段為 PASS；否則標 BLOCKED。
8. 列出本階段預計修改檔案與理由。
9. 若預估修改超過約 15 個程式檔或 800 行非資料／非測試程式碼，先說明為何不能再拆小。
10. 未經必要，不提問阻塞；對可逆的小決策採合理預設並寫入 DECISIONS。

B. Implement：最小完整增量
1. 先做最小可驗收路徑。
2. 純規則先寫測試或同步補測試。
3. 不提前實作下一階段。
4. 不順便格式化整個 repository。
5. 不進行無關重構。
6. 不刪除不理解的程式。
7. 不使用假資料掩蓋流程錯誤；placeholder 只能替代資產。
8. 發現前期缺陷時，做最小兼容修補並明確回報。

C. Verify：由窄到廣
1. 執行新增功能的 targeted tests。
2. 執行受影響模組測試。
3. 執行 lint。
4. 執行 typecheck。
5. 執行 unit／integration。
6. 執行 build。
7. 涉及 UI 或流程時執行 e2e。
8. 檢查 browser console。
9. 檢查 retry／scene switch／pause／resize。
10. 無法執行即標 BLOCKED；不得用「理論上會通過」。

D. Evidence：留下可稽核證據
每階段建立或更新：
- docs/phases/PHASE_XX.md
- docs/evidence/PHASE_XX.md
- docs/STATUS.md：標 READY_FOR_REVIEW 或 BLOCKED
- screenshots／trace／report 可放 artifacts/phase-XX/，並在 evidence 引用路徑

證據至少包含：
- Git status
- 實際命令
- exit code
- 測試數量與結果
- 變更檔案
- 手動驗收步驟
- 固定 seed
- 預期與實際
- 已知限制
- 是否有 baseline 既有失敗

E. Stop
- 完成回報後停止。
- 不自行貼下一階段。
- 不自行把 STATUS 改為 PASS。
- 不自行 push。

============================================================
5. Definition of Ready／Done
============================================================

Definition of Ready：
- 前置階段由人工標 PASS。
- 本階段目標、非目標與驗收條件清楚。
- repository 沒有未知的破壞性狀態。
- baseline 失敗已記錄。
- 需要的資料與 placeholder 可取得。
- 不存在必須先做的 Blocker。

Definition of Done：
1. 本階段所有必要功能已完成。
2. 所有驗收條件都有證據。
3. targeted tests 通過。
4. lint、typecheck、build 通過。
5. 適用的 unit、integration、e2e 通過。
6. browser console 無未處理錯誤。
7. retry／scene restart 不殘留 listener、timer、entity 或舊 session state。
8. 規則與數值已資料化。
9. 文件與程式一致。
10. 沒有無說明的 any、ts-ignore、eslint-disable。
11. 沒有未標記的 TODO／FIXME。
12. 沒有提前塞入下一階段。
13. STATUS 為 READY_FOR_REVIEW。
14. 人工驗收完成後，才可由人改為 PASS。

嚴重度：
- Blocker：無法啟動、資料損毀、無法完成流程、無法建置。
- Critical：主要規則錯誤、可無限刷分、狀態污染、重試失效、重大輸入錯誤。
- Major：重要回饋不清、部分裝置不可玩、明顯平衡或效能問題。
- Minor：不阻塞核心流程的表現與細節問題。

PASS 門檻：
- Blocker = 0
- Critical = 0
- 本階段驗收全通過
- Major 若暫緩，必須記錄原因、影響與修復階段

============================================================
6. MASTER：全域 Codex 開發契約
============================================================

【每個新 Codex 工作階段先貼此段】

你是《屎命必達》專案的資深遊戲架構師、TypeScript／Phaser 工程師、測試工程師與技術審查者。

你的目標不是一次完成整款遊戲，而是只交付目前指定階段的一個可執行、可測試、可回退、可人工驗收的增量。

強制規則：
1. 先讀取 repository、AGENTS.md、pupu_game_plan.txt 與 docs，再修改。
2. 先執行 git status --short；不得覆蓋或清除使用者既有變更。
3. 禁止 git reset --hard、git clean -fd、force push。
4. 不自行 push；不自行把階段標為 PASS。
5. 只做目前階段；不得提前實作下一階段。
6. 不做無關大型重構，不全面格式化 repository。
7. 純規則與 Phaser 顯示層分離。
8. 時間、隨機、狀態與資料必須可注入、可重現、可測試。
9. 關卡、NPC、大便、分數與警戒必須資料驅動。
10. 不使用隱藏命中率。
11. 不以 placeholder 偽造規則完成；placeholder 只替代美術或音效。
12. 不宣稱測試通過，除非實際執行並提供命令與 exit code。
13. 若環境無法執行必要測試，標 BLOCKED。
14. 發現不可逆決策、使用者資料風險或前置階段未 PASS 時，停止並標 BLOCKED。
15. 對可逆的小型未知採合理預設，寫入 docs/DECISIONS.md，不用無限提問阻塞。
16. 完成後更新 docs/phases、docs/evidence、docs/STATUS，然後停止。

開始前輸出：
【Preflight】
- 當前 phase
- repository 狀態
- package manager／Node／scripts
- 前置階段狀態
- baseline 測試結果
- 預計修改檔案
- 風險與可逆假設
- 明確非目標

完成後固定輸出：
【狀態】READY_FOR_REVIEW 或 BLOCKED

【完成摘要】
- 完成
- 刻意未做

【變更檔案】
- 新增
- 修改
- 刪除

【架構決策】
- 決策
- 理由
- 代價
- 是否更新 DECISIONS

【測試證據】
- 命令
- exit code
- 通過／失敗
- 測試數
- baseline 與 regression 區分

【手動驗收】
1. 啟動方式
2. 固定 seed／關卡
3. 操作步驟
4. 預期行為
5. 證據路徑

【驗收對照】
逐條列出本階段條件：
- MET：有證據
- NOT MET：原因
- BLOCKED：阻塞條件

【已知限制】
- 嚴重度
- 影響
- 預計修復階段

【下一階段風險】
只列風險，不實作。

完成後停止。

============================================================
7. 分段 Codex Prompts
============================================================

============================================================
Prompt 00：專案盤點、技術定案與開發契約
區段：Foundation
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：00｜專案盤點、技術定案與開發契約
前置依賴：無；這是第一階段。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
建立可持續交付的專案基線。此階段不實作正式玩法，只盤點現況、固定架構與建立驗收文件。

【必須完成】
1. 讀取完整 repository；若是空專案，提出並採用 Phaser 3 + TypeScript + Vite + Vitest + Playwright。
2. 讀取 pupu_game_plan.txt；把需求分成核心玩法、內容、表現、長期模式四類。
3. 建立 docs/CODEX_CONTRACT.md，內容涵蓋範圍控制、測試、回報格式與禁止事項。
4. 建立 docs/ARCHITECTURE.md，至少定義 scenes、domain、systems、entities、data、ui、assets、tests 的責任邊界。
5. 建立 docs/ROADMAP.md，列出本手冊所有階段與依賴。
6. 建立 docs/ACCEPTANCE.md，提供每階段驗收勾選表。
7. 建立 docs/DECISIONS.md，以 ADR 簡表記錄技術選擇。
8. 定義目錄結構、命名規範、事件流、資料驅動原則、seeded RNG 原則。
9. 盤點未知需求與技術風險，但不要用提問阻塞；採用可逆的合理預設並明確記錄。
10. 在 repository 根目錄建立 AGENTS.md，將不可違反的開發契約、當前技術棧、測試命令、範圍控制與回報格式寫入，讓新 Codex 工作階段能自動取得專案規則。
11. 建立 docs/PRODUCT_INVARIANTS.md，記錄玩法不可變條件：NPC 由右向左、玩家只在頂樓左右移動、投擲可預測、命中後怒罵再恢復、怒罵事件才得分、特殊大便必須有戰術取捨、10 關。
12. 建立 docs/STATUS.md，狀態只允許 NOT_STARTED、IN_PROGRESS、READY_FOR_REVIEW、BLOCKED、PASS；Codex 不得自行將階段標成 PASS。
13. 建立 docs/QUALITY_GATES.md，定義自動化、人工、效能、回歸與證據門檻。
14. 建立 docs/phases/ 與 docs/evidence/ 目錄規範；每階段需有規格與驗收證據文件。
15. 記錄 baseline：目前可執行命令、既有失敗測試、dirty worktree、Node 版本、套件管理器與 lockfile。

【必要測試】
1. 確認現有 install、lint、typecheck、test、build 是否可執行。
2. 若目前尚無專案，不必在此階段完成遊戲 scaffold，但需確認 Node 與套件管理策略。

【驗收條件】
- [ ] AGENTS.md、PRODUCT_INVARIANTS、CODEX_CONTRACT、ARCHITECTURE、ROADMAP、ACCEPTANCE、DECISIONS、STATUS、QUALITY_GATES 均存在且互相一致。
- [ ] ARCHITECTURE 清楚區分純 domain、Phaser adapter、UI、data、assets 與 tests。
- [ ] ROADMAP 明確說明 26 個階段、6 個 Release Gate、依賴與不可提前項目。
- [ ] STATUS 記錄目前階段與 baseline；Codex 未自行標示 PASS。
- [ ] 未知假設與可逆預設已寫入 DECISIONS，而不是埋在程式碼。
- [ ] 沒有實作正式遊戲功能，也沒有大量加入資產。

【本階段禁止提前實作】
- 玩家移動、投擲、NPC、計分等正式功能。

【必留證據】
1. docs/phases/PHASE_00.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_00.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 01：專案骨架、工具鏈與場景生命週期
區段：Foundation
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：01｜專案骨架、工具鏈與場景生命週期
前置依賴：Prompt 00 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
建立可以穩定啟動、建置、測試的 Phaser 遊戲骨架。

【必須完成】
1. 若專案為空，建立 Vite + TypeScript + Phaser 3 專案；若已有專案，保留既有工具鏈。
2. 啟用 TypeScript strict。
3. 建立 BootScene、PreloadScene、MenuScene、GameScene、HUDScene 或等價清楚分層。
4. 建立 GameConfig、SceneKeys、事件匯流排與集中式常數／設定入口。
5. 建立 placeholder 資產策略，確保無正式圖片也能啟動。
6. 建立基準 16:9 畫布與 scale mode；視窗縮放時保持可玩區域。
7. 建立開發模式 debug flag。
8. 提供 npm scripts：dev、build、lint、typecheck、test、test:e2e。
9. 加入一個最小主選單，可開始進入空白 GameScene，也可返回主選單。
10. 固定單一套件管理器與 lockfile；不可同時存在 npm、pnpm、yarn 的多份 lockfile。
11. 在 package.json 定義 engines 或在文件記錄支援 Node 版本。
12. 為場景切換與事件匯流排建立 dispose／shutdown 規則，避免重進場景時重複 listener。
13. 新增最小 CI 等價命令（可為 npm run verify），依序執行 lint、typecheck、test、build。

【必要測試】
1. Vitest：GameConfig 與純工具函式測試。
2. Playwright：首頁可載入、點擊開始後進入遊戲場景、Console 無未處理錯誤。

【驗收條件】
- [ ] npm run dev 可啟動。
- [ ] npm run build 成功。
- [ ] 主選單到遊戲場景的流程可操作。
- [ ] 重整頁面不會白屏。
- [ ] 視窗縮放後畫面仍維持比例。
- [ ] 所有 lint、typecheck、unit、e2e 測試通過。

【本階段禁止提前實作】
- 正式背景、角色控制、投擲、關卡內容。

【必留證據】
1. docs/phases/PHASE_01.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_01.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 02：畫面分層、巷弄軌道與視差場景
區段：Foundation
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：02｜畫面分層、巷弄軌道與視差場景
前置依賴：Prompt 01 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
建立符合企劃的空間語言，讓玩家一眼理解上方城市、中間巷弄、下方頂樓的關係。

【必須完成】
1. 將可玩畫面劃分為城市遠景約 25%、巷弄約 45%、頂樓約 30%。
2. 建立至少三層視差背景；使用 placeholder 幾何圖形即可。
3. 建立三條巷弄深度軌道：前排道路、中排人行道、後排店面區。
4. 定義每條 lane 的 y、scale、depth、基礎速度倍率。
5. 建立頂樓可移動區域、左右邊界、至少兩個預留掩體區。
6. 建立 CameraLayout／WorldLayout 純資料模型，避免位置散落硬編碼。
7. 加入 debug overlay，可切換顯示分區、lane、邊界與座標。
8. 所有世界位置以單一基準座標系統定義，再由 scale／camera 轉換；不得把不同解析度的像素值散落在 Scene。
9. 建立 z-order／depth 規約，確保後續 projectile、NPC、HUD、粒子不互相遮蔽。

【必要測試】
1. Vitest：各解析度下的 layout 計算、lane 順序與邊界。
2. Playwright：至少測試 1280×720、1920×1080、390×844，不出現致命遮擋或畫布溢位。

【驗收條件】
- [ ] 畫面明確呈現三大垂直區塊。
- [ ] 三條 lane 可由 debug overlay 辨識。
- [ ] 遠景、中景、近景捲動速度不同。
- [ ] resize 後 lane 與頂樓邊界仍正確。
- [ ] 目前沒有 NPC 也可以驗收空間結構。

【本階段禁止提前實作】
- 玩家控制、碰撞、正式美術。

【必留證據】
1. docs/phases/PHASE_02.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_02.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 03：玩家左右移動與輸入抽象層
區段：Foundation
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：03｜玩家左右移動與輸入抽象層
前置依賴：Prompt 02 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成只允許左右移動、手感穩定、可同時支援鍵盤與未來觸控的玩家控制。

【必須完成】
1. 建立 InputAdapter，將鍵盤與觸控轉為相同的 left、right、throw、aim、switchPrev、switchNext actions。
2. 桌機支援 A/D 與左右方向鍵。
3. 玩家只能在頂樓可移動範圍左右移動，不可上下與跳躍。
4. 加入加速度、減速度、最大速度參數，全部資料化。
5. 同時按左右時採用明確且可測試的規則。
6. 視窗失焦、切換分頁或 pause 時清除卡鍵狀態。
7. 使用 placeholder 角色，至少有 idle、move、nervous 三種可辨識狀態。
8. 加入開發模式速度與碰撞邊界顯示。
9. InputAdapter 的 action state 必須區分 pressed、held、released，投擲不得因 held 每幀重複觸發。
10. 輸入事件解除綁定必須可驗證，重新進入 GameScene 不得增加 handler 數量。
11. 移動計算依 delta time 或固定步進，不得依賴實際 FPS。

【必要測試】
1. Vitest：輸入狀態、加減速、邊界限制、失焦清除。
2. Playwright：鍵盤左右移動，玩家不會越界；返回選單再進入不會重複綁定輸入。

【驗收條件】
- [ ] 玩家只能左右移動。
- [ ] 鍵盤控制沒有明顯黏鍵或反向殘留。
- [ ] 玩家到達左右邊界後不穿越。
- [ ] 不同 FPS 下位移差異在合理容許範圍。
- [ ] 所有移動參數可由設定檔調整。

【本階段禁止提前實作】
- 投擲、碰撞、手機最終 UI。

【必留證據】
1. docs/phases/PHASE_03.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_03.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 04：可預測拋物線、投擲與落點輔助
區段：Foundation
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：04｜可預測拋物線、投擲與落點輔助
前置依賴：Prompt 03 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成整款遊戲最重要的手感基礎：可學習、可預測、可測試的投擲系統。

【必須完成】
1. 建立純邏輯 ProjectileTrajectory 模組，輸入起點、初速度、重力、風力與時間，輸出軌跡。
2. 建立 ProjectileSystem，將純計算映射到 Phaser 物件。
3. Space 觸發普通便投擲；加入合理 cooldown。
4. 投擲方向朝巷弄，產生清楚拋物線，不使用隱藏命中率。
5. 建立 AimAssist：可顯示預測線與地面落點。
6. Shift 顯示／隱藏輔助；輔助顯示規則必須可由關卡設定控制。
7. 加入風向與風力資料，但本階段預設為零；debug 可調整。
8. 處理 projectile 的生命週期、物件池與離場回收。
9. 開發模式顯示速度向量、落點預測與實際落點誤差。
10. 明確定義座標、速度、重力與風力單位；預測與實際模擬必須共用同一計算來源，禁止複製兩套公式。
11. 投擲流程必須透過可注入 GameClock 或固定步進測試，不以真實 wall-clock 造成不穩定測試。
12. 建立 trajectory golden cases，保存至少五組固定輸入與期望落點，防止後續物理重構悄悄改變手感。

【必要測試】
1. Vitest：無風、有風、不同重力、不同初速度的軌跡；預測落點與模擬落點誤差。
2. Vitest：cooldown、物件池回收、最大同時 projectile 數。
3. Playwright：投擲後可見拋物線；按 Shift 可切換輔助。

【驗收條件】
- [ ] 相同輸入與 seed 會得到相同軌跡。
- [ ] 預測落點與實際落點誤差在設定容許值內。
- [ ] 連續投擲不造成無限建立物件。
- [ ] 玩家能從畫面理解投擲為何命中或失誤。
- [ ] 風力調整後預測線與實際軌跡同步改變。

【本階段禁止提前實作】
- NPC 命中、特殊大便、正式特效。

【必留證據】
1. docs/phases/PHASE_04.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_04.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 05：基礎 NPC、生成器與狀態機
區段：Core Loop
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：05｜基礎 NPC、生成器與狀態機
前置依賴：Prompt 04 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
建立由右向左移動、可資料驅動、可擴充的 NPC 核心。

【必須完成】
1. 建立 NPCDefinition、NPCInstanceState、NPCSpawner 與 NPCStateMachine。
2. NPC 從畫面右側生成，向左移動，離開左側後回收。
3. 支援三條 lane 與 lane 對應的 scale、depth、速度倍率。
4. 先完成三種 NPC：上班族、手機低頭族、慢跑者。
5. 上班族固定速度；手機族依 seeded schedule 減速／停下；慢跑者高速移動。
6. 狀態至少包含 Entering、Walking、Distracted、Exiting。
7. 建立 NPC object pool。
8. 生成規則由資料檔控制：類型、權重、lane、間隔、最大同屏數。
9. debug overlay 可顯示 NPC id、type、state、speed、lane。
10. NPC 生成排程、移動與停頓全部使用可注入 clock 與 seeded RNG。
11. NPC definition 視為唯讀資料；runtime state 不可反向污染 definition。
12. 定義同屏 NPC 上限與生成失敗策略，避免高峰事件無界建立物件。

【必要測試】
1. Vitest：狀態轉移、spawn schedule、seed 重現、lane 選擇與回收。
2. Playwright：NPC 由右進左出；三種速度／行為可辨識；長時間運行同屏數不失控。

【驗收條件】
- [ ] NPC 絕不從左側生成或向右漂移。
- [ ] 三種 NPC 行為差異可觀察。
- [ ] 相同 seed 的生成序列一致。
- [ ] 離場 NPC 被回收而非持續累積。
- [ ] NPC 狀態與 Phaser 顯示層分離。

【本階段禁止提前實作】
- 命中、怒罵、分數、進階 NPC。

【必留證據】
1. docs/phases/PHASE_05.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_05.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 06：命中判定、怒罵循環與重複命中
區段：Core Loop
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：06｜命中判定、怒罵循環與重複命中
前置依賴：Prompt 05 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成『投擲 → 命中 → 停下來罵 → 恢復前進 → 可再次命中』的第一個完整玩法閉環。

【必須完成】
1. 建立 projectile 與 NPC 的碰撞／命中判定。
2. NPC 新增 Hit、Ranting、Recovering 狀態。
3. 首次命中後立即停止移動，播放 placeholder 命中反應與怒罵氣泡。
4. 怒罵時間結束後進入 Recovering；短暫免疫結束後回到 Walking。
5. NPC 再次向左移動後才允許再次有效命中，避免同一瞬間重複碰撞刷分。
6. 記錄每名 NPC 的 validHitCount。
7. 不同命中次數使用資料化 rant duration、immunity、reaction level。
8. 投射物命中後依類型決定回收；本階段普通便直接回收。
9. 建立 GameplayEvent：PROJECTILE_HIT、NPC_RANT_STARTED、NPC_RECOVERED。
10. 得分觸發點預留為 NPC_RANT_STARTED，而不是 projectile collision；碰撞只負責產生合法命中事件。
11. 同一 projectile、同一 NPC、同一 hit window 必須有唯一 hit token，防止碰撞 callback 重入。
12. 定義 NPC 在 Hit、Ranting、Recovering、Exiting 期間的碰撞與可計分規則。

【必要測試】
1. Vitest：完整狀態轉移、免疫窗口、重複碰撞去重、離場中不可命中。
2. Playwright：同一 NPC 可被命中、停下怒罵、恢復、再次命中。

【驗收條件】
- [ ] 命中後 NPC 確實停止而不是滑行。
- [ ] 怒罵結束後 NPC 恢復向左。
- [ ] 免疫期間不增加 validHitCount。
- [ ] 第二次有效命中必須發生在重新行走後。
- [ ] 多個 NPC 同時命中不互相污染狀態。

【本階段禁止提前實作】
- 正式計分、連擊、抓包。

【必留證據】
1. docs/phases/PHASE_06.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_06.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 07：計分、精準判定與連擊系統
區段：Core Loop
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：07｜計分、精準判定與連擊系統
前置依賴：Prompt 06 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
把命中轉成清楚、可追蹤、有風險報酬的分數回饋。

【必須完成】
1. 建立純邏輯 ScoreCalculator。
2. 實作公式：基礎分 × 大便適配倍率 × 連擊倍率 × 精準倍率 × 風險倍率 × 重複命中倍率 + 特殊事件分。
3. 本階段尚無特殊大便時，相關倍率預設為 1。
4. 建立命中位置／距離的精準分級，避免用隱藏機率。
5. 建立 ComboSystem：基礎時間窗 3 秒；精準命中延長 0.5 秒。
6. 連擊門檻：3、6、10、15、20、30；倍率資料化。
7. 空投失敗只扣連擊剩餘時間，不立即歸零；規則資料化。
8. 建立 HUD 顯示分數、連擊數、倍率、時間窗。
9. 所有分數來源建立 breakdown，debug 或結算可查看。
10. 分數只能由經過驗證的 domain event 計算；UI 不得自行加分。
11. 對每次加分建立不可變 ScoreBreakdown，包含 eventId、NPC、彈藥、倍率、最終分數。
12. combo 計時使用遊戲時鐘；pause、tab hidden、slow motion 與 hit stop 的行為必須明確。

【必要測試】
1. Vitest：公式每個倍率、浮點／整數策略、門檻、時間窗、失敗扣時、重複命中倍率。
2. Playwright：連續命中會提高連擊；逾時後歸零；HUD 與內部狀態一致。

【驗收條件】
- [ ] 玩家能知道每次得分如何組成。
- [ ] 相同事件序列得到相同分數。
- [ ] 連擊門檻與倍率完全由設定檔控制。
- [ ] 逾時、pause、重開關卡不會留下舊 combo timer。
- [ ] HUD 不遮擋主要投擲區域。

【本階段禁止提前實作】
- 抓包、瘋狂模式正式效果、關卡結算。

【必留證據】
1. docs/phases/PHASE_07.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_07.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 08：抓包值、掩體、警戒階段與失敗
區段：Core Loop
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：08｜抓包值、掩體、警戒階段與失敗
前置依賴：Prompt 07 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
建立『繼續追分或暫時收手』的核心風險系統。

【必須完成】
1. 建立 AlertSystem，範圍 0～100。
2. 實作警戒階段：0～29 安全、30～59 懷疑、60～79 高度警戒、80～99 即將曝光、100 被抓包。
3. 普通命中、短時間連投、重複命中與站在同一位置過久可增加警戒；數值資料化。
4. 建立至少兩個頂樓掩體區；玩家在掩體且停止投擲時加速降低警戒。
5. 普通停止投擲也可緩慢降低警戒。
6. 高警戒提供較高風險倍率，形成報酬而非純懲罰。
7. HUD 顯示警戒值、階段、上升來源與即將被抓提示。
8. 警戒達 100 觸發失敗狀態，停止正式遊戲時鐘並顯示 placeholder 喜劇失敗畫面。
9. 重試必須完全重設 AlertSystem、combo、projectiles、NPC。
10. AlertSystem 必須記錄最近增減來源，供 HUD 與除錯顯示；不得只改一個裸數值。
11. 掩體判定與保全視線共用可重用 visibility／cover 規則，避免後期出現兩套不一致邏輯。
12. 失敗狀態需具備一次性 latch，任何後續事件不得再改分數、combo 或警戒。

【必要測試】
1. Vitest：每種來源增減值、階段邊界、掩體判定、100 上限、重試 reset。
2. Playwright：連續投擲提高警戒；停止／躲藏降低；100 時失敗；重試回到乾淨狀態。

【驗收條件】
- [ ] 玩家可主動降低警戒，而不是只能等待失敗。
- [ ] 高警戒與高分倍率的關係可觀察。
- [ ] 失敗時所有遊戲系統停止，不會在背景繼續計分。
- [ ] 重試後沒有殘留 NPC、投射物、計時器或事件 listener。

【本階段禁止提前實作】
- 攝影、保全等進階警戒來源。

【必留證據】
1. docs/phases/PHASE_08.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_08.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 09：前三種戰術大便：黏黏便、飛濺便、巨無霸便
區段：Tactical Vertical Slice
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：09｜前三種戰術大便：黏黏便、飛濺便、巨無霸便
前置依賴：Prompt 08 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
驗證不同大便會改變決策，而不是只有分數不同。

【必須完成】
1. 建立 PoopDefinition、PoopInventory、PoopBehaviorStrategy。
2. 保留普通便，新增黏黏便、飛濺便、巨無霸便。
3. Q/E 切換；HUD 顯示選中種類、庫存、冷卻。
4. 黏黏便：命中後降低 NPC 速度一段時間，可與 NPC 狀態機共存。
5. 飛濺便：命中點半徑內多名 NPC 各自接受一次有效影響，避免同幀重複。
6. 巨無霸便：較重、飛行慢、冷卻長，標記可破壞防禦。
7. 每種大便的物理、庫存、分數倍率、警戒增量、效果時間全部資料化。
8. 建立效果圖示與 debug 狀態。
9. 禁止後期大便在所有情境全面優於普通便。
10. 各彈藥效果以 strategy／capability 組合，不以大型 switch 散落在碰撞程式。
11. 建立彈藥效果的唯一 effect instance id，明確定義疊加、刷新或拒絕規則。
12. 新增平衡表欄位：skillFloor、bestAgainst、weakAgainst、alertCost，供後續驗收是否有戰術取捨。

【必要測試】
1. Vitest：切換、庫存、冷卻、黏速效果疊加規則、飛濺去重、巨無霸標記。
2. Playwright：三種大便的軌跡與效果可辨識；庫存耗盡後不可投擲。

【驗收條件】
- [ ] 三種大便至少各有一個最佳情境與一個明顯代價。
- [ ] 黏黏效果結束後速度正確恢復。
- [ ] 飛濺不會對同一 NPC 在單次爆炸重複計分。
- [ ] 巨無霸的軌跡明顯較慢且警戒代價較高。
- [ ] 切換與 HUD 狀態一致。

【本階段禁止提前實作】
- 彈跳、臭氣、分裂、黃金便。

【必留證據】
1. docs/phases/PHASE_09.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_09.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 10：進階戰術大便：彈跳、臭氣、分裂、黃金
區段：Tactical Vertical Slice
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：10｜進階戰術大便：彈跳、臭氣、分裂、黃金
前置依賴：Prompt 09 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成八種大便的戰術矩陣與可組合系統。

【必須完成】
1. 新增彈跳便：可與指定場景 surface 反彈一次，之後正常命中／回收。
2. 新增臭氣便：落地形成有生命週期的區域，影響 NPC 路線或速度並增加警戒。
3. 新增分裂便：在資料指定時間或高度分裂為三個子投射物，需防止指數生成。
4. 新增黃金便：稀有、高分、延長 combo，具有清楚特殊回饋。
5. 定義效果共存、刷新、覆蓋、互斥規則。
6. 建立環境 effect zone 與清除介面，供清潔人員後續使用。
7. 完成八種大便資料表與平衡初值。
8. 新增開發模式 arsenal sandbox，可快速切換並測試每種效果。
9. 所有子投射物與區域效果必須有全域安全上限與回收統計。
10. 彈跳 surface 使用標籤／材質能力，不依物件名稱硬編碼。
11. 臭氣改道若無合法路線，必須有 fallback，不得讓 NPC 卡死。
12. 黃金便效果不得繞過命中合法性、警戒或關卡狀態。

【必要測試】
1. Vitest：反彈次數、分裂數量上限、臭氣區域生命週期、效果共存、黃金便 combo 延長。
2. Playwright：arsenal sandbox 可逐一展示八種大便；長時間測試無物件洩漏。

【驗收條件】
- [ ] 八種大便均有可辨識軌跡或效果。
- [ ] 沒有一種大便在所有測試情境都最佳。
- [ ] 彈跳只反彈設定次數。
- [ ] 臭氣區域到期後完全清除。
- [ ] 分裂不會造成無界 projectile 增長。
- [ ] 黃金便受到稀有庫存限制。

【本階段禁止提前實作】
- 完整進階 NPC 與正式關卡。

【必留證據】
1. docs/phases/PHASE_10.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_10.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 11：完整 NPC 名冊與互動矩陣
區段：Tactical Vertical Slice
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：11｜完整 NPC 名冊與互動矩陣
前置依賴：Prompt 10 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成路人差異，讓每種 NPC 真正改變玩家的目標與彈藥選擇。

【必須完成】
1. 新增撐傘路人、外送員、遛狗路人、清潔人員、暴躁路人、攝影路人、觀光客、保全。
2. 撐傘路人：可阻擋普通便；巨無霸或合法反彈角度可破解。
3. 外送員：高速移動，高基礎分。
4. 遛狗路人：狗發現來源後增加警戒，行為需有可視預告。
5. 清潔人員：可清除臭氣與地面殘留。
6. 暴躁路人：多次命中後向頂樓發射可躲避反擊物。
7. 攝影路人：進入 Recording 後持續提高警戒，可被命中打斷。
8. 觀光客：以群組停留，適合飛濺。
9. 保全：具有觀察區／搜索狀態，是後期威脅。
10. 建立 NPC × Poop interaction matrix，資料化克制、免疫、特殊分數與警戒。
11. 避免 NPC 互動用大量 type switch；採能力／標籤或策略模式。
12. NPC 能力採 composition／tags／strategies；不得建立難以擴充的單一巨型 NPC switch。
13. 危險行為必須遵守 telegraph → active → recovery 三段規約。
14. 建立完整 interaction matrix 的 schema 驗證，缺少組合時採安全預設並在開發模式警告。

【必要測試】
1. Vitest：每類 NPC 核心狀態、interaction matrix、攝影增警戒、清潔、反擊、雨傘破解。
2. Playwright：NPC sandbox 中可逐一生成與驗收所有類型。

【驗收條件】
- [ ] 每種 NPC 都會改變至少一個玩家決策。
- [ ] 所有危險行為都有視覺或時間預告。
- [ ] 清潔人員能正確移除臭氣區。
- [ ] 攝影可開始、持續、被中斷。
- [ ] 保全觀察與搜索狀態可辨識。
- [ ] 沒有單一大便對所有 NPC 都是最佳解。

【本階段禁止提前實作】
- 潔癖網紅 Boss、十關內容。

【必留證據】
1. docs/phases/PHASE_11.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_11.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 12：關卡資料架構、目標、計時、三星與第 1 關垂直切片
區段：Tactical Vertical Slice
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：12｜關卡資料架構、目標、計時、三星與第 1 關垂直切片
前置依賴：Prompt 11 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
建立完整關卡框架，並用第 1 關證明從主選單到結算的端到端流程。

【必須完成】
1. 建立可驗證的 LevelDefinition schema。
2. 建立 LevelDirector，管理時間、spawn schedule、可用大便、目標分數、事件、勝敗與結算。
3. 建立 ObjectiveSystem 與 StarEvaluation。
4. 第 1 關：90 秒、普通上班族、普通便、完整落點提示。
5. 第 1 關三星：達標分數、5 連擊、命中率高於 60%。
6. 建立開始倒數、暫停、繼續、成功、時間到失敗、重試、下一關 placeholder。
7. 建立結算資料：總分、星級、最高連擊、命中率、命中數、投擲數。
8. 關卡重試必須 deterministic；seed 顯示於 debug／結算。
9. 關卡資料載入時做 runtime validation；無效設定顯示可診斷錯誤，不可靜默採用 undefined。
10. 建立 LevelSession id，所有事件需帶 session id，防止重試後舊事件污染新關卡。
11. 結算資料從 domain session snapshot 產生，不直接讀取散落 UI 狀態。

【必要測試】
1. Vitest：schema 驗證、時間到、分數達標、三星邊界、命中率除零、reset。
2. Playwright：主選單→第 1 關→成功或失敗→結算→重試。

【驗收條件】
- [ ] 第 1 關可完整遊玩與結算。
- [ ] 不修改程式碼即可調整目標分數與時間。
- [ ] 三星條件逐條顯示通過／未通過。
- [ ] 成功與失敗只觸發一次。
- [ ] 暫停不消耗關卡時間與 combo 時間。
- [ ] 重試結果在相同 seed 下可重現。

【本階段禁止提前實作】
- 第 2～10 關。

【必留證據】
1. docs/phases/PHASE_12.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_12.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 13：第 2 關：下班尖峰
區段：Campaign
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：13｜第 2 關：下班尖峰
前置依賴：Prompt 12 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成速度判斷與黏黏便教學。

【必須完成】
1. 場景使用傍晚視覺參數。
2. NPC：手機低頭族、慢跑者、上班族。
3. 解鎖黏黏便。
4. 關卡最後 20 秒觸發快速下班人潮事件。
5. 設計至少一個要求命中高速目標的星級條件。
6. 本關的新規則、生成波次、高潮事件、可用大便與三星條件必須由 LevelDefinition／EventDefinition 資料驅動，不得直接硬編碼在 Scene。
7. 為本關建立至少一個固定 seed 的驗收情境，能穩定重現其核心教學與高潮事件。
8. 更新 docs/phases 與 docs/evidence，明確說明本關相較前一關新增的決策，而不是只有速度或數量提升。

【必要測試】
1. Vitest：事件時間、NPC 配比、黏黏便解鎖。
2. Playwright：最後 20 秒人潮事件只觸發一次。

【驗收條件】
- [ ] 玩家能理解黏黏便對快速目標的價值。
- [ ] 手機族停頓不造成不可預測的瞬移。
- [ ] 高潮事件有清楚預告且不超出同屏上限。

【本階段禁止提前實作】
- 下一關或後期長期模式。

【必留證據】
1. docs/phases/PHASE_13.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_13.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 14：第 3 關：雨傘防線
區段：Campaign
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：14｜第 3 關：雨傘防線
前置依賴：Prompt 13 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成防禦破解與巨無霸便教學。

【必須完成】
1. 加入下雨視覺與零／低風資料。
2. 主要 NPC 為撐傘路人。
3. 解鎖巨無霸便。
4. 普通便被雨傘阻擋時必須有清楚回饋。
5. 高潮事件：同款雨傘公司員工群。
6. 本關的新規則、生成波次、高潮事件、可用大便與三星條件必須由 LevelDefinition／EventDefinition 資料驅動，不得直接硬編碼在 Scene。
7. 為本關建立至少一個固定 seed 的驗收情境，能穩定重現其核心教學與高潮事件。
8. 更新 docs/phases 與 docs/evidence，明確說明本關相較前一關新增的決策，而不是只有速度或數量提升。

【必要測試】
1. Vitest：雨傘阻擋、巨無霸破解、反彈合法破解。
2. Playwright：普通便失敗與巨無霸成功的差異可見。

【驗收條件】
- [ ] 玩家失敗時知道是被雨傘擋住，不是碰撞 bug。
- [ ] 巨無霸可破解但有明顯冷卻與警戒代價。
- [ ] 雨天效果不遮蔽落點與 HUD。

【本階段禁止提前實作】
- 下一關或後期長期模式。

【必留證據】
1. docs/phases/PHASE_14.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_14.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 15：第 4 關：市場散場
區段：Campaign
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：15｜第 4 關：市場散場
前置依賴：Prompt 14 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成群聚等待與飛濺便教學。

【必須完成】
1. 加入市場視覺參數。
2. 主要 NPC：觀光客群組、上班族、手機族。
3. 解鎖飛濺便。
4. 市場出口在高潮時湧出群組。
5. 加入一次飛濺命中三人的星級條件。
6. 本關的新規則、生成波次、高潮事件、可用大便與三星條件必須由 LevelDefinition／EventDefinition 資料驅動，不得直接硬編碼在 Scene。
7. 為本關建立至少一個固定 seed 的驗收情境，能穩定重現其核心教學與高潮事件。
8. 更新 docs/phases 與 docs/evidence，明確說明本關相較前一關新增的決策，而不是只有速度或數量提升。

【必要測試】
1. Vitest：群組 spawn、飛濺多人計分去重。
2. Playwright：可完成一次三人飛濺。

【驗收條件】
- [ ] 群組會形成等待後出手的機會。
- [ ] 飛濺命中每人只計一次。
- [ ] 高潮不因碰撞重疊造成不可讀。

【本階段禁止提前實作】
- 下一關或後期長期模式。

【必留證據】
1. docs/phases/PHASE_15.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_15.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 16：第 5 關：逆風投遞
區段：Campaign
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：16｜第 5 關：逆風投遞
前置依賴：Prompt 15 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成風力管理、反彈與彈跳便教學。

【必須完成】
1. 加入可預告且分段維持的風向／風力。
2. 解鎖彈跳便。
3. 場景加入合法反彈 surface。
4. 風改變前提供 UI 預告。
5. 高潮：強風與高速目標同時出現。
6. 本關的新規則、生成波次、高潮事件、可用大便與三星條件必須由 LevelDefinition／EventDefinition 資料驅動，不得直接硬編碼在 Scene。
7. 為本關建立至少一個固定 seed 的驗收情境，能穩定重現其核心教學與高潮事件。
8. 更新 docs/phases 與 docs/evidence，明確說明本關相較前一關新增的決策，而不是只有速度或數量提升。

【必要測試】
1. Vitest：風段落排程、預測線同步、反彈 surface。
2. Playwright：風變前提示；反彈命中可完成。

【驗收條件】
- [ ] 風是輸入資訊，不是命中後才揭露的隨機懲罰。
- [ ] 預測與實際軌跡同步。
- [ ] 至少有兩條可理解的反彈路徑。

【本階段禁止提前實作】
- 下一關或後期長期模式。

【必留證據】
1. docs/phases/PHASE_16.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_16.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 17：第 6 關：清潔大作戰
區段：Campaign
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：17｜第 6 關：清潔大作戰
前置依賴：Prompt 16 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成區域控制、臭氣便與清潔反制。

【必須完成】
1. 解鎖臭氣便。
2. 主要 NPC 包含清潔人員。
3. 清潔人員辨識並清除臭氣／地面殘留。
4. 高潮事件：清潔車進場，大量清除效果。
5. 清除動作需有預告與動畫 placeholder。
6. 本關的新規則、生成波次、高潮事件、可用大便與三星條件必須由 LevelDefinition／EventDefinition 資料驅動，不得直接硬編碼在 Scene。
7. 為本關建立至少一個固定 seed 的驗收情境，能穩定重現其核心教學與高潮事件。
8. 更新 docs/phases 與 docs/evidence，明確說明本關相較前一關新增的決策，而不是只有速度或數量提升。

【必要測試】
1. Vitest：清除目標選擇、清潔車事件、zone 回收。
2. Playwright：臭氣建立後可被清除。

【驗收條件】
- [ ] 玩家能用臭氣迫使路人改道或減速。
- [ ] 清潔反制不會瞬間無提示消除。
- [ ] 所有 zone 在關卡結束後清乾淨。

【本階段禁止提前實作】
- 下一關或後期長期模式。

【必留證據】
1. docs/phases/PHASE_17.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_17.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 18：第 7 關：巷口反擊
區段：Campaign
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：18｜第 7 關：巷口反擊
前置依賴：Prompt 17 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成投擲後移位與反擊躲避。

【必須完成】
1. 主要 NPC 包含暴躁路人。
2. 多次命中後產生有預告的反擊物。
3. 反擊物可由玩家左右移動躲避。
4. 被反擊命中採用明確懲罰，但不加入生命系統；可提高警戒或短暫失衡。
5. 高潮：多名暴躁路人輪流反擊，需設安全上限。
6. 本關的新規則、生成波次、高潮事件、可用大便與三星條件必須由 LevelDefinition／EventDefinition 資料驅動，不得直接硬編碼在 Scene。
7. 為本關建立至少一個固定 seed 的驗收情境，能穩定重現其核心教學與高潮事件。
8. 更新 docs/phases 與 docs/evidence，明確說明本關相較前一關新增的決策，而不是只有速度或數量提升。

【必要測試】
1. Vitest：反擊觸發門檻、預告時間、同屏上限、玩家命中。
2. Playwright：可看見預告並成功躲避。

【驗收條件】
- [ ] 反擊可讀、可躲、不可瞬發。
- [ ] 投擲後換位置具有實際價值。
- [ ] 多重反擊不形成無解彈幕。

【本階段禁止提前實作】
- 下一關或後期長期模式。

【必留證據】
1. docs/phases/PHASE_18.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_18.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 19：第 8 關：全城直播
區段：Campaign
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：19｜第 8 關：全城直播
前置依賴：Prompt 18 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成攝影、錄影與高敏感抓包玩法。

【必須完成】
1. 主要 NPC 包含攝影路人與直播主群。
2. Recording 狀態持續增加警戒。
3. 命中攝影者可打斷錄影，但也可能立即增加一次警戒。
4. 本關 alert multiplier 提高。
5. 高潮：直播主與多名攝影人員同時進場。
6. 本關的新規則、生成波次、高潮事件、可用大便與三星條件必須由 LevelDefinition／EventDefinition 資料驅動，不得直接硬編碼在 Scene。
7. 為本關建立至少一個固定 seed 的驗收情境，能穩定重現其核心教學與高潮事件。
8. 更新 docs/phases 與 docs/evidence，明確說明本關相較前一關新增的決策，而不是只有速度或數量提升。

【必要測試】
1. Vitest：錄影增量、打斷、多人錄影上限。
2. Playwright：錄影開始、警戒上升、打斷均可觀察。

【驗收條件】
- [ ] 玩家能優先辨識高風險目標。
- [ ] 錄影有進度或狀態提示。
- [ ] 多人錄影仍維持可控制的警戒增速。

【本階段禁止提前實作】
- 下一關或後期長期模式。

【必留證據】
1. docs/phases/PHASE_19.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_19.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 20：第 9 關：保全巡邏
區段：Campaign
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：20｜第 9 關：保全巡邏
前置依賴：Prompt 19 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成視線、掩體、搜索燈與黃金便。

【必須完成】
1. 主要威脅為保全。
2. 建立可視化觀察區與搜索燈，不得使用不可見判定。
3. 玩家在掩體可避開視線，但投擲可能暴露位置。
4. 解鎖黃金便，數量極少。
5. 高潮：部分頂樓區域被封鎖，仍保留至少一條可行移動路徑。
6. 本關的新規則、生成波次、高潮事件、可用大便與三星條件必須由 LevelDefinition／EventDefinition 資料驅動，不得直接硬編碼在 Scene。
7. 為本關建立至少一個固定 seed 的驗收情境，能穩定重現其核心教學與高潮事件。
8. 更新 docs/phases 與 docs/evidence，明確說明本關相較前一關新增的決策，而不是只有速度或數量提升。

【必要測試】
1. Vitest：視線判定、掩體遮擋、封鎖後可達區域、黃金便庫存。
2. Playwright：躲入掩體避開搜索；使用黃金便。

【驗收條件】
- [ ] 搜索燈範圍與判定一致。
- [ ] 區域封鎖不造成軟鎖。
- [ ] 黃金便高價值但不可無限使用。

【本階段禁止提前實作】
- 下一關或後期長期模式。

【必留證據】
1. docs/phases/PHASE_20.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_20.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 21：第 10 關：城市潔淨日與潔癖網紅 Boss
區段：Campaign
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：21｜第 10 關：城市潔淨日與潔癖網紅 Boss
前置依賴：Prompt 20 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
完成三階段終局，而不是只提高速度與數量。

【必須完成】
1. 第一階段：城市遊行，混合 NPC 與清潔反制。
2. 第二階段：潔癖網紅 Boss，具有大型雨傘、隨行攝影、保全護送、快速移動、階段性防護。
3. 建立 BossPhaseStateMachine；每階段有明確進入、退出與 UI 提示。
4. 防護破解必須依序要求不同系統，而非單純扣血。
5. 第三階段：保全進入頂樓、搜索燈掃描、可移動區域逐漸縮小。
6. 仍需保留可達成最後分數的高價值機會。
7. 黃金便完成最終命中，播放 placeholder『屎命完成』演出。
8. 任何階段失敗或重試都要完整重設 Boss 與事件。
9. Boss 階段轉移使用明確 guard 與一次性 transition token，避免同幀重複進階。
10. 第三階段縮小區域前先驗證玩家目前位置與剩餘可達區，必要時提供安全移位。
11. 最終命中必須是合法黃金便命中，不得以動畫時間到直接判定成功。

【必要測試】
1. Vitest：Boss 狀態轉移、階段門檻、重試 reset、區域縮小可行性。
2. Playwright：三階段完整通關流程與失敗重試。

【驗收條件】
- [ ] 三階段的玩法要求明顯不同。
- [ ] Boss 不只是高耐久 NPC。
- [ ] 所有防護都有可理解破解方式。
- [ ] 第三階段不存在無法躲避或無法得分的軟鎖。
- [ ] 結局只觸發一次。

【本階段禁止提前實作】
- 下一關或後期長期模式。

【必留證據】
1. docs/phases/PHASE_21.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_21.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 22：命中手感、視覺回饋、音效與開場
區段：Polish and Meta
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：22｜命中手感、視覺回饋、音效與開場
前置依賴：Prompt 21 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
把已成立的玩法提升為可感知、可讀、具喜劇節奏的完整體驗。

【必須完成】
1. 完成命中瞬間 50～80ms hit stop；不可凍結 UI 或造成輸入卡死。
2. 加入輕微 camera shake、擠壓拉伸、粒子、分數彈字、精準命中特效。
3. 建立 AudioManager 與分層音樂狀態：基礎、連擊、高警戒、瘋狂、失敗。
4. 八種大便至少有可辨識 placeholder 投擲／命中音。
5. NPC 怒罵氣泡由資料池選擇，依類型、命中次數與狀態篩選。
6. 建立開場：『使命必達』被砸成『屎命必達』，可略過。
7. 建立設定：主音量、音效、音樂、震動、畫面震動、hit stop 強度。
8. 避免視覺效果遮擋 lane、落點、警戒與重要預告。
9. 所有 hit stop、slow motion 與 camera shake 都必須走統一 FeedbackDirector，避免多系統互相覆寫時間尺度。
10. 聲音播放需有 concurrency limit，防止多人飛濺時音訊爆量。
11. 對白池不得連續重複同一句；仍須 deterministic 或可測試。

【必要測試】
1. Vitest：音訊狀態轉移、對白選擇、設定持久化。
2. Playwright：開場可略過；關閉震動／音效後設定生效。
3. 效能 profiling：高密度場景不因粒子與音效無界增長。

【驗收條件】
- [ ] 命中具有重量感，但不影響控制可靠性。
- [ ] 不同大便的聲音與畫面可辨識。
- [ ] 高警戒與高連擊的音樂狀態不互相打架。
- [ ] 所有強烈效果可在設定中降低或關閉。
- [ ] 開場只在合理時機播放，不阻礙重試。

【本階段禁止提前實作】
- 正式商用美術與配音。

【必留證據】
1. docs/phases/PHASE_22.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_22.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 23：進度、解鎖、稱號、存檔與遊戲模式
區段：Polish and Meta
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：23｜進度、解鎖、稱號、存檔與遊戲模式
前置依賴：Prompt 22 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
建立可重玩與可擴充的 meta progression，但不以數值碾壓取代技巧。

【必須完成】
1. 建立 SaveData schema、version 與 migration。
2. LocalStorage 儲存關卡星級、最高分、稱號、解鎖大便、設定。
3. 進度解鎖依關卡完成；不可購買永久分數倍率。
4. 實作玩家稱號判定：樸實無華、物理學屁孩、記仇大師、巷弄災難、無聲惡作劇、刀口投遞、壓線臭名、移動預判王、惡有惡報、天選投遞員。
5. 建立關卡選擇畫面。
6. 建立無盡模式基礎：難度隨時間提升，抓包結束。
7. 建立精準模式：投擲次數有限，以命中率與價值為主。
8. 建立瘋狂模式：高密度、普通便寬鬆、警戒快速上升。
9. 每日屎命先做 deterministic 本地挑戰；不需後端與全球排行榜。
10. 新增刪除存檔與損壞存檔安全回復。
11. SaveData 寫入採原子化策略或暫存備份，避免寫入中斷造成唯一存檔損壞。
12. 存檔 migration 必須保留舊版本 fixture 測試。
13. 每日挑戰日期計算需明確採用本地日期或 UTC，並寫入決策文件。

【必要測試】
1. Vitest：save/load、migration、稱號、解鎖、模式規則、壞資料回復。
2. Playwright：完成關卡→解鎖→重整→進度保留；刪除存檔。

【驗收條件】
- [ ] 重整瀏覽器不會遺失合法進度。
- [ ] 壞存檔不會造成白屏。
- [ ] 解鎖增加選擇，不直接永久提高所有得分。
- [ ] 三種額外模式的核心規則可辨識。
- [ ] 每日挑戰同日同 seed，同一裝置可重現。

【本階段禁止提前實作】
- 帳號、雲端同步、全球排行榜、付費系統。

【必留證據】
1. docs/phases/PHASE_23.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_23.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 24：手機觸控、響應式、可用性與無障礙
區段：Polish and Meta
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：24｜手機觸控、響應式、可用性與無障礙
前置依賴：Prompt 23 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
讓遊戲在桌機與手機上都可完成核心流程，不因 UI 或輸入造成失敗。

【必須完成】
1. 完成觸控左右控制、投擲、瞄準輔助與大便切換。
2. 支援橫向手機為主要玩法；直向時提供旋轉提示或經驗完整的替代布局。
3. 處理 safe area、瀏覽器工具列、視窗 resize、觸控取消。
4. 觸控按鈕不可遮擋主要巷弄與落點。
5. 加入可調按鈕尺寸、左右手配置或至少提供鏡像配置。
6. 所有重要狀態不只依靠顏色；警戒、combo、錄影與風向有圖示／文字。
7. 加入 reduced motion 選項。
8. 加入 pause 與返回時的誤觸保護。
9. 檢查文字可讀性與中文 fallback font。
10. 所有觸控區域以 pointer capture／cancel 安全處理，離開按鈕與多指切換不得留下 held 狀態。
11. UI 可點擊區域至少達到合理觸控尺寸，並與 safe-area inset 整合。
12. 鍵盤、觸控與未來手把不得直接控制 Player，全部透過 InputAdapter。

【必要測試】
1. Playwright device emulation：iPhone、Android 小螢幕、平板、桌機。
2. 測試多點觸控、滑出按鈕、orientation change、background/foreground。

【驗收條件】
- [ ] 手機橫向可完成第 1 關。
- [ ] 觸控與鍵盤共享同一 InputAdapter。
- [ ] 旋轉或切回前景不會卡鍵、重複投擲或丟失 pause 狀態。
- [ ] 主要 HUD 在小螢幕可讀。
- [ ] reduced motion 可降低 shake、粒子與 hit stop。

【本階段禁止提前實作】
- 原生 App 包裝。

【必留證據】
1. docs/phases/PHASE_24.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_24.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
Prompt 25：完整測試、平衡工具、效能與發布候選版
區段：Release Candidate
============================================================

【直接貼給 Codex；新工作階段請先貼 MASTER】

目前階段：25｜完整測試、平衡工具、效能與發布候選版
前置依賴：Prompt 24 驗收通過。

執行限制：
- 先讀 AGENTS.md、PRODUCT_INVARIANTS、ARCHITECTURE、STATUS、前一階段 evidence。
- 只完成本階段。
- 保留使用者未提交變更。
- 不自行 push、不自行標 PASS。
- 完成後狀態只能是 READY_FOR_REVIEW 或 BLOCKED。

【本階段目標】
把遊戲從『功能完成』提升到可交付、可回歸、可定位問題的 Release Candidate。

【必須完成】
1. 建立核心 domain 測試覆蓋報告，優先涵蓋 trajectory、state machine、score、combo、alert、level、save。
2. 建立 Playwright 關鍵旅程：新玩家、第 1 關、任一中期關、第 10 關失敗與成功、存檔重整。
3. 建立 balance simulation，可用 seed 模擬 spawn、時間、理論分數區間與資源供給，不要求模擬人類技巧。
4. 建立 debug/balance panel：時間倍率、生成 NPC、切換大便、設定警戒、設定 combo、跳關、顯示 seed。
5. 檢查事件 listener、timer、object pool、particle、audio node 是否在重試與切場景後清除。
6. 設定效能預算：桌機目標 60 FPS；合理手機目標至少穩定 30 FPS，並記錄測試裝置／瀏覽器。
7. 檢查 bundle 大小、載入失敗 fallback、資產錯誤處理。
8. 建立 README：安裝、啟動、測試、建置、架構、debug、加入新 NPC／大便／關卡方式。
9. 建立 RELEASE_CHECKLIST.md 與已知問題清單。
10. 移除不必要 console log；保留有 namespace 的開發診斷。
11. 建立 baseline 與最終效能比較；任何 bundle、記憶體或啟動時間顯著退化需說明。
12. 建立 release build 的版本號、commit hash、build timestamp 顯示或可查詢方式。
13. 確認 debug／cheat 工具在 production build 預設關閉且不可被一般 UI 誤啟動。
14. 建立已知問題嚴重度分級：Blocker、Critical、Major、Minor，Blocker/Critical 必須為零才能 RC。

【必要測試】
1. 執行完整 lint、typecheck、unit、coverage、build、e2e。
2. 至少進行 20 次不同 seed 的第 1 關重試與 10 次第 10 關流程測試。
3. 執行長時間 soak test，觀察物件數、listener、記憶體與 FPS。

【驗收條件】
- [ ] 完整 CI 等價命令全部通過。
- [ ] 關鍵旅程不存在阻塞性錯誤。
- [ ] 重試與切場景不造成持續增長的物件／listener。
- [ ] README 可讓新工程師從零啟動並新增內容。
- [ ] 所有未完成項目已明列，不以『之後再做』藏在程式碼。
- [ ] 可產出可部署的靜態 build。

【本階段禁止提前實作】
- 後端服務、商業化、正式資產採購與平台上架流程。

【必留證據】
1. docs/phases/PHASE_25.md：範圍、設計、介面與非目標。
2. docs/evidence/PHASE_25.md：命令、exit code、固定 seed、驗收對照與已知限制。
3. docs/STATUS.md：改為 READY_FOR_REVIEW 或 BLOCKED，不得改 PASS。
4. 涉及 UI 時保存至少一個可重現畫面／trace，並在 evidence 引用。
5. 涉及狀態或資源時，記錄重試前後的 entity、listener、timer 或 session 檢查結果。

【完成前命令】
- 使用 repository 既有 package manager。
- 先執行 targeted tests。
- 再執行 lint、typecheck、適用測試、build。
- 涉及 UI／流程時執行 e2e。
- 若 scripts 名稱不同，使用既有命令並回報對應關係。

【停止條件】
- 前置階段未 PASS。
- 必要測試無法執行。
- 需要破壞使用者未提交工作。
- 需要不可逆資料遷移但沒有批准。
- 本階段必須依賴尚未完成的下一階段。
- 發現 Blocker 且無法在本階段以最小修復處理。

完成回報必須遵守 MASTER 格式，完成後停止。

============================================================
8. Release Gate Prompts
============================================================

Gate 不是新功能階段，而是跨階段整合驗收。
Gate 預設先審查、不改碼；發現問題後另用 FIX Prompt。

------------------------------------------------------------
Gate A：技術與手感基線
適用時機：Prompt 00～04 人工 PASS 後
------------------------------------------------------------

【貼給 Codex】

請對 Foundation 進行只讀整合審查，不要先修改程式。

審查範圍：
- 專案工具鏈、AGENTS.md 與 docs 是否一致。
- Scene 生命週期是否可重進而不累積 listener。
- 三層場景與三條 lane 是否由統一 layout 計算。
- 玩家只能左右移動，輸入不黏鍵。
- 投擲預測與實際軌跡是否共用同一公式。
- 不同 FPS、resize、pause、tab hidden 是否維持一致。
- RNG、clock、trajectory 是否可重現。
- 無 NPC 的情況下，手感基礎是否足以進入核心循環。

必須執行：
- lint、typecheck、unit、build、適用 e2e。
- trajectory golden cases。
- GameScene 進出至少 10 次，觀察 listener／timer。
- 1280×720、1920×1080、390×844 layout 檢查。

輸出：
- GATE_A_READY 或 GATE_A_FAIL。
- 逐條證據。
- Blocker／Critical／Major／Minor 清單。
- 最小修復順序。
- 不修改程式，完成後停止。

人工 Gate A：
- [ ] 移動與投擲反應一致。
- [ ] 玩家能理解落點。
- [ ] resize 不破壞 lane。
- [ ] 重進場景沒有重複輸入。
- [ ] 無 Blocker／Critical。

------------------------------------------------------------
Gate B：核心循環 MVP
適用時機：Prompt 05～08 人工 PASS 後
------------------------------------------------------------

【貼給 Codex】

請對 Core Loop 進行只讀整合審查，不要先修改程式。

核心流程：
NPC 右側生成 → 向左移動 → 投擲合法命中 → NPC 停止怒罵 → 產生分數 → 恢復前進 → 可再次命中 → combo 與 alert 改變 → 成功收手或被抓包。

檢查：
- 分數是否只由 NPC_RANT_STARTED 產生。
- hit token 是否阻止同幀重複計分。
- NPC 恢復後才能再次合法得分。
- combo、alert、pause、hit stop 使用一致遊戲時鐘。
- 警戒 100 後是否完全停止計分。
- retry 是否建立新 LevelSession 並清乾淨。
- 高警戒是否同時有代價與報酬。
- 相同 seed／事件序列是否重現。

壓力測試：
- 連續投擲。
- 多 NPC 同時命中。
- 暫停／恢復。
- 失敗後快速重試 20 次。
- Scene 切換後重新進入。

輸出：
- GATE_B_READY 或 GATE_B_FAIL。
- 逐條證據與最小修復建議。
- 不修改程式，完成後停止。

人工 Gate B：
- [ ] 5 分鐘內理解基本循環。
- [ ] 命中、怒罵、得分的因果清楚。
- [ ] 失誤可歸因，不像隱藏亂數。
- [ ] 抓包迫使玩家考慮收手。
- [ ] 無無限刷分漏洞。
- [ ] 無 Blocker／Critical。

------------------------------------------------------------
Gate C：垂直切片
適用時機：Prompt 09～12 人工 PASS 後
------------------------------------------------------------

【貼給 Codex】

請對 Tactical Vertical Slice 進行只讀審查，不要先修改程式。

檢查：
- 8 種大便均有用途、代價與可辨識回饋。
- NPC × Poop interaction matrix 完整且有安全預設。
- 沒有單一大便在所有情境全面最佳。
- 第 1 關能從主選單完整進入、遊玩、成功／失敗、結算、重試。
- 關卡資料可改時間、分數、生成、可用彈藥與三星，不改 Scene 程式。
- 所有效果、zone、projectile 與 NPC 在重試後回收。
- 結算來自 session snapshot。
- 固定 seed 可重現。

建議資料分析：
- 使用 sandbox／模擬器跑不同目標組合。
- 檢查單一彈藥使用率是否可能長期超過 70%。
- 檢查是否存在無成本高分組合。
- 檢查 inventory、cooldown、alertCost 是否形成取捨。

輸出：
- GATE_C_READY 或 GATE_C_FAIL。
- 互動矩陣缺口。
- 平衡風險。
- 流程與重試問題。
- 不修改程式，完成後停止。

人工 Gate C：
- [ ] 第 1 關完整可玩。
- [ ] 至少三種大便會因情境被主動切換。
- [ ] NPC 差異會改變目標選擇。
- [ ] 三星條件清楚。
- [ ] 連續重試無狀態污染。
- [ ] 無 Blocker／Critical。

------------------------------------------------------------
Gate D：完整十關
適用時機：Prompt 13～21 人工 PASS 後
------------------------------------------------------------

【貼給 Codex】

請對完整 Campaign 進行只讀審查，不要先修改程式。

檢查每一關：
- 是否新增一個新決策，而不只是增加速度／數量。
- 教學、練習、壓力、高潮是否完整。
- 特殊事件是否只觸發一次。
- 固定 seed 是否能穩定重現核心情境。
- 星級條件是否可完成、可理解、無矛盾。
- 關卡時間、目標分數與資源供給是否合理。
- 高潮不超出同屏物件與音訊上限。
- 失敗／重試／下一關流程是否正確。

第 10 關額外檢查：
- 三階段玩法不同。
- Boss 不是高血量普通 NPC。
- 防護破解有明確因果。
- 區域縮小不產生軟鎖。
- 最終成功只由合法黃金便命中觸發。
- retry 完整重設 Boss phase。

輸出：
- GATE_D_READY 或 GATE_D_FAIL。
- 10 關逐關狀態表。
- 難度曲線與內容重複風險。
- 軟鎖、死局、無法三星清單。
- 不修改程式，完成後停止。

人工 Gate D：
- [ ] 10 關均可完成。
- [ ] 每關可用一句話說出新決策。
- [ ] 難度逐步增加而非突然跳升。
- [ ] 第 10 關像終局而非數值放大。
- [ ] 無 Blocker／Critical。

------------------------------------------------------------
Gate E：產品體驗
適用時機：Prompt 22～24 人工 PASS 後
------------------------------------------------------------

【貼給 Codex】

請對 Polish and Meta 進行只讀審查，不要先修改程式。

檢查：
- hit stop、shake、slow motion 不造成輸入或計時錯誤。
- 音效 concurrency 有上限。
- 警戒、combo、錄影、風向不只靠顏色表達。
- reduced motion 真正降低 shake、粒子、slow motion。
- 開場可略過，重試不反覆阻塞。
- 存檔有版本、migration、備份與壞資料回復。
- 解鎖增加玩法，不提供永久分數碾壓。
- 每日挑戰 seed／日期規則穩定。
- 手機橫向可完成第 1 關。
- orientation、background、pointer cancel 不造成卡鍵。
- 小螢幕 HUD 可讀且不遮擋投擲區。

輸出：
- GATE_E_READY 或 GATE_E_FAIL。
- 桌機／手機／可用性矩陣。
- 存檔與 migration 風險。
- 不修改程式，完成後停止。

人工 Gate E：
- [ ] 命中有重量但不妨礙控制。
- [ ] 手機可完成第 1 關。
- [ ] 存檔重整後正確。
- [ ] reduced motion 有效。
- [ ] 主要資訊清楚可讀。
- [ ] 無 Blocker／Critical。

------------------------------------------------------------
Gate F：Release Candidate
適用時機：Prompt 25 人工 PASS 前
------------------------------------------------------------

【貼給 Codex】

請執行 Release Candidate 最終稽核；除非使用者另行要求，本次只審查與產生報告，不修改功能。

必須確認：
- lint、typecheck、unit、integration、coverage、build、e2e 全部通過。
- production build 可部署。
- debug／cheat 在 production 預設關閉。
- Blocker = 0，Critical = 0。
- 20 次第 1 關重試與 10 次第 10 關流程無狀態污染。
- soak test 沒有持續成長的 listener、timer、entity、particle、audio node。
- 桌機目標 60 FPS；合理手機至少 30 FPS，記錄環境。
- bundle、啟動時間、記憶體與基線比較。
- 壞資產與壞存檔有 fallback。
- README 足以讓新工程師啟動並新增 NPC、大便與關卡。
- RELEASE_CHECKLIST 與 known issues 完整。
- build 可追溯到版本與 commit。

輸出：
- RC_READY 或 RC_FAIL。
- release evidence。
- 未解問題與嚴重度。
- 部署指令與 rollback 說明。
- 完成後停止。

============================================================
9. AUDIT：單階段只讀審查 Prompt
============================================================

目前要審查：Prompt XX｜<階段名稱>。

請先只讀審查，不要修改程式。

1. 讀取本階段 Prompt、docs/phases/PHASE_XX.md、docs/evidence/PHASE_XX.md、STATUS 與 git diff。
2. 檢查是否超出範圍、提前實作、漏測或破壞產品不變量。
3. 核對每一條驗收條件與證據。
4. 實際重跑 targeted tests 與適用 verify 命令。
5. 檢查 console、retry、scene restart、listener、timer、session。
6. 對新增 domain 邏輯檢查決策分支測試。
7. 對 UI 功能依手動步驟重現。
8. 將問題分為 Blocker、Critical、Major、Minor。
9. 不把 Codex 自己的聲明當證據。
10. 不修改程式，完成後停止。

輸出：
- REVIEW_READY 或 REVIEW_FAIL
- 驗收逐條 MET／NOT MET
- 缺少證據
- 回歸風險
- 最小修復順序

============================================================
10. FIX：驗收失敗修復 Prompt
============================================================

目前失敗階段：Prompt XX｜<階段名稱>。

只修復下列問題，不擴張功能、不重構無關模組、不進入下一階段：

問題 1：
- 嚴重度：
- 重現步驟：
- 固定 seed：
- 實際結果：
- 預期結果：
- log／trace／截圖：

問題 2：
- 嚴重度：
- 重現步驟：
- 固定 seed：
- 實際結果：
- 預期結果：
- log／trace／截圖：

修復流程：
1. 先重現。
2. 找出最可能根因。
3. 列出最小修改檔案。
4. 先補能失敗的 regression test。
5. 做最小修復。
6. 執行 targeted tests。
7. 執行本階段完整驗證。
8. 更新 evidence 與 STATUS 為 READY_FOR_REVIEW 或 BLOCKED。
9. 不自行標 PASS。
10. 完成後停止。

============================================================
11. HANDOFF：新 Codex 工作階段交接 Prompt
============================================================

請只建立／更新 docs/HANDOFF.md，不實作新功能。

內容必須包含：
- 專案目前可執行狀態
- 最後人工 PASS 的 phase
- 目前 READY_FOR_REVIEW／BLOCKED 的 phase
- git status 與重要未提交檔案
- package manager、Node、啟動與 verify 命令
- 架構摘要
- 目前產品不變量
- 重要 ADR
- 固定 seed 與可重現案例
- baseline 已知失敗
- Blocker／Critical／Major
- 下一步只應執行哪個 Prompt
- 不應提前做什麼

完成後停止。

============================================================
12. CHANGE：需求變更 Prompt
============================================================

需求變更：
<貼上新需求>

請先不要修改程式。

1. 判斷它影響產品不變量、架構、資料、測試與哪些 phase。
2. 區分：
   - 可在目前 phase 內處理
   - 必須另開 change phase
   - 應延後
   - 不應採用
3. 評估向後相容、存檔、關卡資料、測試與效能影響。
4. 提出最小可行方案與替代方案。
5. 更新建議 ADR 內容。
6. 指出重新驗收哪些 Gate。
7. 未經確認不修改程式。

============================================================
13. HUMAN：人工驗收紀錄模板
============================================================

階段：
版本／commit：
驗收日期：
驗收人：
固定 seed：
裝置／瀏覽器：

A. 自動化證據
- [ ] targeted tests 通過
- [ ] lint 通過
- [ ] typecheck 通過
- [ ] unit／integration 通過
- [ ] build 通過
- [ ] 適用 e2e 通過
- [ ] console 無未處理錯誤

B. 範圍
- [ ] 只完成本階段
- [ ] 沒有提前做下一階段
- [ ] 沒有破壞未提交工作
- [ ] 沒有無關大型重構
- [ ] 文件與程式一致

C. 遊戲行為
- [ ] 所有驗收條件逐條通過
- [ ] 失敗原因可理解
- [ ] retry 狀態乾淨
- [ ] pause／resume 正確
- [ ] resize／scene switch 正確
- [ ] 固定 seed 可重現

D. 工程品質
- [ ] 規則與數值資料化
- [ ] 無不明 any／ts-ignore
- [ ] 無無上限物件
- [ ] listener／timer 有清理
- [ ] TODO／FIXME 有追蹤 id

E. 結論
- [ ] PASS
- [ ] CONDITIONAL PASS
- [ ] FAIL

問題：
1.
2.

暫緩項目與嚴重度：
1.
2.

下一階段前必修：
1.
2.

人工 PASS 後：
- 更新 docs/STATUS.md。
- 建立 checkpoint／commit。
- 到里程碑時執行 Release Gate。

============================================================
14. 最終執行原則
============================================================

1. 先建立可重現的工程基線，再寫玩法。
2. 先證明移動與投擲手感，再加入 NPC。
3. 先證明命中、怒罵、得分、恢復的閉環，再增加內容。
4. 先證明連擊與抓包形成真正取捨，再做大量關卡。
5. 先證明不同大便與 NPC 改變決策，再做完整十關。
6. 先完成第 1 關垂直切片，再批次製作第 2～10 關。
7. 每關新增新決策，不用純數值放大假裝進展。
8. 先讓系統自然產生笑點，再用動畫與音效放大。
9. Codex 只交付 READY_FOR_REVIEW；人工才有權標 PASS。
10. 每一段都必須可測試、可驗收、可回退、可交接。

最重要的判準：

不是「Codex 寫了多少程式」，
而是「每個階段是否提供了一個可被證明正確的遊戲增量」。
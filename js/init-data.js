// 初期データ投入スクリプト
// このファイルは一度だけ実行してデータベースに初期データを投入します

async function initializeData() {
    console.log('初期データの投入を開始します...');

    // チェックリスト項目の投入
    const checklistCategories = [
        {
            category: '開店準備',
            items: [
                'レジの電源を入れる', '店内の照明をすべて点灯する', '入口のドアを開放する', 'BGMを流す',
                '掃除機をかける', '床をモップがけする', 'ゴミ箱を空にする', 'トイレの清掃と確認',
                'レジの釣り銭を確認する', '商品の陳列を確認する', '賞味期限切れ商品のチェック', '在庫数の確認',
                'POP広告の設置', '特売商品の確認', '温度管理（冷蔵庫・冷凍庫）', '防犯カメラの動作確認',
                '駐車場の安全確認', 'スタッフの身だしなみチェック', '朝礼の実施', '本日の目標確認'
            ]
        },
        {
            category: '接客対応',
            items: [
                '笑顔で挨拶をする', 'アイコンタクトを取る', '明るい声で話す', 'お客様の話をよく聞く',
                '商品の場所を案内する', '商品の特徴を説明できる', 'レジ操作を正確に行う', 'お釣りを丁寧に渡す',
                'レシートを両手で渡す', '袋詰めを丁寧に行う', '重いものは下に入れる', '冷たいものは分ける',
                'クレーム対応の基本を理解している', '責任者への報告ができる', '電話応対が適切にできる', 'お客様への感謝を伝える',
                'お見送りの挨拶をする', '忙しい時も落ち着いて対応する', 'チームワークを大切にする', 'お客様目線で考える'
            ]
        },
        {
            category: '商品管理',
            items: [
                '入荷商品の検品をする', '賞味期限のチェックをする', '先入れ先出しを徹底する', '商品を丁寧に扱う',
                '陳列の整理整頓をする', '値札が正しく貼られているか確認', '在庫の場所を把握している', '発注の基準を理解している',
                '品出しのタイミングを把握している', 'バックヤードの整理整頓', '廃棄処理の手順を理解している', '温度管理を徹底する',
                '季節商品の入れ替え時期を把握', '売れ筋商品を理解している', '欠品を防ぐ努力をする', '棚卸しの手順を理解している',
                'POSデータの見方を理解している', 'ロス削減の意識を持つ', '商品知識を深める努力をする', '新商品情報を把握する'
            ]
        },
        {
            category: '閉店作業',
            items: [
                'レジの精算をする', '売上データの確認', '金庫への入金', '商品の整理整頓',
                '冷蔵・冷凍庫の温度確認', '賞味期限チェック', '廃棄処理', 'ゴミの分別と処理',
                '床の掃除', '棚の整理', 'トイレの清掃', '店内の整理整頓',
                'すべての照明を消す', 'BGMを止める', 'エアコンを消す', '戸締まりの確認',
                '防犯設備のセット', '駐車場の確認', 'ゴミ置き場の確認', '翌日の準備確認'
            ]
        }
    ];

    // チェックリスト項目を投入
    let checklistOrder = 1;
    for (const cat of checklistCategories) {
        for (const item of cat.items) {
            try {
                await fetch('tables/checklist_items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        category: cat.category,
                        item_text: item,
                        order_num: checklistOrder++
                    })
                });
            } catch (error) {
                console.error('チェックリスト投入エラー:', error);
            }
        }
    }

    // 動画の投入（サンプル動画3本）
    const sampleVideos = [
        {
            title: '基礎トレーニング',
            youtube_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            thumbnail_url: '',
            category: '基本',
            order_num: 1
        },
        {
            title: '接客マニュアル',
            youtube_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            thumbnail_url: '',
            category: '基本',
            order_num: 2
        },
        {
            title: '安全管理',
            youtube_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            thumbnail_url: '',
            category: '基本',
            order_num: 3
        }
    ];

    for (const video of sampleVideos) {
        try {
            await fetch('tables/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(video)
            });
            console.log(`動画追加: ${video.title}`);
        } catch (error) {
            console.error('動画投入エラー:', error);
        }
    }

    // テスト問題の投入
    const testQuestions = [
        {
            question: '開店時に最初に行うべきことは？',
            options: ['商品の陳列', 'レジの起動と釣り銭確認', '清掃', '朝礼'],
            correct: 1
        },
        {
            question: 'お客様への接客で最も大切なことは？',
            options: ['素早い対応', '笑顔と挨拶', '商品知識', 'レジ操作'],
            correct: 1
        },
        {
            question: '商品管理で重要な「先入れ先出し」とは？',
            options: ['新しい商品を先に出す', '古い商品を先に出す', '高い商品を先に出す', '安い商品を先に出す'],
            correct: 1
        },
        {
            question: 'クレーム対応の基本は？',
            options: ['すぐに謝罪して返金する', 'まず話を聞いて理解する', '責任者を呼ぶ', '規則を説明する'],
            correct: 1
        },
        {
            question: '閉店作業で最後に確認すべきことは？',
            options: ['レジの精算', '商品の整理', '清掃', '戸締まりと防犯'],
            correct: 3
        },
        {
            question: '冷蔵庫の適切な温度は？',
            options: ['0〜5度', '5〜10度', '10〜15度', '15〜20度'],
            correct: 0
        },
        {
            question: 'レジでお釣りを渡すとき、最も適切な方法は？',
            options: ['カウンターに置く', '片手で渡す', '両手で丁寧に渡す', '釣り銭トレーに入れる'],
            correct: 2
        },
        {
            question: '賞味期限切れの商品を見つけた場合は？',
            options: ['そのまま販売', '値引きして販売', 'すぐに撤去して報告', '閉店後に処理'],
            correct: 2
        },
        {
            question: '忙しい時間帯に心がけるべきことは？',
            options: ['急いで対応', '落ち着いて正確に', '後回しにする', '他のスタッフに任せる'],
            correct: 1
        },
        {
            question: 'お客様の満足度を高めるために最も重要なことは？',
            options: ['低価格', '商品の多さ', '心のこもった接客', '店舗の広さ'],
            correct: 2
        }
    ];

    let questionOrder = 1;
    for (const q of testQuestions) {
        try {
            await fetch('tables/test_questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: q.question,
                    options: JSON.stringify(q.options),
                    correct_answer: q.correct,
                    order_num: questionOrder++
                })
            });
        } catch (error) {
            console.error('テスト問題投入エラー:', error);
        }
    }

    console.log('✅ 初期データの投入が完了しました！');
    console.log('投入内容:');
    console.log('- 動画: 3本');
    console.log('- チェック項目: 約100項目（4カテゴリー）');
    console.log('- テスト問題: 10問');
    alert('✅ 初期データの投入が完了しました！\n\n投入内容:\n・動画 3本\n・チェック項目 約100項目\n・テスト問題 10問\n\nページをリロードしてください。');
    
    // 5秒後に自動リロード
    setTimeout(() => {
        window.location.reload();
    }, 5000);
}

// ページ読み込み時に実行ボタンを表示
if (window.location.search.includes('init=true')) {
    document.addEventListener('DOMContentLoaded', () => {
        const initBtn = document.createElement('button');
        initBtn.textContent = '初期データを投入';
        initBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;padding:15px;background:red;color:white;border:none;border-radius:10px;cursor:pointer;';
        initBtn.onclick = initializeData;
        document.body.appendChild(initBtn);
    });
}

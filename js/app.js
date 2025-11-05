// ========================================
// グローバル変数
// ========================================
let currentUser = localStorage.getItem('currentUser') || '';

// グローバル変数（データベースから読み込む）
let checklistData = {};
let testData = { name: '店舗業務理解度テスト', questions: [] };

// ========================================
// 初期化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    if (!currentUser) {
        showUserModal();
    } else {
        hideUserModal();
        updateUserDisplay();
        initApp();
    }

    // ユーザー変更ボタン
    document.getElementById('changeUserBtn').addEventListener('click', showUserModal);
});

// ========================================
// ユーザー管理
// ========================================
function showUserModal() {
    document.getElementById('userModal').style.display = 'flex';
    document.getElementById('userNameSubmit').addEventListener('click', handleUserSubmit);
    document.getElementById('userNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserSubmit();
    });
}

function hideUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

function handleUserSubmit() {
    const userName = document.getElementById('userNameInput').value.trim();
    if (userName) {
        currentUser = userName;
        localStorage.setItem('currentUser', userName);
        hideUserModal();
        updateUserDisplay();
        initApp();
    } else {
        alert('名前を入力してください');
    }
}

function updateUserDisplay() {
    document.getElementById('currentUserName').textContent = `👤 ${currentUser}`;
}

// ========================================
// アプリ初期化
// ========================================
function initApp() {
    console.log('=== KCSポータル初期化開始 ===');
    console.log('現在のユーザー:', currentUser);
    
    try {
        console.log('1. タブ初期化');
        initTabs();
        
        console.log('2. ホーム画面データ読み込み');
        loadAnnouncements(); // ホーム画面の連絡事項を読み込み
        loadUpdates(); // ホーム画面の更新履歴を読み込み
        
        console.log('3. 動画マニュアル読み込み');
        loadVideos();
        
        console.log('4. チェックシート初期化');
        initChecklist();
        
        console.log('5. テスト初期化');
        initTest();
        
        console.log('6. ランキング読み込み');
        loadRankings();
        
        console.log('7. 管理者データ読み込み');
        loadAdminData();
        
        console.log('=== 初期化完了 ===');
    } catch (error) {
        console.error('初期化エラー:', error);
        alert('アプリの初期化に失敗しました。ページをリロードしてください。');
    }
}

// ========================================
// タブ切り替え
// ========================================
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // すべてのタブとコンテンツから active を削除
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // クリックされたタブとコンテンツに active を追加
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            // ホームタブの場合は連絡事項と更新履歴を再読み込み
            if (targetTab === 'home') {
                loadAnnouncements();
                loadUpdates();
            }

            // 管理者タブの場合はデータを再読み込み
            if (targetTab === 'admin') {
                loadAdminData();
            }

            // ランキングタブの場合は再読み込み
            if (targetTab === 'ranking') {
                loadRankings();
            }

            // シフトタブの場合はシフトを読み込み
            if (targetTab === 'shift') {
                loadShiftTab();
            }
        });
    });
}

// ========================================
// ホーム画面 - 連絡事項機能
// ========================================
async function loadAnnouncements() {
    try {
        const response = await fetch('tables/announcements?limit=100&sort=-created_at');
        const data = await response.json();
        
        displayAnnouncements(data.data);
    } catch (error) {
        console.error('連絡事項読み込みエラー:', error);
    }
}

function displayAnnouncements(announcements) {
    const container = document.getElementById('announcementsList');
    
    if (announcements.length === 0) {
        container.innerHTML = '<div class="no-announcements">現在、連絡事項はありません</div>';
        return;
    }

    // ピン留めを優先してソート
    const sortedAnnouncements = announcements.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return 0;
    });

    container.innerHTML = sortedAnnouncements.map(announcement => {
        const date = new Date(announcement.created_at).toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const priorityClass = `priority-${announcement.priority === '高' ? 'high' : announcement.priority === '中' ? 'medium' : 'low'}`;
        const pinnedClass = announcement.is_pinned ? 'pinned' : '';
        
        return `
            <div class="announcement-card ${priorityClass} ${pinnedClass}">
                <div class="announcement-header">
                    <div class="announcement-title">
                        ${announcement.is_pinned ? '<i class="fas fa-thumbtack"></i>' : ''}
                        ${announcement.title}
                    </div>
                    <div class="announcement-meta">
                        ${announcement.is_pinned ? '<span class="announcement-badge badge-pinned">ピン留め</span>' : ''}
                        <span class="announcement-badge badge-${announcement.priority === '高' ? 'high' : announcement.priority === '中' ? 'medium' : 'low'}">
                            ${announcement.priority}
                        </span>
                    </div>
                </div>
                <div class="announcement-content">${announcement.content}</div>
                <div class="announcement-date">📅 ${date}</div>
            </div>
        `;
    }).join('');
}

// 更新履歴の読み込みと表示
async function loadUpdates() {
    try {
        const updates = [];
        
        // 連絡事項の更新を取得
        const announcementsRes = await fetch('tables/announcements?limit=3&sort=-created_at');
        const announcementsData = await announcementsRes.json();
        announcementsData.data.forEach(item => {
            updates.push({
                type: 'announcement',
                icon: 'fa-bullhorn',
                title: item.title,
                description: '連絡事項',
                time: item.created_at
            });
        });
        
        // 動画の更新を取得
        const videosRes = await fetch('tables/videos?limit=3&sort=-created_at');
        const videosData = await videosRes.json();
        videosData.data.forEach(item => {
            updates.push({
                type: 'video',
                icon: 'fa-video',
                title: item.title,
                description: '動画マニュアル',
                time: item.created_at
            });
        });
        
        // チェック項目の更新を取得
        const checklistRes = await fetch('tables/checklist_items?limit=3&sort=-created_at');
        const checklistData = await checklistRes.json();
        checklistData.data.forEach(item => {
            updates.push({
                type: 'checklist',
                icon: 'fa-clipboard-check',
                title: item.item_text,
                description: `チェック項目（${item.category}）`,
                time: item.created_at
            });
        });
        
        // テスト問題の更新を取得
        const testRes = await fetch('tables/test_questions?limit=3&sort=-created_at');
        const testData = await testRes.json();
        testData.data.forEach(item => {
            updates.push({
                type: 'test',
                icon: 'fa-pencil-alt',
                title: item.question,
                description: 'テスト問題',
                time: item.created_at
            });
        });
        
        // 時系列でソートして最新3件を取得
        updates.sort((a, b) => new Date(b.time) - new Date(a.time));
        const latestUpdates = updates.slice(0, 3);
        
        displayUpdates(latestUpdates);
    } catch (error) {
        console.error('更新履歴読み込みエラー:', error);
    }
}

function displayUpdates(updates) {
    const container = document.getElementById('updatesList');
    
    if (updates.length === 0) {
        container.innerHTML = '<div class="no-updates">最近の更新はありません</div>';
        return;
    }
    
    container.innerHTML = updates.map(update => {
        const timeAgo = getTimeAgo(new Date(update.time));
        
        return `
            <div class="update-item">
                <div class="update-icon type-${update.type}">
                    <i class="fas ${update.icon}"></i>
                </div>
                <div class="update-content">
                    <div class="update-title">${update.title.substring(0, 50)}${update.title.length > 50 ? '...' : ''}</div>
                    <div class="update-meta">${update.description}</div>
                </div>
                <div class="update-time">${timeAgo}</div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'たった今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

// ========================================
// YouTube埋め込みコード処理
// ========================================
function parseYouTubeEmbed(embedCode) {
    // 埋め込みコードまたはURLからYouTube情報を抽出
    let videoId = '';
    let embedUrl = '';
    
    // iframeタグから抽出
    const iframeMatch = embedCode.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (iframeMatch) {
        embedUrl = iframeMatch[1];
    } else {
        // URLが直接入力された場合
        embedUrl = embedCode.trim();
    }
    
    // Video IDを抽出
    const embedIdMatch = embedUrl.match(/\/embed\/([a-zA-Z0-9_-]+)/);
    const watchIdMatch = embedUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    const shortIdMatch = embedUrl.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    
    if (embedIdMatch) {
        videoId = embedIdMatch[1];
    } else if (watchIdMatch) {
        videoId = watchIdMatch[1];
    } else if (shortIdMatch) {
        videoId = shortIdMatch[1];
    }
    
    // 標準化されたembed URLを生成
    if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    return {
        videoId: videoId,
        embedUrl: embedUrl,
        thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
    };
}

// ========================================
// 動画マニュアル機能
// ========================================
async function loadVideos() {
    try {
        console.log('動画データを読み込み中...');
        const response = await fetch('tables/videos?limit=100&sort=order_num');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('取得した動画データ:', data);
        
        if (!data.data || data.data.length === 0) {
            console.warn('動画データが空です');
            document.getElementById('videoList').innerHTML = '<p style="text-align:center; color:#999; padding:40px;">動画がまだ登録されていません。<br>管理者タブから動画を追加してください。</p>';
            return;
        }
        
        displayVideos(data.data);
        createCategoryFilter(data.data);
    } catch (error) {
        console.error('動画の読み込みエラー:', error);
        document.getElementById('videoList').innerHTML = '<p style="text-align:center; color:red; padding:40px;">動画の読み込みに失敗しました。<br>ページをリロードしてください。</p>';
    }
}

function displayVideos(videos, filterCategory = null) {
    const videoList = document.getElementById('videoList');
    const filteredVideos = filterCategory 
        ? videos.filter(v => v.category === filterCategory)
        : videos;

    videoList.innerHTML = filteredVideos.map(video => {
        // サムネイルURL（thumbnail_urlがあればそれを使用、なければYouTubeのデフォルトサムネイル）
        let thumbnailUrl = video.thumbnail_url || '';
        
        // YouTubeのURLからビデオIDを抽出してデフォルトサムネイルを生成
        if (!thumbnailUrl && video.youtube_url) {
            const videoIdMatch = video.youtube_url.match(/embed\/([a-zA-Z0-9_-]+)/);
            if (videoIdMatch) {
                thumbnailUrl = `https://img.youtube.com/vi/${videoIdMatch[1]}/hqdefault.jpg`;
            }
        }
        
        return `
            <div class="video-card" onclick="playVideo('${video.id}', '${video.title}', '${video.youtube_url}')">
                <div class="video-thumbnail">
                    <img src="${thumbnailUrl}" alt="${video.title}" onerror="this.src='https://via.placeholder.com/480x360?text=No+Thumbnail'">
                    <div class="play-overlay">
                        <i class="fas fa-play-circle"></i>
                    </div>
                </div>
                <div class="video-card-content">
                    <h3>${video.title}</h3>
                    <span class="badge">${video.category}</span>
                </div>
            </div>
        `;
    }).join('');
}

// 動画再生モーダル
function playVideo(videoId, title, url) {
    const modal = document.getElementById('editModal');
    const modalTitle = document.getElementById('editModalTitle');
    const modalBody = document.getElementById('editModalBody');
    
    modalTitle.textContent = title;
    modalBody.innerHTML = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
            <iframe src="${url}?autoplay=1" 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                    allowfullscreen 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
            </iframe>
        </div>
        <div style="margin-top: 20px; text-align: right;">
            <button class="btn-secondary" onclick="closeEditModal()">閉じる</button>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // 視聴記録
    trackVideoView(videoId, title);
}

function createCategoryFilter(videos) {
    const categories = [...new Set(videos.map(v => v.category))];
    const filterContainer = document.getElementById('categoryFilter');
    
    const allButton = '<button class="filter-btn active" onclick="filterVideosByCategory(null)">すべて</button>';
    const categoryButtons = categories.map(cat => 
        `<button class="filter-btn" onclick="filterVideosByCategory('${cat}')">${cat}</button>`
    ).join('');
    
    filterContainer.innerHTML = allButton + categoryButtons;
}

async function filterVideosByCategory(category) {
    const response = await fetch('tables/videos?limit=100&sort=order_num');
    const data = await response.json();
    displayVideos(data.data, category);

    // ボタンのアクティブ状態を更新
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((!category && btn.textContent === 'すべて') || 
            (btn.textContent === category)) {
            btn.classList.add('active');
        }
    });
}

async function trackVideoView(videoId, videoTitle) {
    try {
        await fetch('tables/video_views', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_name: currentUser,
                video_id: videoId,
                video_title: videoTitle,
                viewed_at: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('視聴記録エラー:', error);
    }
}

// ========================================
// チェックシート機能
// ========================================
async function initChecklist() {
    // データベースからチェック項目を読み込む
    await loadChecklistData();
    
    const categoryBtns = document.querySelectorAll('.category-btn');
    
    // 初期カテゴリーを表示
    displayChecklistItems('開店準備');

    // カテゴリー切り替え
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            displayChecklistItems(category);
        });
    });

    // フォーム送信
    const form = document.getElementById('checklistForm');
    form.removeEventListener('submit', handleChecklistSubmit);
    form.addEventListener('submit', handleChecklistSubmit);
}

async function loadChecklistData() {
    try {
        console.log('チェックリストデータを読み込み中...');
        const response = await fetch('tables/checklist_items?limit=1000&sort=order_num');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('取得したチェックリストデータ:', data);
        
        if (!data.data || data.data.length === 0) {
            console.warn('チェックリストデータが空です');
            return;
        }
        
        // カテゴリーごとに整理
        checklistData = {};
        data.data.forEach(item => {
            if (!checklistData[item.category]) {
                checklistData[item.category] = [];
            }
            checklistData[item.category].push(item.item_text);
        });
        
        console.log('整理されたチェックリストデータ:', checklistData);
    } catch (error) {
        console.error('チェックリストデータ読み込みエラー:', error);
    }
}

function displayChecklistItems(category) {
    const items = checklistData[category] || [];
    const container = document.getElementById('checklistItems');
    
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">このカテゴリーにはチェック項目がありません</p>';
        return;
    }
    
    container.innerHTML = items.map((item, index) => `
        <div class="checklist-item">
            <input type="checkbox" id="check-${index}" name="check-${index}" value="${item}">
            <label for="check-${index}">${item}</label>
        </div>
    `).join('');
}

async function handleChecklistSubmit(e) {
    e.preventDefault();
    
    const activeCategory = document.querySelector('.category-btn.active').dataset.category;
    const checkboxes = document.querySelectorAll('#checklistItems input[type="checkbox"]');
    const responses = {};
    
    checkboxes.forEach(checkbox => {
        responses[checkbox.value] = checkbox.checked;
    });

    try {
        await fetch('tables/checklist_responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_name: currentUser,
                category: activeCategory,
                responses: JSON.stringify(responses),
                submitted_at: new Date().toISOString()
            })
        });

        // 成功メッセージを表示
        const successMsg = document.getElementById('checklistSuccess');
        successMsg.style.display = 'block';
        setTimeout(() => {
            successMsg.style.display = 'none';
        }, 3000);

        // フォームをリセット
        document.getElementById('checklistForm').reset();
    } catch (error) {
        console.error('チェックシート送信エラー:', error);
        alert('送信に失敗しました。もう一度お試しください。');
    }
}

// ========================================
// テスト機能
// ========================================
async function initTest() {
    // データベースからテスト問題を読み込む
    await loadTestData();
    
    displayTestQuestions();
    
    const form = document.getElementById('testForm');
    form.removeEventListener('submit', handleTestSubmit);
    form.addEventListener('submit', handleTestSubmit);
}

async function loadTestData() {
    try {
        console.log('テスト問題を読み込み中...');
        const response = await fetch('tables/test_questions?limit=1000&sort=order_num');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('取得したテスト問題データ:', data);
        
        if (!data.data || data.data.length === 0) {
            console.warn('テスト問題データが空です');
            return;
        }
        
        testData.questions = data.data.map(q => ({
            question: q.question,
            options: JSON.parse(q.options),
            correct: q.correct_answer
        }));
        
        console.log('整理されたテスト問題:', testData.questions);
    } catch (error) {
        console.error('テストデータ読み込みエラー:', error);
    }
}

function displayTestQuestions() {
    const container = document.getElementById('testQuestions');
    
    if (testData.questions.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">テスト問題がありません</p>';
        return;
    }
    
    container.innerHTML = testData.questions.map((q, index) => `
        <div class="test-question">
            <h4>問${index + 1}. ${q.question}</h4>
            <div class="test-options">
                ${q.options.map((option, optIndex) => `
                    <div class="test-option">
                        <input type="radio" 
                               id="q${index}-opt${optIndex}" 
                               name="question${index}" 
                               value="${optIndex}">
                        <label for="q${index}-opt${optIndex}">${option}</label>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

async function handleTestSubmit(e) {
    e.preventDefault();
    
    const responses = {};
    let score = 0;

    testData.questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="question${index}"]:checked`);
        if (selected) {
            const answer = parseInt(selected.value);
            responses[`question${index}`] = answer;
            if (answer === q.correct) {
                score++;
            }
        }
    });

    const totalQuestions = testData.questions.length;

    try {
        await fetch('tables/test_responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_name: currentUser,
                test_name: testData.name,
                score: score,
                total_questions: totalQuestions,
                responses: JSON.stringify(responses),
                submitted_at: new Date().toISOString()
            })
        });

        // 結果を表示
        displayTestResult(score, totalQuestions);

        // フォームをリセット
        document.getElementById('testForm').reset();
    } catch (error) {
        console.error('テスト送信エラー:', error);
        alert('送信に失敗しました。もう一度お試しください。');
    }
}

function displayTestResult(score, total) {
    const percentage = Math.round((score / total) * 100);
    const resultDiv = document.getElementById('testResult');
    
    let message = '';
    if (percentage >= 90) {
        message = '素晴らしい！完璧です！🎉';
    } else if (percentage >= 70) {
        message = 'よくできました！👏';
    } else if (percentage >= 50) {
        message = 'もう少し！頑張りましょう！💪';
    } else {
        message = '復習が必要です。動画を見直しましょう！📚';
    }

    resultDiv.innerHTML = `
        <h3>テスト結果</h3>
        <p style="font-size: 36px; font-weight: 700;">${score} / ${total} 問正解</p>
        <p style="font-size: 24px;">正答率: ${percentage}%</p>
        <p style="font-size: 20px; margin-top: 15px;">${message}</p>
    `;
    resultDiv.style.display = 'block';

    // 3秒後にスクロール
    setTimeout(() => {
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    }, 300);
}

// ========================================
// ランキング機能
// ========================================
async function loadRankings() {
    await loadTestRanking();
    await loadVideoRanking();
}

async function loadTestRanking() {
    try {
        const response = await fetch('tables/test_responses?limit=1000');
        const data = await response.json();
        
        // ユーザーごとのチャレンジ数を集計
        const userCounts = {};
        data.data.forEach(record => {
            userCounts[record.user_name] = (userCounts[record.user_name] || 0) + 1;
        });

        // ランキング形式に変換してソート
        const ranking = Object.entries(userCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        displayRanking(ranking, 'testRanking', 'チャレンジ');
    } catch (error) {
        console.error('テストランキング読み込みエラー:', error);
    }
}

async function loadVideoRanking() {
    try {
        const response = await fetch('tables/video_views?limit=1000');
        const data = await response.json();
        
        // ユーザーごとの視聴数を集計
        const userCounts = {};
        data.data.forEach(record => {
            userCounts[record.user_name] = (userCounts[record.user_name] || 0) + 1;
        });

        // ランキング形式に変換してソート
        const ranking = Object.entries(userCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        displayRanking(ranking, 'videoRanking', '視聴回数');
    } catch (error) {
        console.error('動画ランキング読み込みエラー:', error);
    }
}

function displayRanking(ranking, containerId, label) {
    const container = document.getElementById(containerId);
    
    if (ranking.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">データがありません</p>';
        return;
    }

    container.innerHTML = ranking.map((item, index) => {
        const position = index + 1;
        let positionClass = 'other';
        if (position === 1) positionClass = 'gold';
        else if (position === 2) positionClass = 'silver';
        else if (position === 3) positionClass = 'bronze';

        return `
            <div class="ranking-item">
                <div class="ranking-position ${positionClass}">${position}</div>
                <div class="ranking-info">
                    <div class="name">${item.name}</div>
                    <div class="count">${item.count} ${label}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// 管理者ビュー
// ========================================
async function loadAdminData() {
    await loadAdminChecklist();
    await loadAdminTest();
    await loadAdminVideoViews();
}

async function loadAdminChecklist() {
    try {
        const response = await fetch('tables/checklist_responses?limit=1000&sort=-created_at');
        const data = await response.json();
        
        const container = document.getElementById('adminChecklistData');
        
        if (data.data.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999;">データがありません</p>';
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>日時</th>
                        <th>ユーザー名</th>
                        <th>カテゴリー</th>
                        <th>回答数</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.data.map(record => {
                        const responses = JSON.parse(record.responses);
                        const checkedCount = Object.values(responses).filter(v => v).length;
                        const totalCount = Object.keys(responses).length;
                        const date = new Date(record.submitted_at || record.created_at).toLocaleString('ja-JP');
                        
                        return `
                            <tr>
                                <td>${date}</td>
                                <td>${record.user_name}</td>
                                <td>${record.category}</td>
                                <td>${checkedCount} / ${totalCount}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('チェックリストデータ読み込みエラー:', error);
    }
}

async function loadAdminTest() {
    try {
        const response = await fetch('tables/test_responses?limit=1000&sort=-created_at');
        const data = await response.json();
        
        const container = document.getElementById('adminTestData');
        
        if (data.data.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999;">データがありません</p>';
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>日時</th>
                        <th>ユーザー名</th>
                        <th>テスト名</th>
                        <th>スコア</th>
                        <th>正答率</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.data.map(record => {
                        const percentage = Math.round((record.score / record.total_questions) * 100);
                        const date = new Date(record.submitted_at || record.created_at).toLocaleString('ja-JP');
                        
                        return `
                            <tr>
                                <td>${date}</td>
                                <td>${record.user_name}</td>
                                <td>${record.test_name}</td>
                                <td>${record.score} / ${record.total_questions}</td>
                                <td>${percentage}%</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('テストデータ読み込みエラー:', error);
    }
}

async function loadAdminVideoViews() {
    try {
        const response = await fetch('tables/video_views?limit=1000&sort=-created_at');
        const data = await response.json();
        
        const container = document.getElementById('adminVideoData');
        
        if (data.data.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999;">データがありません</p>';
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>日時</th>
                        <th>ユーザー名</th>
                        <th>動画タイトル</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.data.map(record => {
                        const date = new Date(record.viewed_at || record.created_at).toLocaleString('ja-JP');
                        
                        return `
                            <tr>
                                <td>${date}</td>
                                <td>${record.user_name}</td>
                                <td>${record.video_title}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('動画視聴データ読み込みエラー:', error);
    }
}

// ========================================
// CSV出力機能
// ========================================
async function exportChecklistCSV() {
    try {
        const response = await fetch('tables/checklist_responses?limit=10000');
        const data = await response.json();
        
        const csv = convertToCSV(data.data, ['日時', 'ユーザー名', 'カテゴリー', '回答データ'], 
            record => {
                const date = new Date(record.submitted_at || record.created_at).toLocaleString('ja-JP');
                return [date, record.user_name, record.category, record.responses];
            });
        
        downloadCSV(csv, 'チェックシート回答.csv');
    } catch (error) {
        console.error('CSV出力エラー:', error);
        alert('CSV出力に失敗しました');
    }
}

async function exportTestCSV() {
    try {
        const response = await fetch('tables/test_responses?limit=10000');
        const data = await response.json();
        
        const csv = convertToCSV(data.data, ['日時', 'ユーザー名', 'テスト名', 'スコア', '総問題数', '正答率'], 
            record => {
                const date = new Date(record.submitted_at || record.created_at).toLocaleString('ja-JP');
                const percentage = Math.round((record.score / record.total_questions) * 100);
                return [date, record.user_name, record.test_name, record.score, record.total_questions, `${percentage}%`];
            });
        
        downloadCSV(csv, 'テスト結果.csv');
    } catch (error) {
        console.error('CSV出力エラー:', error);
        alert('CSV出力に失敗しました');
    }
}

async function exportVideoViewsCSV() {
    try {
        const response = await fetch('tables/video_views?limit=10000');
        const data = await response.json();
        
        const csv = convertToCSV(data.data, ['日時', 'ユーザー名', '動画タイトル'], 
            record => {
                const date = new Date(record.viewed_at || record.created_at).toLocaleString('ja-JP');
                return [date, record.user_name, record.video_title];
            });
        
        downloadCSV(csv, '動画視聴履歴.csv');
    } catch (error) {
        console.error('CSV出力エラー:', error);
        alert('CSV出力に失敗しました');
    }
}

function convertToCSV(data, headers, rowMapper) {
    const rows = [headers];
    
    data.forEach(record => {
        rows.push(rowMapper(record));
    });
    
    return rows.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
}

function downloadCSV(csv, filename) {
    const bom = '\uFEFF'; // UTF-8 BOM
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ========================================
// 管理者タブ切り替え
// ========================================
function switchAdminTab(tab) {
    // ボタンのアクティブ状態を更新
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // コンテンツの表示切り替え
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    if (tab === 'data') {
        document.getElementById('adminData').classList.add('active');
        loadAdminData();
    } else if (tab === 'announcements') {
        document.getElementById('adminAnnouncements').classList.add('active');
        loadAnnouncementManagement();
    } else if (tab === 'shift') {
        document.getElementById('adminShift').classList.add('active');
        loadVacancyManagement();
        loadPdfLinkManagement();
    } else if (tab === 'videos') {
        document.getElementById('adminVideos').classList.add('active');
        loadVideoManagement();
    } else if (tab === 'checklist') {
        document.getElementById('adminChecklist').classList.add('active');
        loadChecklistManagement();
    } else if (tab === 'test') {
        document.getElementById('adminTest').classList.add('active');
        loadTestQuestionManagement();
    }
}

// ========================================
// 連絡事項管理機能
// ========================================
async function loadAnnouncementManagement() {
    try {
        const response = await fetch('tables/announcements?limit=1000&sort=-created_at');
        const data = await response.json();
        
        const container = document.getElementById('announcementManagementList');
        
        if (data.data.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999;">連絡事項がありません</p>';
            return;
        }

        container.innerHTML = data.data.map(announcement => {
            const date = new Date(announcement.created_at).toLocaleString('ja-JP');
            return `
                <div class="management-item">
                    <div class="management-item-content">
                        <h4>${announcement.is_pinned ? '📌 ' : ''}${announcement.title}</h4>
                        <p>${announcement.content.substring(0, 100)}${announcement.content.length > 100 ? '...' : ''}</p>
                        <p style="font-size: 14px; color: #666;">
                            優先度: ${announcement.priority} | 作成日時: ${date}
                        </p>
                    </div>
                    <div class="management-item-actions">
                        <button class="btn-edit" onclick='editAnnouncement(${JSON.stringify(announcement)})'>
                            <i class="fas fa-edit"></i> 編集
                        </button>
                        <button class="btn-delete" onclick="deleteAnnouncement('${announcement.id}')">
                            <i class="fas fa-trash"></i> 削除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('連絡事項管理データ読み込みエラー:', error);
    }
}

function showAddAnnouncementModal() {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');
    
    title.textContent = '新規連絡事項追加';
    body.innerHTML = `
        <label>タイトル</label>
        <input type="text" id="announcementTitle" placeholder="連絡事項のタイトル">
        
        <label>内容</label>
        <textarea id="announcementContent" placeholder="連絡事項の内容を入力" rows="6"></textarea>
        
        <label>優先度</label>
        <select id="announcementPriority">
            <option value="低">低</option>
            <option value="中" selected>中</option>
            <option value="高">高</option>
        </select>
        
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" id="announcementPinned" style="width: auto;">
            <span>ピン留めする（常に上部に表示）</span>
        </label>
        
        <div class="btn-group">
            <button class="btn-secondary" onclick="closeEditModal()">キャンセル</button>
            <button class="btn-primary" onclick="saveNewAnnouncement()">保存</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function saveNewAnnouncement() {
    const title = document.getElementById('announcementTitle').value.trim();
    const content = document.getElementById('announcementContent').value.trim();
    const priority = document.getElementById('announcementPriority').value;
    const isPinned = document.getElementById('announcementPinned').checked;
    
    if (!title || !content) {
        alert('タイトルと内容を入力してください');
        return;
    }
    
    try {
        await fetch('tables/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                content: content,
                priority: priority,
                is_pinned: isPinned,
                created_at: new Date().toISOString()
            })
        });
        
        alert('連絡事項を追加しました！');
        closeEditModal();
        loadAnnouncementManagement();
        loadAnnouncements(); // ホーム画面も更新
    } catch (error) {
        console.error('連絡事項追加エラー:', error);
        alert('連絡事項の追加に失敗しました');
    }
}

function editAnnouncement(announcement) {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');
    
    title.textContent = '連絡事項編集';
    body.innerHTML = `
        <label>タイトル</label>
        <input type="text" id="announcementTitle" value="${announcement.title}">
        
        <label>内容</label>
        <textarea id="announcementContent" rows="6">${announcement.content}</textarea>
        
        <label>優先度</label>
        <select id="announcementPriority">
            <option value="低" ${announcement.priority === '低' ? 'selected' : ''}>低</option>
            <option value="中" ${announcement.priority === '中' ? 'selected' : ''}>中</option>
            <option value="高" ${announcement.priority === '高' ? 'selected' : ''}>高</option>
        </select>
        
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" id="announcementPinned" ${announcement.is_pinned ? 'checked' : ''} style="width: auto;">
            <span>ピン留めする（常に上部に表示）</span>
        </label>
        
        <div class="btn-group">
            <button class="btn-secondary" onclick="closeEditModal()">キャンセル</button>
            <button class="btn-primary" onclick="updateAnnouncement('${announcement.id}')">更新</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function updateAnnouncement(announcementId) {
    const title = document.getElementById('announcementTitle').value.trim();
    const content = document.getElementById('announcementContent').value.trim();
    const priority = document.getElementById('announcementPriority').value;
    const isPinned = document.getElementById('announcementPinned').checked;
    
    if (!title || !content) {
        alert('タイトルと内容を入力してください');
        return;
    }
    
    try {
        await fetch(`tables/announcements/${announcementId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                content: content,
                priority: priority,
                is_pinned: isPinned,
                created_at: new Date().toISOString()
            })
        });
        
        alert('連絡事項を更新しました！');
        closeEditModal();
        loadAnnouncementManagement();
        loadAnnouncements(); // ホーム画面も更新
    } catch (error) {
        console.error('連絡事項更新エラー:', error);
        alert('連絡事項の更新に失敗しました');
    }
}

async function deleteAnnouncement(announcementId) {
    if (!confirm('この連絡事項を削除してもよろしいですか？')) {
        return;
    }
    
    try {
        await fetch(`tables/announcements/${announcementId}`, {
            method: 'DELETE'
        });
        
        alert('連絡事項を削除しました');
        loadAnnouncementManagement();
        loadAnnouncements(); // ホーム画面も更新
    } catch (error) {
        console.error('連絡事項削除エラー:', error);
        alert('連絡事項の削除に失敗しました');
    }
}

// ========================================
// 動画管理機能
// ========================================
async function loadVideoManagement() {
    try {
        console.log('管理者：動画管理データを読み込み中...');
        const response = await fetch('tables/videos?limit=1000&sort=order_num');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('管理者：取得した動画データ:', data);
        
        const container = document.getElementById('videoManagementList');
        
        if (!container) {
            console.error('videoManagementList要素が見つかりません');
            return;
        }
        
        if (!data.data || data.data.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999;">動画がありません。「新規動画追加」ボタンから追加してください。</p>';
            return;
        }

        container.innerHTML = data.data.map(video => `
            <div class="management-item">
                <div class="management-item-content">
                    <h4>${video.title}</h4>
                    <p>カテゴリー: ${video.category} | 表示順: ${video.order_num}</p>
                    <p style="font-size: 12px; color: #999;">URL: ${video.youtube_url}</p>
                </div>
                <div class="management-item-actions">
                    <button class="btn-edit" onclick='editVideo(${JSON.stringify(video)})'>
                        <i class="fas fa-edit"></i> 編集
                    </button>
                    <button class="btn-delete" onclick="deleteVideo('${video.id}')">
                        <i class="fas fa-trash"></i> 削除
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('動画管理データ読み込みエラー:', error);
    }
}

function showAddVideoModal() {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');
    
    title.textContent = '新規動画追加';
    body.innerHTML = `
        <label>動画タイトル</label>
        <input type="text" id="videoTitle" placeholder="動画のタイトル">
        
        <label>YouTube埋め込みコード / URL</label>
        <textarea id="videoEmbedCode" rows="4" placeholder="YouTubeの埋め込みコードまたはURLをペースト&#10;&#10;例1: <iframe src='https://www.youtube.com/embed/xxxxx'...>&#10;例2: https://www.youtube.com/watch?v=xxxxx&#10;例3: https://youtu.be/xxxxx"></textarea>
        <button type="button" class="btn-secondary" onclick="previewVideo()" style="margin-top: 10px; width: 100%;">
            <i class="fas fa-eye"></i> プレビュー
        </button>
        
        <div id="videoPreview" style="display: none; margin-top: 15px; background: #f0f0f0; padding: 15px; border-radius: 10px;">
            <p style="font-weight: 600; margin-bottom: 10px;">プレビュー：</p>
            <div id="videoPreviewFrame" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;"></div>
        </div>
        
        <label style="margin-top: 15px;">カスタムサムネイルURL（オプション）</label>
        <input type="text" id="videoThumbnail" placeholder="独自のサムネイル画像URL">
        <p style="font-size: 12px; color: #666; margin-top: -10px;">
            ※ 空欄の場合はYouTubeのデフォルトサムネイルを使用
        </p>
        
        <label>カテゴリー</label>
        <input type="text" id="videoCategory" placeholder="例: 基本、応用、特別研修">
        
        <label>表示順</label>
        <input type="number" id="videoOrder" value="1" min="1">
        
        <div class="btn-group">
            <button class="btn-secondary" onclick="closeEditModal()">キャンセル</button>
            <button class="btn-primary" onclick="saveNewVideo()">保存</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// プレビュー機能
function previewVideo() {
    const embedCode = document.getElementById('videoEmbedCode').value.trim();
    const previewContainer = document.getElementById('videoPreview');
    const previewFrame = document.getElementById('videoPreviewFrame');
    
    if (!embedCode) {
        alert('埋め込みコードまたはURLを入力してください');
        return;
    }
    
    const parsed = parseYouTubeEmbed(embedCode);
    
    if (!parsed.videoId) {
        alert('有効なYouTube URLが見つかりませんでした。\n\n対応形式:\n・埋め込みコード (<iframe...>)\n・通常URL (youtube.com/watch?v=...)\n・短縮URL (youtu.be/...)');
        return;
    }
    
    // プレビューを表示
    previewFrame.innerHTML = `
        <iframe src="${parsed.embedUrl}" 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
                allowfullscreen 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture">
        </iframe>
    `;
    previewContainer.style.display = 'block';
    
    console.log('プレビュー表示:', parsed);
}

async function saveNewVideo() {
    const title = document.getElementById('videoTitle').value.trim();
    const embedCode = document.getElementById('videoEmbedCode').value.trim();
    const customThumbnail = document.getElementById('videoThumbnail').value.trim();
    const category = document.getElementById('videoCategory').value.trim();
    const order = parseInt(document.getElementById('videoOrder').value);
    
    if (!title || !embedCode || !category) {
        alert('タイトル、埋め込みコード、カテゴリーを入力してください');
        return;
    }
    
    // YouTube埋め込みコードをパース
    const parsed = parseYouTubeEmbed(embedCode);
    
    if (!parsed.videoId) {
        alert('有効なYouTube URLが見つかりませんでした。\n\n対応形式:\n・埋め込みコード (<iframe...>)\n・通常URL (youtube.com/watch?v=...)\n・短縮URL (youtu.be/...)');
        return;
    }
    
    // サムネイルはカスタム指定があればそれを、なければYouTubeのデフォルトを使用
    const thumbnailUrl = customThumbnail || parsed.thumbnailUrl;
    
    const videoData = {
        title: title,
        youtube_url: parsed.embedUrl,
        thumbnail_url: thumbnailUrl,
        category: category,
        order_num: order
    };
    
    console.log('動画を保存中...', videoData);
    
    try {
        const response = await fetch('tables/videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(videoData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('動画保存成功:', result);
        
        alert('動画を追加しました！');
        closeEditModal();
        
        // 両方の画面を更新
        console.log('画面を更新中...');
        await loadVideoManagement();
        await loadVideos();
        console.log('画面更新完了');
    } catch (error) {
        console.error('動画追加エラー:', error);
        alert('動画の追加に失敗しました: ' + error.message);
    }
}

function editVideo(video) {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');
    
    title.textContent = '動画編集';
    body.innerHTML = `
        <label>動画タイトル</label>
        <input type="text" id="videoTitle" value="${video.title}">
        
        <label>YouTube埋め込みコード / URL</label>
        <textarea id="videoEmbedCode" rows="4" placeholder="YouTubeの埋め込みコードまたはURLをペースト&#10;&#10;例1: <iframe src='https://www.youtube.com/embed/xxxxx'...>&#10;例2: https://www.youtube.com/watch?v=xxxxx&#10;例3: https://youtu.be/xxxxx">${video.youtube_url}</textarea>
        <button type="button" class="btn-secondary" onclick="previewVideo()" style="margin-top: 10px; width: 100%;">
            <i class="fas fa-eye"></i> プレビュー
        </button>
        
        <div id="videoPreview" style="display: none; margin-top: 15px; background: #f0f0f0; padding: 15px; border-radius: 10px;">
            <p style="font-weight: 600; margin-bottom: 10px;">プレビュー：</p>
            <div id="videoPreviewFrame" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;"></div>
        </div>
        
        <label style="margin-top: 15px;">カスタムサムネイルURL（オプション）</label>
        <input type="text" id="videoThumbnail" value="${video.thumbnail_url || ''}" placeholder="独自のサムネイル画像URL">
        <p style="font-size: 12px; color: #666; margin-top: -10px;">
            ※ 空欄の場合はYouTubeのデフォルトサムネイルを使用
        </p>
        
        <label>カテゴリー</label>
        <input type="text" id="videoCategory" value="${video.category}">
        
        <label>表示順</label>
        <input type="number" id="videoOrder" value="${video.order_num}" min="1">
        
        <div class="btn-group">
            <button class="btn-secondary" onclick="closeEditModal()">キャンセル</button>
            <button class="btn-primary" onclick="updateVideo('${video.id}')">更新</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function updateVideo(videoId) {
    const title = document.getElementById('videoTitle').value.trim();
    const embedCode = document.getElementById('videoEmbedCode').value.trim();
    const customThumbnail = document.getElementById('videoThumbnail').value.trim();
    const category = document.getElementById('videoCategory').value.trim();
    const order = parseInt(document.getElementById('videoOrder').value);
    
    if (!title || !embedCode || !category) {
        alert('タイトル、埋め込みコード、カテゴリーを入力してください');
        return;
    }
    
    // YouTube埋め込みコードをパース
    const parsed = parseYouTubeEmbed(embedCode);
    
    if (!parsed.videoId) {
        alert('有効なYouTube URLが見つかりませんでした。\n\n対応形式:\n・埋め込みコード (<iframe...>)\n・通常URL (youtube.com/watch?v=...)\n・短縮URL (youtu.be/...)');
        return;
    }
    
    // サムネイルはカスタム指定があればそれを、なければYouTubeのデフォルトを使用
    const thumbnailUrl = customThumbnail || parsed.thumbnailUrl;
    
    const videoData = {
        title: title,
        youtube_url: parsed.embedUrl,
        thumbnail_url: thumbnailUrl,
        category: category,
        order_num: order
    };
    
    console.log('動画を更新中...', videoId, videoData);
    
    try {
        const response = await fetch(`tables/videos/${videoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(videoData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('動画更新成功:', result);
        
        alert('動画を更新しました！');
        closeEditModal();
        
        // 両方の画面を更新
        console.log('画面を更新中...');
        await loadVideoManagement();
        await loadVideos();
        console.log('画面更新完了');
    } catch (error) {
        console.error('動画更新エラー:', error);
        alert('動画の更新に失敗しました: ' + error.message);
    }
}

async function deleteVideo(videoId) {
    if (!confirm('この動画を削除してもよろしいですか？')) {
        return;
    }
    
    try {
        await fetch(`tables/videos/${videoId}`, {
            method: 'DELETE'
        });
        
        alert('動画を削除しました');
        loadVideoManagement();
        loadVideos(); // メイン画面も更新
    } catch (error) {
        console.error('動画削除エラー:', error);
        alert('動画の削除に失敗しました');
    }
}

// ========================================
// チェック項目管理機能
// ========================================
let currentChecklistFilter = 'all';

async function loadChecklistManagement(filter = 'all') {
    currentChecklistFilter = filter;
    
    try {
        const response = await fetch('tables/checklist_items?limit=1000&sort=order_num');
        const data = await response.json();
        
        const container = document.getElementById('checklistManagementList');
        
        let filteredData = data.data;
        if (filter !== 'all') {
            filteredData = data.data.filter(item => item.category === filter);
        }
        
        if (filteredData.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999;">チェック項目がありません</p>';
            return;
        }

        container.innerHTML = filteredData.map(item => `
            <div class="management-item">
                <div class="management-item-content">
                    <h4>${item.item_text}</h4>
                    <p>カテゴリー: ${item.category} | 表示順: ${item.order_num}</p>
                </div>
                <div class="management-item-actions">
                    <button class="btn-edit" onclick='editChecklistItem(${JSON.stringify(item)})'>
                        <i class="fas fa-edit"></i> 編集
                    </button>
                    <button class="btn-delete" onclick="deleteChecklistItem('${item.id}')">
                        <i class="fas fa-trash"></i> 削除
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('チェック項目管理データ読み込みエラー:', error);
    }
}

function filterChecklistManagement(category) {
    loadChecklistManagement(category);
    
    // ボタンのアクティブ状態を更新
    document.querySelectorAll('#adminChecklist .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((category === 'all' && btn.textContent === 'すべて') || 
            btn.textContent === category) {
            btn.classList.add('active');
        }
    });
}

function showAddChecklistModal() {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');
    
    title.textContent = '新規チェック項目追加';
    body.innerHTML = `
        <label>項目内容</label>
        <input type="text" id="checklistItemText" placeholder="チェック項目の内容">
        
        <label>カテゴリー</label>
        <select id="checklistCategory">
            <option value="開店準備">開店準備</option>
            <option value="接客対応">接客対応</option>
            <option value="商品管理">商品管理</option>
            <option value="閉店作業">閉店作業</option>
        </select>
        
        <label>表示順</label>
        <input type="number" id="checklistOrder" value="1" min="1">
        
        <div class="btn-group">
            <button class="btn-secondary" onclick="closeEditModal()">キャンセル</button>
            <button class="btn-primary" onclick="saveNewChecklistItem()">保存</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function saveNewChecklistItem() {
    const itemText = document.getElementById('checklistItemText').value.trim();
    const category = document.getElementById('checklistCategory').value;
    const order = parseInt(document.getElementById('checklistOrder').value);
    
    if (!itemText) {
        alert('項目内容を入力してください');
        return;
    }
    
    try {
        await fetch('tables/checklist_items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                item_text: itemText,
                category: category,
                order_num: order
            })
        });
        
        alert('チェック項目を追加しました！');
        closeEditModal();
        loadChecklistManagement(currentChecklistFilter);
        initChecklist(); // メイン画面も更新
    } catch (error) {
        console.error('チェック項目追加エラー:', error);
        alert('チェック項目の追加に失敗しました');
    }
}

function editChecklistItem(item) {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');
    
    title.textContent = 'チェック項目編集';
    body.innerHTML = `
        <label>項目内容</label>
        <input type="text" id="checklistItemText" value="${item.item_text}">
        
        <label>カテゴリー</label>
        <select id="checklistCategory">
            <option value="開店準備" ${item.category === '開店準備' ? 'selected' : ''}>開店準備</option>
            <option value="接客対応" ${item.category === '接客対応' ? 'selected' : ''}>接客対応</option>
            <option value="商品管理" ${item.category === '商品管理' ? 'selected' : ''}>商品管理</option>
            <option value="閉店作業" ${item.category === '閉店作業' ? 'selected' : ''}>閉店作業</option>
        </select>
        
        <label>表示順</label>
        <input type="number" id="checklistOrder" value="${item.order_num}" min="1">
        
        <div class="btn-group">
            <button class="btn-secondary" onclick="closeEditModal()">キャンセル</button>
            <button class="btn-primary" onclick="updateChecklistItem('${item.id}')">更新</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function updateChecklistItem(itemId) {
    const itemText = document.getElementById('checklistItemText').value.trim();
    const category = document.getElementById('checklistCategory').value;
    const order = parseInt(document.getElementById('checklistOrder').value);
    
    if (!itemText) {
        alert('項目内容を入力してください');
        return;
    }
    
    try {
        await fetch(`tables/checklist_items/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                item_text: itemText,
                category: category,
                order_num: order
            })
        });
        
        alert('チェック項目を更新しました！');
        closeEditModal();
        loadChecklistManagement(currentChecklistFilter);
        initChecklist(); // メイン画面も更新
    } catch (error) {
        console.error('チェック項目更新エラー:', error);
        alert('チェック項目の更新に失敗しました');
    }
}

async function deleteChecklistItem(itemId) {
    if (!confirm('このチェック項目を削除してもよろしいですか？')) {
        return;
    }
    
    try {
        await fetch(`tables/checklist_items/${itemId}`, {
            method: 'DELETE'
        });
        
        alert('チェック項目を削除しました');
        loadChecklistManagement(currentChecklistFilter);
        initChecklist(); // メイン画面も更新
    } catch (error) {
        console.error('チェック項目削除エラー:', error);
        alert('チェック項目の削除に失敗しました');
    }
}

// ========================================
// テスト問題管理機能
// ========================================
async function loadTestQuestionManagement() {
    try {
        const response = await fetch('tables/test_questions?limit=1000&sort=order_num');
        const data = await response.json();
        
        const container = document.getElementById('testQuestionManagementList');
        
        if (data.data.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999;">テスト問題がありません</p>';
            return;
        }

        container.innerHTML = data.data.map(question => {
            const options = JSON.parse(question.options);
            return `
                <div class="management-item">
                    <div class="management-item-content">
                        <h4>${question.question}</h4>
                        <p>選択肢: ${options.join(' / ')}</p>
                        <p>正解: ${options[question.correct_answer]} (選択肢${question.correct_answer + 1})</p>
                        <p>表示順: ${question.order_num}</p>
                    </div>
                    <div class="management-item-actions">
                        <button class="btn-edit" onclick='editTestQuestion(${JSON.stringify(question)})'>
                            <i class="fas fa-edit"></i> 編集
                        </button>
                        <button class="btn-delete" onclick="deleteTestQuestion('${question.id}')">
                            <i class="fas fa-trash"></i> 削除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('テスト問題管理データ読み込みエラー:', error);
    }
}

function showAddTestQuestionModal() {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');
    
    title.textContent = '新規テスト問題追加';
    body.innerHTML = `
        <label>問題文</label>
        <textarea id="testQuestion" placeholder="問題の内容を入力"></textarea>
        
        <label>選択肢1</label>
        <input type="text" id="testOption1" placeholder="選択肢1">
        
        <label>選択肢2</label>
        <input type="text" id="testOption2" placeholder="選択肢2">
        
        <label>選択肢3</label>
        <input type="text" id="testOption3" placeholder="選択肢3">
        
        <label>選択肢4</label>
        <input type="text" id="testOption4" placeholder="選択肢4">
        
        <label>正解</label>
        <select id="testCorrectAnswer">
            <option value="0">選択肢1</option>
            <option value="1">選択肢2</option>
            <option value="2">選択肢3</option>
            <option value="3">選択肢4</option>
        </select>
        
        <label>表示順</label>
        <input type="number" id="testOrder" value="1" min="1">
        
        <div class="btn-group">
            <button class="btn-secondary" onclick="closeEditModal()">キャンセル</button>
            <button class="btn-primary" onclick="saveNewTestQuestion()">保存</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function saveNewTestQuestion() {
    const question = document.getElementById('testQuestion').value.trim();
    const option1 = document.getElementById('testOption1').value.trim();
    const option2 = document.getElementById('testOption2').value.trim();
    const option3 = document.getElementById('testOption3').value.trim();
    const option4 = document.getElementById('testOption4').value.trim();
    const correct = parseInt(document.getElementById('testCorrectAnswer').value);
    const order = parseInt(document.getElementById('testOrder').value);
    
    if (!question || !option1 || !option2 || !option3 || !option4) {
        alert('すべての項目を入力してください');
        return;
    }
    
    const options = [option1, option2, option3, option4];
    
    try {
        await fetch('tables/test_questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                options: JSON.stringify(options),
                correct_answer: correct,
                order_num: order
            })
        });
        
        alert('テスト問題を追加しました！');
        closeEditModal();
        loadTestQuestionManagement();
        initTest(); // メイン画面も更新
    } catch (error) {
        console.error('テスト問題追加エラー:', error);
        alert('テスト問題の追加に失敗しました');
    }
}

function editTestQuestion(question) {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');
    
    const options = JSON.parse(question.options);
    
    title.textContent = 'テスト問題編集';
    body.innerHTML = `
        <label>問題文</label>
        <textarea id="testQuestion">${question.question}</textarea>
        
        <label>選択肢1</label>
        <input type="text" id="testOption1" value="${options[0]}">
        
        <label>選択肢2</label>
        <input type="text" id="testOption2" value="${options[1]}">
        
        <label>選択肢3</label>
        <input type="text" id="testOption3" value="${options[2]}">
        
        <label>選択肢4</label>
        <input type="text" id="testOption4" value="${options[3]}">
        
        <label>正解</label>
        <select id="testCorrectAnswer">
            <option value="0" ${question.correct_answer === 0 ? 'selected' : ''}>選択肢1</option>
            <option value="1" ${question.correct_answer === 1 ? 'selected' : ''}>選択肢2</option>
            <option value="2" ${question.correct_answer === 2 ? 'selected' : ''}>選択肢3</option>
            <option value="3" ${question.correct_answer === 3 ? 'selected' : ''}>選択肢4</option>
        </select>
        
        <label>表示順</label>
        <input type="number" id="testOrder" value="${question.order_num}" min="1">
        
        <div class="btn-group">
            <button class="btn-secondary" onclick="closeEditModal()">キャンセル</button>
            <button class="btn-primary" onclick="updateTestQuestion('${question.id}')">更新</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function updateTestQuestion(questionId) {
    const question = document.getElementById('testQuestion').value.trim();
    const option1 = document.getElementById('testOption1').value.trim();
    const option2 = document.getElementById('testOption2').value.trim();
    const option3 = document.getElementById('testOption3').value.trim();
    const option4 = document.getElementById('testOption4').value.trim();
    const correct = parseInt(document.getElementById('testCorrectAnswer').value);
    const order = parseInt(document.getElementById('testOrder').value);
    
    if (!question || !option1 || !option2 || !option3 || !option4) {
        alert('すべての項目を入力してください');
        return;
    }
    
    const options = [option1, option2, option3, option4];
    
    try {
        await fetch(`tables/test_questions/${questionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: question,
                options: JSON.stringify(options),
                correct_answer: correct,
                order_num: order
            })
        });
        
        alert('テスト問題を更新しました！');
        closeEditModal();
        loadTestQuestionManagement();
        initTest(); // メイン画面も更新
    } catch (error) {
        console.error('テスト問題更新エラー:', error);
        alert('テスト問題の更新に失敗しました');
    }
}

async function deleteTestQuestion(questionId) {
    if (!confirm('このテスト問題を削除してもよろしいですか？')) {
        return;
    }
    
    try {
        await fetch(`tables/test_questions/${questionId}`, {
            method: 'DELETE'
        });
        
        alert('テスト問題を削除しました');
        loadTestQuestionManagement();
        initTest(); // メイン画面も更新
    } catch (error) {
        console.error('テスト問題削除エラー:', error);
        alert('テスト問題の削除に失敗しました');
    }
}

// ========================================
// モーダル制御
// ========================================
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

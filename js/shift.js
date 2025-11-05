// ========================================
// シフト機能
// ========================================

// シフトタブの初期化
async function loadShiftTab() {
    await loadVacancies();
    await loadPdfLinks();
}

// ========================================
// 欠員シフト表示（スタッフ向け）
// ========================================
async function loadVacancies() {
    try {
        console.log('欠員シフトを読み込み中...');
        const response = await fetch('tables/shift_vacancies?limit=100&sort=shift_date');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('取得した欠員シフトデータ:', data);
        
        displayVacancies(data.data);
    } catch (error) {
        console.error('欠員シフト読み込みエラー:', error);
        const container = document.getElementById('shiftVacanciesList');
        if (container) {
            container.innerHTML = '<p style="text-align:center; color:red; padding:40px;">シフトの読み込みに失敗しました。</p>';
        }
    }
}

async function displayVacancies(vacancies) {
    const container = document.getElementById('shiftVacanciesList');
    
    if (vacancies.length === 0) {
        container.innerHTML = '<div class="no-shifts">現在、欠員シフトはありません</div>';
        return;
    }

    // 各シフトのエントリー状況を取得
    const vacanciesWithEntries = await Promise.all(vacancies.map(async (vacancy) => {
        const entriesRes = await fetch(`tables/shift_entries?limit=100`);
        const entriesData = await entriesRes.json();
        const entries = entriesData.data.filter(e => e.vacancy_id === vacancy.id);
        return { ...vacancy, entries };
    }));

    container.innerHTML = vacanciesWithEntries.map(vacancy => {
        const date = new Date(vacancy.shift_date).toLocaleDateString('ja-JP', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });
        
        const hasEntry = vacancy.entries.some(e => e.user_name === currentUser);
        const isFilled = vacancy.is_filled;
        
        return `
            <div class="vacancy-card ${isFilled ? 'filled' : ''}">
                <div class="vacancy-header">
                    <div class="vacancy-date">${date}</div>
                    <div class="vacancy-wage">¥${vacancy.hourly_wage.toLocaleString()}/時</div>
                </div>
                <div class="vacancy-time">⏰ ${vacancy.time_slot}</div>
                <div class="vacancy-job">📋 ${vacancy.job_description}</div>
                ${vacancy.notes ? `<div class="vacancy-notes">💬 ${vacancy.notes}</div>` : ''}
                
                ${hasEntry 
                    ? '<div class="vacancy-entry-info">✓ エントリー済み</div>'
                    : isFilled
                    ? '<button class="vacancy-entry-btn" disabled>募集終了</button>'
                    : `<button class="vacancy-entry-btn" onclick="entryShift('${vacancy.id}')">
                        <i class="fas fa-hand-paper"></i> エントリーする
                       </button>`
                }
            </div>
        `;
    }).join('');
}

async function entryShift(vacancyId) {
    if (!confirm('このシフトにエントリーしますか？')) {
        return;
    }
    
    try {
        await fetch('tables/shift_entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vacancy_id: vacancyId,
                user_name: currentUser,
                entry_time: new Date().toISOString()
            })
        });
        
        alert('エントリーしました！管理者が確認します。');
        loadVacancies(); // 再読み込み
    } catch (error) {
        console.error('エントリーエラー:', error);
        alert('エントリーに失敗しました');
    }
}

// ========================================
// PDFシフト表表示
// ========================================
async function loadPdfLinks() {
    try {
        console.log('PDFリンクを読み込み中...');
        const response = await fetch('tables/shift_pdf_links?limit=100&sort=display_order');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('取得したPDFリンクデータ:', data);
        
        displayPdfLinks(data.data);
    } catch (error) {
        console.error('PDFリンク読み込みエラー:', error);
        const container = document.getElementById('shiftPdfLinks');
        if (container) {
            container.innerHTML = '<div class="no-shifts">PDFリンクの読み込みに失敗しました</div>';
        }
    }
}

function displayPdfLinks(links) {
    const container = document.getElementById('shiftPdfLinks');
    
    if (links.length === 0) {
        container.innerHTML = '<div class="no-shifts">シフト表が登録されていません</div>';
        return;
    }
    
    container.innerHTML = links.map(link => `
        <div class="pdf-link-card">
            <div class="pdf-link-title">
                <i class="fas fa-file-pdf"></i> ${link.title}
            </div>
            <a href="${link.pdf_url}" target="_blank" class="pdf-link-btn">
                <i class="fas fa-external-link-alt"></i> 開く
            </a>
        </div>
    `).join('');
}

// ========================================
// 管理者：欠員シフト管理
// ========================================
async function loadVacancyManagement() {
    try {
        const vacanciesRes = await fetch('tables/shift_vacancies?limit=1000&sort=-created_at');
        const vacanciesData = await vacanciesRes.json();
        
        const entriesRes = await fetch('tables/shift_entries?limit=1000');
        const entriesData = await entriesRes.json();
        
        const container = document.getElementById('vacancyManagementList');
        
        if (vacanciesData.data.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999;">欠員シフトがありません</p>';
            return;
        }

        container.innerHTML = vacanciesData.data.map(vacancy => {
            const entries = entriesData.data.filter(e => e.vacancy_id === vacancy.id);
            const entryNames = entries.map(e => e.user_name).join(', ');
            
            return `
                <div class="management-item">
                    <div class="management-item-content">
                        <h4>${vacancy.shift_date} ${vacancy.time_slot}</h4>
                        <p>${vacancy.job_description}</p>
                        <p style="font-size: 14px; color: #666;">
                            時給: ¥${vacancy.hourly_wage.toLocaleString()} | 
                            ${vacancy.is_filled ? '募集終了' : '募集中'}
                        </p>
                        ${entries.length > 0 
                            ? `<p style="font-size: 14px; color: var(--color-success); font-weight: 600;">
                                エントリー: ${entryNames} (${entries.length}名)
                               </p>`
                            : '<p style="font-size: 14px; color: #999;">エントリーなし</p>'
                        }
                    </div>
                    <div class="management-item-actions">
                        <button class="btn-edit" onclick='editVacancy(${JSON.stringify(vacancy)})'>
                            <i class="fas fa-edit"></i> 編集
                        </button>
                        <button class="btn-delete" onclick="deleteVacancy('${vacancy.id}')">
                            <i class="fas fa-trash"></i> 削除
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('欠員シフト管理データ読み込みエラー:', error);
    }
}

function showAddVacancyModal() {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');
    
    title.textContent = '新規欠員シフト追加';
    body.innerHTML = `
        <label>日付</label>
        <input type="date" id="vacancyDate">
        
        <label>時間帯</label>
        <input type="text" id="vacancyTime" placeholder="例: 9:00-17:00">
        
        <label>業務内容</label>
        <textarea id="vacancyJob" rows="3" placeholder="業務内容を入力"></textarea>
        
        <label>備考（任意）</label>
        <input type="text" id="vacancyNotes" placeholder="備考があれば入力">
        
        <label>時給（円）</label>
        <input type="number" id="vacancyWage" placeholder="1200" min="0">
        
        <div class="btn-group">
            <button class="btn-secondary" onclick="closeEditModal()">キャンセル</button>
            <button class="btn-primary" onclick="saveNewVacancy()">保存</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function saveNewVacancy() {
    const date = document.getElementById('vacancyDate').value;
    const time = document.getElementById('vacancyTime').value.trim();
    const job = document.getElementById('vacancyJob').value.trim();
    const notes = document.getElementById('vacancyNotes').value.trim();
    const wage = parseInt(document.getElementById('vacancyWage').value);
    
    if (!date || !time || !job || !wage) {
        alert('日付、時間帯、業務内容、時給を入力してください');
        return;
    }
    
    try {
        await fetch('tables/shift_vacancies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shift_date: date,
                time_slot: time,
                job_description: job,
                notes: notes,
                hourly_wage: wage,
                is_filled: false,
                created_at: new Date().toISOString()
            })
        });
        
        alert('欠員シフトを追加しました！');
        closeEditModal();
        loadVacancyManagement();
        loadVacancies(); // スタッフ画面も更新
    } catch (error) {
        console.error('欠員シフト追加エラー:', error);
        alert('欠員シフトの追加に失敗しました');
    }
}

function editVacancy(vacancy) {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');
    
    title.textContent = '欠員シフト編集';
    body.innerHTML = `
        <label>日付</label>
        <input type="date" id="vacancyDate" value="${vacancy.shift_date}">
        
        <label>時間帯</label>
        <input type="text" id="vacancyTime" value="${vacancy.time_slot}">
        
        <label>業務内容</label>
        <textarea id="vacancyJob" rows="3">${vacancy.job_description}</textarea>
        
        <label>備考（任意）</label>
        <input type="text" id="vacancyNotes" value="${vacancy.notes || ''}">
        
        <label>時給（円）</label>
        <input type="number" id="vacancyWage" value="${vacancy.hourly_wage}" min="0">
        
        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" id="vacancyFilled" ${vacancy.is_filled ? 'checked' : ''} style="width: auto;">
            <span>募集終了にする</span>
        </label>
        
        <div class="btn-group">
            <button class="btn-secondary" onclick="closeEditModal()">キャンセル</button>
            <button class="btn-primary" onclick="updateVacancy('${vacancy.id}')">更新</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function updateVacancy(vacancyId) {
    const date = document.getElementById('vacancyDate').value;
    const time = document.getElementById('vacancyTime').value.trim();
    const job = document.getElementById('vacancyJob').value.trim();
    const notes = document.getElementById('vacancyNotes').value.trim();
    const wage = parseInt(document.getElementById('vacancyWage').value);
    const isFilled = document.getElementById('vacancyFilled').checked;
    
    if (!date || !time || !job || !wage) {
        alert('日付、時間帯、業務内容、時給を入力してください');
        return;
    }
    
    try {
        await fetch(`tables/shift_vacancies/${vacancyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                shift_date: date,
                time_slot: time,
                job_description: job,
                notes: notes,
                hourly_wage: wage,
                is_filled: isFilled,
                created_at: new Date().toISOString()
            })
        });
        
        alert('欠員シフトを更新しました！');
        closeEditModal();
        loadVacancyManagement();
        loadVacancies(); // スタッフ画面も更新
    } catch (error) {
        console.error('欠員シフト更新エラー:', error);
        alert('欠員シフトの更新に失敗しました');
    }
}

async function deleteVacancy(vacancyId) {
    if (!confirm('この欠員シフトを削除してもよろしいですか？\n関連するエントリーも削除されます。')) {
        return;
    }
    
    try {
        // 関連するエントリーも削除
        const entriesRes = await fetch('tables/shift_entries?limit=1000');
        const entriesData = await entriesRes.json();
        const relatedEntries = entriesData.data.filter(e => e.vacancy_id === vacancyId);
        
        for (const entry of relatedEntries) {
            await fetch(`tables/shift_entries/${entry.id}`, { method: 'DELETE' });
        }
        
        // シフトを削除
        await fetch(`tables/shift_vacancies/${vacancyId}`, { method: 'DELETE' });
        
        alert('欠員シフトを削除しました');
        loadVacancyManagement();
        loadVacancies(); // スタッフ画面も更新
    } catch (error) {
        console.error('欠員シフト削除エラー:', error);
        alert('欠員シフトの削除に失敗しました');
    }
}

// ========================================
// 管理者：PDFリンク管理
// ========================================
async function loadPdfLinkManagement() {
    try {
        const response = await fetch('tables/shift_pdf_links?limit=1000&sort=display_order');
        const data = await response.json();
        
        const container = document.getElementById('pdfLinkManagementList');
        
        if (data.data.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999;">PDFリンクがありません</p>';
            return;
        }

        container.innerHTML = data.data.map(link => `
            <div class="management-item">
                <div class="management-item-content">
                    <h4>${link.title}</h4>
                    <p style="font-size: 12px; color: #999; word-break: break-all;">${link.pdf_url}</p>
                    <p style="font-size: 14px; color: #666;">表示順: ${link.display_order}</p>
                </div>
                <div class="management-item-actions">
                    <button class="btn-edit" onclick='editPdfLink(${JSON.stringify(link)})'>
                        <i class="fas fa-edit"></i> 編集
                    </button>
                    <button class="btn-delete" onclick="deletePdfLink('${link.id}')">
                        <i class="fas fa-trash"></i> 削除
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('PDFリンク管理データ読み込みエラー:', error);
    }
}

function showAddPdfLinkModal() {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');
    
    title.textContent = '新規PDFリンク追加';
    body.innerHTML = `
        <label>タイトル</label>
        <input type="text" id="pdfTitle" placeholder="例: 2025年1月シフト表">
        
        <label>Googleドライブ共有リンク</label>
        <textarea id="pdfUrl" rows="3" placeholder="Googleドライブの共有リンクをペースト"></textarea>
        <p style="font-size: 12px; color: #666; margin-top: -10px;">
            ※ Googleドライブで「共有」→「リンクを知っている全員」で共有リンクを取得
        </p>
        
        <label>表示順</label>
        <input type="number" id="pdfOrder" value="1" min="1">
        
        <div class="btn-group">
            <button class="btn-secondary" onclick="closeEditModal()">キャンセル</button>
            <button class="btn-primary" onclick="saveNewPdfLink()">保存</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function saveNewPdfLink() {
    const title = document.getElementById('pdfTitle').value.trim();
    const url = document.getElementById('pdfUrl').value.trim();
    const order = parseInt(document.getElementById('pdfOrder').value);
    
    if (!title || !url) {
        alert('タイトルとURLを入力してください');
        return;
    }
    
    try {
        await fetch('tables/shift_pdf_links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                pdf_url: url,
                display_order: order,
                updated_at: new Date().toISOString()
            })
        });
        
        alert('PDFリンクを追加しました！');
        closeEditModal();
        loadPdfLinkManagement();
        loadPdfLinks(); // スタッフ画面も更新
    } catch (error) {
        console.error('PDFリンク追加エラー:', error);
        alert('PDFリンクの追加に失敗しました');
    }
}

function editPdfLink(link) {
    const modal = document.getElementById('editModal');
    const title = document.getElementById('editModalTitle');
    const body = document.getElementById('editModalBody');
    
    title.textContent = 'PDFリンク編集';
    body.innerHTML = `
        <label>タイトル</label>
        <input type="text" id="pdfTitle" value="${link.title}">
        
        <label>Googleドライブ共有リンク</label>
        <textarea id="pdfUrl" rows="3">${link.pdf_url}</textarea>
        
        <label>表示順</label>
        <input type="number" id="pdfOrder" value="${link.display_order}" min="1">
        
        <div class="btn-group">
            <button class="btn-secondary" onclick="closeEditModal()">キャンセル</button>
            <button class="btn-primary" onclick="updatePdfLink('${link.id}')">更新</button>
        </div>
    `;
    
    modal.style.display = 'flex';
}

async function updatePdfLink(linkId) {
    const title = document.getElementById('pdfTitle').value.trim();
    const url = document.getElementById('pdfUrl').value.trim();
    const order = parseInt(document.getElementById('pdfOrder').value);
    
    if (!title || !url) {
        alert('タイトルとURLを入力してください');
        return;
    }
    
    try {
        await fetch(`tables/shift_pdf_links/${linkId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                pdf_url: url,
                display_order: order,
                updated_at: new Date().toISOString()
            })
        });
        
        alert('PDFリンクを更新しました！');
        closeEditModal();
        loadPdfLinkManagement();
        loadPdfLinks(); // スタッフ画面も更新
    } catch (error) {
        console.error('PDFリンク更新エラー:', error);
        alert('PDFリンクの更新に失敗しました');
    }
}

async function deletePdfLink(linkId) {
    if (!confirm('このPDFリンクを削除してもよろしいですか？')) {
        return;
    }
    
    try {
        await fetch(`tables/shift_pdf_links/${linkId}`, { method: 'DELETE' });
        
        alert('PDFリンクを削除しました');
        loadPdfLinkManagement();
        loadPdfLinks(); // スタッフ画面も更新
    } catch (error) {
        console.error('PDFリンク削除エラー:', error);
        alert('PDFリンクの削除に失敗しました');
    }
}

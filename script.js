const defaultPrizes = [
    { id: 'slogan', name: '슬로건', day1: 5, day2: 2, day3: 3, img: 'img/slogan.png' },
    { id: 'uchiwa', name: '하트 우치와', day1: 5, day2: 2, day3: 3, img: 'img/uchiwa.png' },
    { id: 'panel', name: '액자', day1: 3, day2: 2, day3: 2, img: 'img/panel.png' },
    { id: 'keyring1', name: '말랑 키링 1️⃣ ver', day1: 10, day2: 2, day3: 4, img: 'img/keyring1.png' },
    { id: 'keyring2', name: '말랑 키링 2️⃣ ver', day1: 10, day2: 3, day3: 3, img: 'img/keyring2.png' },
    { id: 'acrylic_cat', name: '아크릴 키링 🐱 ver', day1: 15, day2: 2, day3: 4, img: 'img/acrylic_cat.png' },
    { id: 'acrylic_rabbit', name: '아크릴 키링 🐰 ver', day1: 15, day2: 3, day3: 4, img: 'img/acrylic_rabbit.png' },
    { id: 'tok_cat', name: '스마트톡 🐱 ver', day1: 15, day2: 2, day3: 4, img: 'img/tok_cat.png' },
    { id: 'tok_rabbit', name: '스마트톡 🐰 ver', day1: 15, day2: 3, day3: 4, img: 'img/tok_rabbit.png' },
    { id: 'strap', name: '비즈 스트랩', day1: 20, day2: 5, day3: 7, img: 'img/strap.png' }, /* 数量は適宜調整 */
    { id: 'pouch_cat', name: '미니파우치 🐱 ver', day1: 22, day2: 5, day3: 8, img: 'img/pouch_cat.png' },
    { id: 'pouch_rabbit', name: '미니파우치 🐰 ver', day1: 23, day2: 5, day3: 9, img: 'img/pouch_rabbit.png' },
    { id: 'chouchou', name: '슈슈', day1: 40, day2: 12, day3: 13, img: 'img/chouchou.png' },
    { id: 'sticker', name: '메시지 카드 스티커', day1: 40, day2: 13, day3: 12, img: 'img/sticker.png' }
];

const app = {
    data: [],
    currentDay: 'day1',
    drawCount: 1,
    currentResults: [],
    drawQueue: [],
    
    init() {
        // localStorageからデータを読み込むか、初期データをセット
        const savedData = localStorage.getItem('taerae_inventory');
        const savedDay = localStorage.getItem('taerae_day');
        
        this.data = savedData ? JSON.parse(savedData) : JSON.parse(JSON.stringify(defaultPrizes));
        this.currentDay = savedDay ? savedDay : 'day1';
        
        this.updateMainUI();
    },

    saveData() {
        localStorage.setItem('taerae_inventory', JSON.stringify(this.data));
        localStorage.setItem('taerae_day', this.currentDay);
    },

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    },

    updateMainUI() {
        const dayLabels = { day1: 'DAY 1 (일)', day2: 'DAY 2 (월)', day3: 'DAY 3 (화)' };
        document.getElementById('current-day-label').innerText = dayLabels[this.currentDay];
        document.getElementById('draw-count').innerText = this.drawCount;
    },

    changeCount(delta) {
        this.drawCount += delta;
        if (this.drawCount < 1) this.drawCount = 1;
        if (this.drawCount > 10) this.drawCount = 10; // 最大10回に制限（変更可）
        this.updateMainUI();
    },

    startDraw() {
        // 現在の日の在庫プールを作成
        let pool = [];
        this.data.forEach(prize => {
            const stock = prize[this.currentDay];
            for (let i = 0; i < stock; i++) {
                pool.push(prize);
            }
        });

        if (pool.length < this.drawCount) {
            alert(`재고가 부족합니다. (현재 남은 수량: ${pool.length}개)`);
            return;
        }

        // 抽選処理 (Fisher-Yates Shuffleで完全ランダム)
        this.drawQueue = [];
        for (let i = 0; i < this.drawCount; i++) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            const drawnItem = pool.splice(randomIndex, 1)[0];
            this.drawQueue.push(drawnItem);
            
            // 在庫を減らす
            const prizeIndex = this.data.findIndex(p => p.id === drawnItem.id);
            this.data[prizeIndex][this.currentDay]--;
        }

        this.saveData();
        this.currentResults = [...this.drawQueue];
        
        this.showScreen('screen-drawing');
        this.nextDrawStep();
    },

    nextDrawStep() {
        const display = document.getElementById('draw-item-display');
        const status = document.getElementById('draw-status-text');
        const hint = document.getElementById('draw-hint');

        if (this.drawQueue.length > 0) {
            const item = this.drawQueue.shift();
            status.innerText = '🎉 축하합니다! 🎉';
            // 画像がない場合はテキストのみ、ある場合は画像も表示
            display.innerHTML = `
                <img src="${item.img}" alt="prize" onerror="this.style.display='none'">
                <div class="prize-name">${item.name}</div>
            `;
            
            // アニメーションを再トリガーするための工夫
            display.style.animation = 'none';
            display.offsetHeight; /* trigger reflow */
            display.style.animation = 'popIn 0.5s ease-out';
            
            if (this.drawQueue.length === 0) {
                hint.innerText = '결과 확인하기';
            } else {
                hint.innerText = '다음 추첨 (화면 터치)';
            }
        } else {
            this.showResults();
        }
    },

    showResults() {
        const list = document.getElementById('result-list');
        list.innerHTML = '';
        
        // 結果を集計
        const counts = {};
        this.currentResults.forEach(item => {
            counts[item.name] = (counts[item.name] || 0) + 1;
        });

        for (const [name, count] of Object.entries(counts)) {
            const li = document.createElement('li');
            li.innerHTML = `<span>${name}</span> <span>×${count}</span>`;
            list.appendChild(li);
        }

        this.showScreen('screen-result');
    },

    resetToMain() {
        this.drawCount = 1;
        this.updateMainUI();
        this.showScreen('screen-main');
    },

    // --- 管理画面ロジック ---
    checkAdmin() {
        const pass = prompt('관리자 비밀번호를 입력하세요:');
        if (pass === '0714') { // パスワードはテレの誕生日！
            this.renderAdmin();
            this.showScreen('screen-admin');
        } else if (pass !== null) {
            alert('비밀번호가 틀렸습니다.');
        }
    },

    renderAdmin() {
        document.getElementById('admin-day-select').value = this.currentDay;
        const invContainer = document.getElementById('admin-inventory');
        invContainer.innerHTML = '';

        this.data.forEach((prize, index) => {
            const div = document.createElement('div');
            div.className = 'inv-item';
            div.innerHTML = `
                <span>${prize.name}</span>
                <input type="number" value="${prize[this.currentDay]}" 
                       onchange="app.updateStock(${index}, this.value)" 
                       style="width:60px; text-align:center;">
            `;
            invContainer.appendChild(div);
        });
    },

    changeDay() {
        this.currentDay = document.getElementById('admin-day-select').value;
        this.saveData();
        this.updateMainUI();
        this.renderAdmin(); // 管理画面の数値を更新
    },

    updateStock(index, newStock) {
        this.data[index][this.currentDay] = parseInt(newStock, 10);
        this.saveData();
    },

    resetInventory() {
        if (confirm('정말로 재고를 초기 상태로 되돌리겠습니까? 모든 데이터가 지워집니다.')) {
            this.data = JSON.parse(JSON.stringify(defaultPrizes));
            this.saveData();
            this.renderAdmin();
            alert('초기화 되었습니다.');
        }
    },

    exitAdmin() {
        this.showScreen('screen-main');
    }
};

window.onload = () => {
    app.init();
};

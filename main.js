/* ============================================
   岑心诚意 - 神经外科主任个人网站
   JavaScript 交互逻辑
   ============================================ */

// ============ 初始示例视频数据 ============
const defaultVideos = [
    {
        id: 'demo-1',
        title: '经鼻蝶垂体瘤内镜微创切除术',
        category: 'endoscope',
        desc: '神经内镜下经鼻腔蝶窦入路切除垂体瘤，微创手术，术后恢复快。',
        url: '',
        thumb: '',
        date: '2026-07-28',
        duration: '15:32',
        isDefault: true
    },
    {
        id: 'demo-2',
        title: '额叶脑膜瘤显微手术全切',
        category: 'brain',
        desc: '显微镜下精准切除额叶凸面脑膜瘤，完整保留周围脑组织及功能。',
        url: '',
        thumb: '',
        date: '2026-07-15',
        duration: '22:18',
        isDefault: true
    },
    {
        id: 'demo-3',
        title: '椎管内神经鞘瘤显微切除',
        category: 'spine',
        desc: '后正中入路显微镜下切除椎管内髓外硬膜下神经鞘瘤，脊髓功能完整保留。',
        url: '',
        thumb: '',
        date: '2026-07-02',
        duration: '18:45',
        isDefault: true
    },
    {
        id: 'demo-4',
        title: '听神经瘤面神经保留显微手术',
        category: 'brain',
        desc: '乙状窦后入路显微镜下切除听神经瘤，解剖保留面神经功能。',
        url: '',
        thumb: '',
        date: '2026-06-20',
        duration: '28:10',
        isDefault: true
    },
    {
        id: 'demo-5',
        title: '脑室镜下三脑室底造瘘术',
        category: 'endoscope',
        desc: '神经内镜下行第三脑室底造瘘术治疗梗阻性脑积水，避免分流管植入。',
        url: '',
        thumb: '',
        date: '2026-06-08',
        duration: '12:55',
        isDefault: true
    },
    {
        id: 'demo-6',
        title: '颈段髓内肿瘤显微切除',
        category: 'spine',
        desc: '高颈段脊髓内室管膜瘤显微外科切除，术中电生理监测保护脊髓功能。',
        url: '',
        thumb: '',
        date: '2026-05-22',
        duration: '25:30',
        isDefault: true
    }
];

const categoryMap = {
    brain: '颅内肿瘤',
    spine: '椎管肿瘤',
    endoscope: '内镜微创'
};

// ============ 视频数据管理 ============
function getVideos() {
    const stored = localStorage.getItem('cxsy_videos');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch(e) {
            return [...defaultVideos];
        }
    }
    return [...defaultVideos];
}

function saveVideos(videos) {
    localStorage.setItem('cxsy_videos', JSON.stringify(videos));
}

// ============ 渲染视频卡片 ============
function renderVideos(filter = 'all') {
    const grid = document.getElementById('videoGrid');
    const videos = getVideos();
    const filtered = filter === 'all' ? videos : videos.filter(v => v.category === filter);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: #a0aec0;">
                <div style="font-size: 3rem; margin-bottom: 16px;">🎬</div>
                <p>暂无${filter !== 'all' ? categoryMap[filter] : ''}视频</p>
                <p style="font-size: 0.85rem; margin-top: 8px;">点击右下角管理按钮上传新视频</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(video => `
        <div class="video-card" data-video-id="${video.id}">
            <div class="video-thumbnail">
                ${video.thumb
                    ? `<img src="${video.thumb}" alt="${video.title}">`
                    : `<div class="video-thumbnail-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M23 7l-7 5 7 5V7z"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                        <span>${video.duration || '手术视频'}</span>
                       </div>`
                }
                <span class="video-category-badge">${categoryMap[video.category] || video.category}</span>
                <div class="play-btn">
                    <svg viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </div>
            </div>
            <div class="video-info">
                <h4>${video.title}</h4>
                <p>${video.desc || '暂无描述'}</p>
                <div class="video-meta">
                    <span>📅 ${video.date || ''}</span>
                    <span>⏱ ${video.duration || ''}</span>
                </div>
            </div>
        </div>
    `).join('');

    // 绑定点击事件
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.videoId;
            openVideoModal(id);
        });
    });
}

// ============ 视频弹窗 ============
function openVideoModal(id) {
    const videos = getVideos();
    const video = videos.find(v => v.id === id);
    if (!video) return;

    const modal = document.getElementById('videoModal');
    const wrap = document.getElementById('modalVideoWrap');
    const info = document.getElementById('modalInfo');

    if (video.url) {
        // 判断是文件URL还是嵌入代码
        if (video.url.startsWith('http') || video.url.startsWith('blob:')) {
            wrap.innerHTML = `<video src="${video.url}" controls autoplay style="width:100%;height:100%;object-fit:contain;"></video>`;
        } else {
            wrap.innerHTML = video.url;
        }
    } else {
        wrap.innerHTML = `
            <div class="no-video">
                <div style="font-size: 3rem;">🎬</div>
                <p>该视频暂未上传源文件</p>
                <p style="font-size: 0.85rem;">请关注公众号「岑心诚意」获取完整视频内容</p>
            </div>
        `;
    }

    info.innerHTML = `
        <h3>${video.title}</h3>
        <p>${video.desc || '暂无描述'}</p>
        <div class="video-meta" style="margin-top: 12px;">
            <span>📅 ${video.date || ''}</span>
            <span>⏱ ${video.duration || ''}</span>
            <span>🏷️ ${categoryMap[video.category] || video.category}</span>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const wrap = document.getElementById('modalVideoWrap');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // 清空视频以停止播放
    setTimeout(() => { wrap.innerHTML = ''; }, 300);
}

// ============ 视频筛选 ============
function setupVideoFilter() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderVideos(btn.dataset.filter);
        });
    });
}

// ============ 导航栏交互 ============
function setupNavbar() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // 滚动效果
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // 更新当前section高亮
        const sections = document.querySelectorAll('section[id]');
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 100;
            if (window.scrollY >= top) {
                current = section.id;
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // 移动端菜单
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // 点击链接关闭移动端菜单
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// ============ 数字动画 ============
function animateNumbers() {
    const nums = document.querySelectorAll('.stat-num');
    let triggered = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !triggered) {
                triggered = true;
                nums.forEach(num => {
                    const target = parseInt(num.dataset.target);
                    let current = 0;
                    const increment = target / 60;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            num.textContent = target;
                            clearInterval(timer);
                        } else {
                            num.textContent = Math.floor(current);
                        }
                    }, 25);
                });
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) observer.observe(heroStats);
}

// ============ 视频管理面板 ============
function setupAdminPanel() {
    const fab = document.getElementById('adminFab');
    const panel = document.getElementById('adminPanel');
    const closeBtn = document.getElementById('adminClose');
    const addBtn = document.getElementById('addVideoBtn');
    const fileArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('videoFile');

    fab.addEventListener('click', () => {
        panel.classList.add('active');
        renderAdminList();
    });

    closeBtn.addEventListener('click', () => {
        panel.classList.remove('active');
    });

    // 文件上传区域点击
    fileArea.addEventListener('click', () => {
        fileInput.click();
    });

    // 文件选择处理
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            document.getElementById('videoUrl').value = url;
            fileArea.querySelector('p').textContent = file.name;

            // 如果没有填写标题，自动用文件名
            const titleInput = document.getElementById('videoTitle');
            if (!titleInput.value) {
                titleInput.value = file.name.replace(/\.[^/.]+$/, '');
            }

            // 自动获取视频时长
            const tempVideo = document.createElement('video');
            tempVideo.preload = 'metadata';
            tempVideo.onloadedmetadata = () => {
                const duration = formatDuration(tempVideo.duration);
                const existingDuration = document.querySelector('.file-hint');
                if (existingDuration) {
                    existingDuration.textContent = `时长: ${duration}`;
                }
            };
            tempVideo.src = url;
        }
    });

    // 封面缩略图预览
    document.getElementById('videoThumb').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // 存到临时变量
            window._tempThumb = URL.createObjectURL(file);
        }
    });

    // 添加视频
    addBtn.addEventListener('click', () => {
        const title = document.getElementById('videoTitle').value.trim();
        const category = document.getElementById('videoCategory').value;
        const desc = document.getElementById('videoDesc').value.trim();
        const url = document.getElementById('videoUrl').value.trim();
        const thumb = window._tempThumb || '';
        const durationEl = document.querySelector('.file-hint');

        if (!title) {
            alert('请输入视频标题');
            return;
        }

        const video = {
            id: 'video-' + Date.now(),
            title,
            category,
            desc: desc || '暂无描述',
            url,
            thumb,
            date: new Date().toISOString().split('T')[0],
            duration: durationEl && durationEl.textContent.includes('时长')
                ? durationEl.textContent.replace('时长: ', '')
                : '',
            isDefault: false
        };

        const videos = getVideos();
        videos.unshift(video);
        saveVideos(videos);

        // 清空表单
        document.getElementById('videoTitle').value = '';
        document.getElementById('videoDesc').value = '';
        document.getElementById('videoUrl').value = '';
        document.getElementById('videoFile').value = '';
        document.getElementById('videoThumb').value = '';
        window._tempThumb = null;
        fileArea.querySelector('p').textContent = '点击选择视频文件';
        if (durationEl) {
            durationEl.textContent = '支持 MP4, WebM, MOV 格式';
        }

        renderAdminList();
        renderVideos(document.querySelector('.filter-btn.active').dataset.filter);

        // 提示
        showNotification('视频添加成功！');
    });

    // 点击面板外关闭（可选）
    // document.addEventListener('click', (e) => {
    //     if (panel.classList.contains('active') &&
    //         !panel.contains(e.target) &&
    //         !fab.contains(e.target)) {
    //         panel.classList.remove('active');
    //     }
    // });
}

// ============ 渲染管理列表 ============
function renderAdminList() {
    const list = document.getElementById('adminVideoList');
    const videos = getVideos();

    if (videos.length === 0) {
        list.innerHTML = '<div class="admin-empty">暂无视频，请添加</div>';
        return;
    }

    list.innerHTML = videos.map(video => `
        <div class="admin-video-item">
            <div class="item-info">
                <h5>${video.title}</h5>
                <span class="item-cat">${categoryMap[video.category] || video.category} · ${video.date || ''}</span>
            </div>
            <button class="delete-btn" data-id="${video.id}" title="删除">×</button>
        </div>
    `).join('');

    // 绑定删除事件
    list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const video = videos.find(v => v.id === id);
            if (video && video.isDefault) {
                alert('默认展示视频不可删除');
                return;
            }
            if (confirm('确认删除该视频？')) {
                const filtered = videos.filter(v => v.id !== id);
                saveVideos(filtered);
                renderAdminList();
                renderVideos(document.querySelector('.filter-btn.active').dataset.filter);
                showNotification('视频已删除');
            }
        });
    });
}

// ============ 格式化时长 ============
function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// ============ 通知提示 ============
function showNotification(msg) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 30px;
        background: #38a169;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        z-index: 3000;
        font-size: 0.9rem;
        animation: slideInRight 0.3s ease;
    `;
    notif.textContent = msg;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.3s';
        setTimeout(() => notif.remove(), 300);
    }, 2500);
}

// ============ 弹窗关闭事件 ============
function setupModalClose() {
    document.getElementById('modalClose').addEventListener('click', closeVideoModal);
    document.getElementById('modalOverlay').addEventListener('click', closeVideoModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeVideoModal();
    });
}

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', () => {
    setupNavbar();
    setupVideoFilter();
    setupAdminPanel();
    setupModalClose();
    renderVideos();
    animateNumbers();

    // 添加slideInRight动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});

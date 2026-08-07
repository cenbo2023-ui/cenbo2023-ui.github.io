/* ============================================
   岑心诚意 - 神经外科主任个人网站
   JavaScript 交互逻辑 v2.0
   支持多平台视频源 + GitHub API 全网发布
   ============================================ */

// ============ 配置 ============
const GITHUB_OWNER = 'cenbo2023-ui';
const GITHUB_REPO = 'cenbo2023-ui.github.io';
const VIDEOS_JSON_PATH = 'videos.json';

const categoryMap = {
    brain: '颅内肿瘤',
    spine: '椎管肿瘤',
    endoscope: '内镜微创'
};

const sourceMap = {
    bilibili: 'B站视频',
    youtube: 'YouTube',
    direct: '直链视频',
    local: '本地预览'
};

// ============ 全局状态 ============
let publishedVideos = [];   // 从 videos.json 加载的视频（全网可见）
let localVideos = [];       // 本地新增的视频（仅当前浏览器可见）

// ============ 解析视频 URL ============
function parseVideoUrl(url, source) {
    if (!url) return { embedUrl: '', rawUrl: '' };

    if (source === 'bilibili') {
        // B站: 支持 BV1xxx 或完整链接
        let bvid = '';
        const bvMatch = url.match(/BV\w+/i);
        if (bvMatch) {
            bvid = bvMatch[0];
        } else {
            // 尝试从 URL 参数提取
            const urlObj = new URL(url);
            bvid = urlObj.searchParams.get('bvid') || '';
        }
        if (bvid) {
            return {
                embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1&autoplay=1`,
                rawUrl: `https://www.bilibili.com/video/${bvid}`
            };
        }
    }

    if (source === 'youtube') {
        // YouTube: 支持 youtu.be/xxx 或 watch?v=xxx
        let videoId = '';
        const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
        const longMatch = url.match(/[?&]v=([\w-]+)/);
        const embedMatch = url.match(/embed\/([\w-]+)/);
        videoId = (shortMatch && shortMatch[1]) || (longMatch && longMatch[1]) || (embedMatch && embedMatch[1]) || '';
        if (videoId) {
            return {
                embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
                rawUrl: `https://www.youtube.com/watch?v=${videoId}`
            };
        }
    }

    // 直链视频或其他
    return { embedUrl: '', rawUrl: url };
}

// ============ 获取所有视频 ============
function getAllVideos() {
    return [...localVideos, ...publishedVideos];
}

// ============ 从 videos.json 加载视频 ============
async function loadPublishedVideos() {
    try {
        // 加随机参数避免缓存
        const resp = await fetch(`videos.json?t=${Date.now()}`);
        if (resp.ok) {
            publishedVideos = await resp.json();
        }
    } catch (e) {
        console.warn('无法加载 videos.json:', e);
        publishedVideos = [];
    }
    renderVideos();
    renderAdminList();
}

// ============ 渲染视频卡片 ============
function renderVideos(filter) {
    if (!filter) {
        const activeBtn = document.querySelector('.filter-btn.active');
        filter = activeBtn ? activeBtn.dataset.filter : 'all';
    }

    const grid = document.getElementById('videoGrid');
    const videos = getAllVideos();
    const filtered = filter === 'all' ? videos : videos.filter(v => v.category === filter);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--gray-500);">
                <div style="font-size: 3rem; margin-bottom: 16px;">🎬</div>
                <p>暂无${filter !== 'all' ? categoryMap[filter] : ''}视频</p>
                <p style="font-size: 0.85rem; margin-top: 8px;">点击右下角管理按钮添加视频</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(video => {
        const sourceBadge = video.source && video.source !== 'local'
            ? `<span class="video-source-badge">${sourceMap[video.source] || ''}</span>`
            : (video.source === 'local' ? '<span class="video-source-badge local-badge">本地预览</span>' : '');

        return `
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
                ${sourceBadge}
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
        `;
    }).join('');

    // 绑定点击事件
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => {
            openVideoModal(card.dataset.videoId);
        });
    });
}

// ============ 视频弹窗 ============
function openVideoModal(id) {
    const videos = getAllVideos();
    const video = videos.find(v => v.id === id);
    if (!video) return;

    const modal = document.getElementById('videoModal');
    const wrap = document.getElementById('modalVideoWrap');
    const info = document.getElementById('modalInfo');

    let videoHtml = '';

    if (video.source === 'bilibili' && video.url) {
        const parsed = parseVideoUrl(video.url, 'bilibili');
        videoHtml = `<iframe src="${parsed.embedUrl}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width:100%;height:100%;"></iframe>`;
    } else if (video.source === 'youtube' && video.url) {
        const parsed = parseVideoUrl(video.url, 'youtube');
        videoHtml = `<iframe src="${parsed.embedUrl}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;height:100%;"></iframe>`;
    } else if (video.url && (video.url.startsWith('http') || video.url.startsWith('blob:'))) {
        videoHtml = `<video src="${video.url}" controls autoplay style="width:100%;height:100%;object-fit:contain;"></video>`;
    } else {
        videoHtml = `
            <div class="no-video">
                <div style="font-size: 3rem;">🎬</div>
                <p>该视频暂未上传源文件</p>
                <p style="font-size: 0.85rem;">请关注公众号「岑心诚意」获取完整视频内容</p>
            </div>
        `;
    }

    wrap.innerHTML = videoHtml;

    const sourceLabel = sourceMap[video.source] || '';
    info.innerHTML = `
        <h3>${video.title}</h3>
        <p>${video.desc || '暂无描述'}</p>
        <div class="video-meta" style="margin-top: 12px;">
            <span>📅 ${video.date || ''}</span>
            <span>⏱ ${video.duration || ''}</span>
            <span>🏷️ ${categoryMap[video.category] || video.category}</span>
            ${sourceLabel ? `<span>📺 ${sourceLabel}</span>` : ''}
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

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

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

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

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
    const publishBtn = document.getElementById('publishBtn');
    const sourceSelect = document.getElementById('videoSource');
    const fileArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('videoFile');
    const urlGroup = document.getElementById('urlInputGroup');

    fab.addEventListener('click', () => {
        panel.classList.add('active');
        renderAdminList();
    });

    closeBtn.addEventListener('click', () => {
        panel.classList.remove('active');
    });

    // 视频来源切换
    sourceSelect.addEventListener('change', () => {
        const source = sourceSelect.value;
        if (source === 'local') {
            urlGroup.style.display = 'none';
            fileArea.style.display = 'block';
        } else {
            urlGroup.style.display = 'block';
            fileArea.style.display = 'none';
            // 更新占位符
            const urlInput = document.getElementById('videoUrl');
            const placeholders = {
                bilibili: 'https://www.bilibili.com/video/BV1xxxxxxxx',
                youtube: 'https://www.youtube.com/watch?v=xxxxxxxxxxx',
                direct: 'https://example.com/video.mp4'
            };
            urlInput.placeholder = placeholders[source] || '';
        }
    });

    // 文件上传
    fileArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            document.getElementById('videoUrl').value = url;
            fileArea.querySelector('p').textContent = file.name;

            const titleInput = document.getElementById('videoTitle');
            if (!titleInput.value) {
                titleInput.value = file.name.replace(/\.[^/.]+$/, '');
            }

            // 自动获取时长
            const tempVideo = document.createElement('video');
            tempVideo.preload = 'metadata';
            tempVideo.onloadedmetadata = () => {
                const duration = formatDuration(tempVideo.duration);
                const durationEl = document.querySelector('.file-hint');
                if (durationEl) {
                    durationEl.textContent = `时长: ${duration}`;
                }
            };
            tempVideo.src = url;
        }
    });

    // 封面缩略图
    document.getElementById('videoThumb').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                window._tempThumb = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 添加视频（到本地列表）
    addBtn.addEventListener('click', () => {
        const title = document.getElementById('videoTitle').value.trim();
        const category = document.getElementById('videoCategory').value;
        const desc = document.getElementById('videoDesc').value.trim();
        const source = sourceSelect.value;
        const url = document.getElementById('videoUrl').value.trim();
        const thumb = window._tempThumb || '';
        const durationEl = document.querySelector('.file-hint');

        if (!title) {
            alert('请输入视频标题');
            return;
        }

        if (source !== 'local' && !url) {
            alert('请输入视频链接');
            return;
        }

        const video = {
            id: 'local-' + Date.now(),
            title,
            category,
            desc: desc || '暂无描述',
            source,
            url,
            thumb,
            date: new Date().toISOString().split('T')[0],
            duration: durationEl && durationEl.textContent.includes('时长')
                ? durationEl.textContent.replace('时长: ', '')
                : ''
        };

        localVideos.unshift(video);

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
        renderVideos();

        // 提示
        if (source === 'local') {
            showNotification('视频已添加（仅本地预览），点击"发布到全网"让所有人可见', '#d69e2e');
        } else {
            showNotification('视频已添加！点击"发布到全网"让所有人可见', '#d69e2e');
        }
    });

    // 发布到全网
    publishBtn.addEventListener('click', async () => {
        await publishToGitHub();
    });
}

// ============ 发布到 GitHub ============
async function publishToGitHub() {
    const tokenInput = document.getElementById('githubToken');
    let token = tokenInput.value.trim();

    if (!token) {
        // 尝试从 localStorage 读取
        token = localStorage.getItem('cxsy_github_token') || '';
        if (token) {
            tokenInput.value = token;
        }
    }

    if (!token) {
        alert('请先输入 GitHub Token（在下方输入框中填写）\n\n获取方式：\ngithub.com/settings/tokens\n→ Generate new token (classic)\n→ 勾选 repo 权限');
        return;
    }

    // 合并视频列表（本地 + 已发布的，去重）
    const allVideos = [...localVideos, ...publishedVideos];

    // 移除 blob: URL（本地文件无法发布）
    const hasLocalOnly = allVideos.some(v => v.source === 'local' && v.url.startsWith('blob:'));
    if (hasLocalOnly) {
        if (!confirm('检测到有本地上传的视频文件（blob:链接），这些视频无法全网访问。\n\n建议将视频先上传到B站或YouTube，再使用链接发布。\n\n是否继续发布其他视频？')) {
            return;
        }
    }

    // 过滤掉 blob: URL 的视频
    const publishableVideos = allVideos.map(v => {
        const clean = { ...v };
        if (clean.url && clean.url.startsWith('blob:')) {
            clean.url = '';
            clean.source = 'bilibili';
        }
        return clean;
    });

    const publishBtn = document.getElementById('publishBtn');
    const originalText = publishBtn.textContent;
    publishBtn.textContent = '发布中...';
    publishBtn.disabled = true;

    try {
        // 1. 获取当前 videos.json 的 SHA
        const resp = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${VIDEOS_JSON_PATH}`, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        let sha = '';
        if (resp.ok) {
            const data = await resp.json();
            sha = data.sha;
        }

        // 2. 更新 videos.json
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(publishableVideos, null, 4))));

        const updateResp = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${VIDEOS_JSON_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Update videos.json - ${new Date().toLocaleString('zh-CN')}`,
                content: content,
                sha: sha || undefined
            })
        });

        if (updateResp.ok) {
            // 保存 token 供下次使用
            localStorage.setItem('cxsy_github_token', token);

            // 更新本地状态
            publishedVideos = publishableVideos;
            localVideos = [];

            showNotification('✅ 发布成功！全网用户刷新后即可看到最新视频', '#38a169');
            renderAdminList();
            renderVideos();

            // 5秒后自动刷新数据
            setTimeout(() => {
                loadPublishedVideos();
            }, 5000);
        } else {
            const errData = await updateResp.json();
            throw new Error(errData.message || '发布失败');
        }
    } catch (err) {
        alert('发布失败：' + err.message + '\n\n请检查：\n1. Token 是否正确\n2. Token 是否有 repo 权限\n3. 网络是否正常');
    } finally {
        publishBtn.textContent = originalText;
        publishBtn.disabled = false;
    }
}

// ============ 渲染管理列表 ============
function renderAdminList() {
    const list = document.getElementById('adminVideoList');
    const videos = getAllVideos();

    if (videos.length === 0) {
        list.innerHTML = '<div class="admin-empty">暂无视频，请添加</div>';
        return;
    }

    list.innerHTML = videos.map(video => {
        const isLocal = video.id.startsWith('local-');
        const badge = isLocal
            ? '<span class="item-badge local">未发布</span>'
            : '<span class="item-badge published">已发布</span>';
        const sourceLabel = sourceMap[video.source] || '';
        return `
        <div class="admin-video-item">
            <div class="item-info">
                <h5>${video.title}</h5>
                <span class="item-cat">${categoryMap[video.category] || video.category} · ${video.date || ''} · ${sourceLabel}</span>
            </div>
            ${badge}
            <button class="delete-btn" data-id="${video.id}" title="删除">×</button>
        </div>
        `;
    }).join('');

    // 绑定删除事件
    list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (confirm('确认删除该视频？')) {
                // 从本地列表删除
                localVideos = localVideos.filter(v => v.id !== id);
                // 从已发布列表删除
                publishedVideos = publishedVideos.filter(v => v.id !== id);
                renderAdminList();
                renderVideos();
                showNotification('视频已删除（需点击"发布到全网"同步到网站）', '#d69e2e');
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
function showNotification(msg, color) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 30px;
        background: ${color || '#38a169'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        z-index: 3000;
        font-size: 0.9rem;
        max-width: 380px;
        animation: slideInRight 0.3s ease;
    `;
    notif.textContent = msg;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.3s';
        setTimeout(() => notif.remove(), 300);
    }, 4000);
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
    animateNumbers();

    // 加载已发布的视频
    loadPublishedVideos();

    // 添加slideInRight动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // 访问统计
    initVisitorCounter();
});

// ============ 访问统计 ============
function initVisitorCounter() {
    const today = new Date().toISOString().split('T')[0];
    const lastVisit = localStorage.getItem('nb_visit_date');

    // 尝试多个计数服务，提高可靠性
    const fetchCount = async (endpoint) => {
        try {
            const resp = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
            if (!resp.ok) throw new Error('Failed');
            const data = await resp.json();
            return data.value || data.count || null;
        } catch {
            return null;
        }
    };

    // 总访问量
    (async () => {
        const namespace = 'cenbo2023-neurosurgery';
        let count = null;

        // 尝试 counterapi.dev
        if (lastVisit !== today) {
            count = await fetchCount(`https://api.counterapi.dev/v1/${namespace}/total/up`);
        } else {
            count = await fetchCount(`https://api.counterapi.dev/v1/${namespace}/total`);
        }

        // 备用: countapi.xyz
        if (count === null && lastVisit !== today) {
            count = await fetchCount(`https://api.countapi.xyz/hit/${namespace}/total`);
        }

        if (count !== null) {
            document.getElementById('totalVisits').textContent = count.toLocaleString();
            localStorage.setItem('nb_visit_date', today);
            localStorage.setItem('nb_total_visits', count);
        } else {
            // 最终降级: 显示本地缓存或默认值
            const cached = localStorage.getItem('nb_total_visits');
            document.getElementById('totalVisits').textContent = cached || '—';
        }
    })();

    // 今日访问量
    (async () => {
        const namespace = 'cenbo2023-neurosurgery';
        let count = await fetchCount(`https://api.counterapi.dev/v1/${namespace}/${today}/up`);
        if (count === null) {
            count = await fetchCount(`https://api.countapi.xyz/hit/${namespace}/${today}`);
        }
        if (count !== null) {
            document.getElementById('todayVisits').textContent = count.toLocaleString();
        } else {
            document.getElementById('todayVisits').textContent = '—';
        }
    })();
}

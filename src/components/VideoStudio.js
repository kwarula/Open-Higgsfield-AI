
import { gemini } from '../lib/gemini.js';
import { videoModels, getVideoResolutions } from '../lib/models.js';
import { AuthModal } from './AuthModal.js';

export function VideoStudio() {
    const container = document.createElement('div');
    container.className = 'w-full h-full flex flex-col items-center justify-center bg-app-bg relative p-4 md:p-6 overflow-y-auto custom-scrollbar overflow-x-hidden';

    // --- State ---
    const defaultModel = videoModels[0];
    let selectedModel = defaultModel.id;
    let selectedModelName = defaultModel.name;
    let selectedAr = '16:9';
    let dropdownOpen = null;
    let isGenerating = false;

    // ==========================================
    // 1. HERO SECTION
    // ==========================================
    const hero = document.createElement('div');
    hero.className = 'flex flex-col items-center mb-10 md:mb-20 animate-fade-in-up transition-all duration-700';
    hero.innerHTML = `
        <div class="mb-10 relative group">
             <div class="absolute inset-0 bg-secondary/20 blur-[100px] rounded-full opacity-40 group-hover:opacity-70 transition-opacity duration-1000"></div>
             <div class="relative w-24 h-24 md:w-32 md:h-32 bg-indigo-900/40 rounded-3xl flex items-center justify-center border border-white/5 overflow-hidden">
                <!-- Film Reel Icon -->
                <div class="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 shadow-glow relative z-10">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-indigo-400">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                        <line x1="7" y1="2" x2="7" y2="22"/>
                        <line x1="17" y1="2" x2="17" y2="22"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <line x1="2" y1="7" x2="7" y2="7"/>
                        <line x1="2" y1="17" x2="7" y2="17"/>
                        <line x1="17" y1="17" x2="22" y2="17"/>
                        <line x1="17" y1="7" x2="22" y2="7"/>
                    </svg>
                </div>
                 <div class="absolute top-4 right-4 text-indigo-400 animate-pulse">🎥</div>
             </div>
        </div>
        <h1 class="text-2xl sm:text-4xl md:text-7xl font-black text-white tracking-widest uppercase mb-4 selection:bg-indigo-500 selection:text-white text-center px-4">Veo Studio</h1>
        <p class="text-secondary text-sm font-medium tracking-wide opacity-60">Generate high-fidelity videos with Veo 3.1</p>
    `;
    container.appendChild(hero);

    // ==========================================
    // 2. PROMPT BAR
    // ==========================================
    const promptWrapper = document.createElement('div');
    promptWrapper.className = 'w-full max-w-4xl relative z-40 animate-fade-in-up';
    promptWrapper.style.animationDelay = '0.2s';

    const bar = document.createElement('div');
    bar.className = 'w-full bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-5 flex flex-col gap-3 md:gap-5 shadow-3xl';

    const topRow = document.createElement('div');
    topRow.className = 'flex items-start gap-5 px-2';

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Describe a video scene (e.g., "A cinematic drone shot of a futuristic city descending into clouds")...';
    textarea.className = 'flex-1 bg-transparent border-none text-white text-base md:text-xl placeholder:text-muted focus:outline-none resize-none pt-2.5 leading-relaxed min-h-[40px] max-h-[150px] overflow-y-auto custom-scrollbar';
    textarea.rows = 1;
    textarea.oninput = () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    };
    topRow.appendChild(textarea);
    bar.appendChild(topRow);

    const bottomRow = document.createElement('div');
    bottomRow.className = 'flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 px-2 pt-4 border-t border-white/5';

    const controlsLeft = document.createElement('div');
    controlsLeft.className = 'flex items-center gap-1.5 md:gap-2.5 relative overflow-x-auto no-scrollbar pb-1 md:pb-0';

    const createControlBtn = (icon, label, id) => {
        const btn = document.createElement('button');
        btn.id = id;
        btn.className = 'flex items-center gap-1.5 md:gap-2.5 px-3 md:px-4 py-2 md:py-2.5 bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl transition-all border border-white/5 group whitespace-nowrap';
        btn.innerHTML = `
            ${icon}
            <span id="${id}-label" class="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">${label}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" class="opacity-20 group-hover:opacity-100 transition-opacity"><path d="M6 9l6 6 6-6"/></svg>
        `;
        return btn;
    };

    const modelBtn = createControlBtn(`
        <div class="w-5 h-5 bg-indigo-500 rounded-md flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span class="text-[10px] font-black text-white">V</span>
        </div>
    `, selectedModelName, 'v-model-btn');

    const arBtn = createControlBtn(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"/></svg>
    `, selectedAr, 'v-ar-btn');

    const resBtn = createControlBtn(`
         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    `, '720p', 'v-res-btn');

    // Duration button (Veo specific)
    const durBtn = createControlBtn(`
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="opacity-60 text-secondary"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    `, '5s', 'v-dur-btn');

    controlsLeft.appendChild(modelBtn);
    controlsLeft.appendChild(arBtn);
    controlsLeft.appendChild(resBtn);
    controlsLeft.appendChild(durBtn);

    const generateBtn = document.createElement('button');
    generateBtn.className = 'bg-indigo-500 text-white px-6 md:px-8 py-3 md:py-3.5 rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-base hover:shadow-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 w-full sm:w-auto shadow-lg shadow-indigo-500/20';
    generateBtn.innerHTML = `Generate Video 🎬`;

    bottomRow.appendChild(controlsLeft);
    bottomRow.appendChild(generateBtn);
    bar.appendChild(bottomRow);
    promptWrapper.appendChild(bar);
    container.appendChild(promptWrapper);

    // ==========================================
    // 3. DROPDOWNS
    // ==========================================
    const dropdown = document.createElement('div');
    dropdown.className = 'absolute bottom-[105%] left-2 z-50 transition-all opacity-0 pointer-events-none scale-95 origin-bottom-left glass rounded-3xl p-3 translate-y-2 min-w-[200px] shadow-4xl border border-white/10 flex flex-col bg-[#1a1a1a]';

    const showDropdown = (type, anchorBtn) => {
        dropdown.innerHTML = '';
        dropdown.classList.remove('opacity-0', 'pointer-events-none');
        dropdown.classList.add('opacity-100', 'pointer-events-auto');

        const list = document.createElement('div');
        list.className = 'flex flex-col gap-1';

        if (type === 'model') {
            videoModels.forEach(m => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all';
                item.innerHTML = `<span class="text-xs font-bold text-white">${m.name}</span>`;
                item.onclick = (e) => {
                    e.stopPropagation();
                    selectedModel = m.id;
                    selectedModelName = m.name;
                    document.getElementById('v-model-btn-label').textContent = m.name;
                    closeDropdown();
                };
                list.appendChild(item);
            });
        } else if (type === 'ar') {
            ['16:9', '9:16', '1:1'].forEach(r => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all';
                item.innerHTML = `<span class="text-xs font-bold text-white">${r}</span>`;
                item.onclick = (e) => {
                    e.stopPropagation();
                    selectedAr = r;
                    document.getElementById('v-ar-btn-label').textContent = r;
                    closeDropdown();
                };
                list.appendChild(item);
            });
        } else if (type === 'res') {
            ['720p', '1080p'].forEach(r => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all';
                item.innerHTML = `<span class="text-xs font-bold text-white">${r}</span>`;
                item.onclick = (e) => {
                    e.stopPropagation();
                    document.getElementById('v-res-btn-label').textContent = r;
                    closeDropdown();
                };
                list.appendChild(item);
            });
        } else if (type === 'dur') {
            ['5s', '8s'].forEach(d => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-3.5 hover:bg-white/5 rounded-2xl cursor-pointer transition-all';
                item.innerHTML = `<span class="text-xs font-bold text-white">${d}</span>`;
                item.onclick = (e) => {
                    e.stopPropagation();
                    document.getElementById('v-dur-btn-label').textContent = d;
                    closeDropdown();
                };
                list.appendChild(item);
            });
        }
        dropdown.appendChild(list);

        // Position
        const btnRect = anchorBtn.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        dropdown.style.left = `${btnRect.left - containerRect.left}px`;
        dropdown.style.bottom = `${containerRect.bottom - btnRect.top + 8}px`;
    }

    const closeDropdown = () => {
        dropdown.classList.add('opacity-0', 'pointer-events-none');
        dropdown.classList.remove('opacity-100', 'pointer-events-auto');
        dropdownOpen = null;
    };

    [modelBtn, arBtn, resBtn, durBtn].forEach((btn, idx) => {
        const types = ['model', 'ar', 'res', 'dur'];
        btn.onclick = (e) => {
            e.stopPropagation();
            if (dropdownOpen === types[idx]) closeDropdown();
            else {
                dropdownOpen = types[idx];
                showDropdown(types[idx], btn);
            }
        }
    });

    window.onclick = () => closeDropdown();
    container.appendChild(dropdown);

    // ==========================================
    // 4. VIDEO RESULT AREA
    // ==========================================
    const resultArea = document.createElement('div');
    resultArea.className = 'absolute inset-0 flex flex-col items-center justify-center p-4 z-10 opacity-0 pointer-events-none transition-all duration-1000 scale-95';

    // Progress UI
    const progressContainer = document.createElement('div');
    progressContainer.className = 'hidden flex-col items-center gap-4 animate-fade-in';
    progressContainer.innerHTML = `
        <div class="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        <div class="text-center">
            <h3 class="text-xl font-bold text-white mb-1">Generating Video...</h3>
            <p class="text-sm text-secondary">This may take 1-6 minutes. Please wait.</p>
        </div>
    `;
    container.appendChild(progressContainer);

    // Video Player
    const videoContainer = document.createElement('div');
    videoContainer.className = 'relative max-w-4xl w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 hidden';

    const videoPlayer = document.createElement('video');
    videoPlayer.className = 'w-full h-full object-contain';
    videoPlayer.controls = true;
    videoPlayer.loop = true;

    videoContainer.appendChild(videoPlayer);
    resultArea.appendChild(videoContainer);

    // Back Button
    const backBtn = document.createElement('button');
    backBtn.className = 'mt-6 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-white font-bold transition-all';
    backBtn.textContent = '← Create Another';
    backBtn.onclick = () => {
        resultArea.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
        videoContainer.classList.add('hidden');
        hero.classList.remove('opacity-0', 'pointer-events-none');
        promptWrapper.classList.remove('opacity-0', 'pointer-events-none');
        textarea.value = '';
    };
    resultArea.appendChild(backBtn);

    container.appendChild(resultArea);

    // ==========================================
    // 5. GENERATION LOGIC
    // ==========================================
    generateBtn.onclick = async () => {
        const prompt = textarea.value.trim();
        if (!prompt) return;

        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            AuthModal(() => generateBtn.click());
            return;
        }

        // Switch to Loading State
        hero.classList.add('opacity-0', 'pointer-events-none');
        promptWrapper.classList.add('opacity-0', 'pointer-events-none');
        progressContainer.classList.remove('hidden');
        progressContainer.classList.add('flex');

        generateBtn.disabled = true;

        try {
            const res = await gemini.generateVideo({
                prompt,
                model: selectedModel,
                aspect_ratio: selectedAr,
                resolution: document.getElementById('v-res-btn-label').textContent, // 720p
                duration_seconds: document.getElementById('v-dur-btn-label').textContent.replace('s', ''), // 5
            });

            // Handle success
            progressContainer.classList.add('hidden');
            progressContainer.classList.remove('flex');

            resultArea.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
            resultArea.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');

            videoContainer.classList.remove('hidden');
            videoPlayer.src = res.url;
            videoPlayer.play();

        } catch (e) {
            console.error(e);
            progressContainer.classList.add('hidden');
            progressContainer.classList.remove('flex');
            hero.classList.remove('opacity-0', 'pointer-events-none');
            promptWrapper.classList.remove('opacity-0', 'pointer-events-none');
            alert(`Video Generation Failed: ${e.message}`);
        } finally {
            generateBtn.disabled = false;
        }
    };

    return container;
}

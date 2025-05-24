// 全局变量，供其他模块访问
window.processingData = null;

document.addEventListener('DOMContentLoaded', function() {
    // === 元素引用 ===
    const userQuestionInput = document.getElementById('userQuestion');
    const submitQuestionButton = document.getElementById('submitQuestion');
    const clearQuestionButton = document.getElementById('clearQuestion');
    const jsonOutputPre = document.getElementById('jsonOutput');
    const outputPathSpan = document.getElementById('outputPath');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const loadingText = document.getElementById('loadingText');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const errorMessageDiv = document.getElementById('errorMessage');

    // 新增的UI元素
    const copyJsonButton = document.getElementById('copyJson');
    const downloadJsonButton = document.getElementById('downloadJson');
    const formatJsonButton = document.getElementById('formatJson');
    const validateTemplateButton = document.getElementById('validateTemplate');
    const previewTemplateButton = document.getElementById('previewTemplate');

    // 原有元素
    const newTemplateFilenameInput = document.getElementById('newTemplateFilename');
    const newTemplateContentTextarea = document.getElementById('newTemplateContent');
    const uploadTemplateButton = document.getElementById('uploadTemplate');
    const uploadMessageDiv = document.getElementById('uploadMessage');
    const existingTemplatesSelect = document.getElementById('existingTemplates');
    const loadSelectedTemplateButton = document.getElementById('loadSelectedTemplate');
    const viewTemplateMessageDiv = document.getElementById('viewTemplateMessage');
    const shutdownAppButton = document.getElementById('shutdownApp');
    const shutdownMessageDiv = document.getElementById('shutdownMessage');

    // === 状态管理 ===
    let currentStep = 1;
    let processingData = null;
    let jsonEditor = null;
    let currentViewMode = 'tree';
    let searchResults = [];
    let currentSearchIndex = 0;

    // === 进度指示器管理 ===
    function updateProgressIndicator(step, status = 'active') {
        // 重置所有步骤
        document.querySelectorAll('.step').forEach(stepEl => {
            stepEl.classList.remove('active', 'completed', 'processing');
        });

        document.querySelectorAll('.step-line').forEach(line => {
            line.classList.remove('completed');
        });

        // 设置当前步骤及之前的步骤
        for (let i = 1; i <= 4; i++) {
            const stepEl = document.querySelector(`.step[data-step="${i}"]`);
            const lineEl = stepEl?.nextElementSibling;

            if (i < step) {
                stepEl?.classList.add('completed');
                lineEl?.classList.add('completed');
            } else if (i === step) {
                stepEl?.classList.add(status);
            }
        }

        currentStep = step;
        updateBreadcrumb(step);
    }

    function updateProgressBar(percentage, text = null) {
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        if (progressText) {
            progressText.textContent = text || `${percentage}%`;
        }
    }

    function updateLoadingText(text) {
        if (loadingText) {
            loadingText.textContent = text;
        }
    }

    // === 面包屑导航管理 ===
    function updateBreadcrumb(step) {
        document.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.classList.remove('active');
        });

        let breadcrumbStep = 'home';
        switch(step) {
            case 1:
                breadcrumbStep = 'home';
                break;
            case 2:
            case 3:
                breadcrumbStep = 'analysis';
                break;
            case 4:
                breadcrumbStep = 'results';
                break;
        }

        const activeItem = document.querySelector(`[data-step="${breadcrumbStep}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    // 面包屑点击事件
    document.querySelectorAll('.breadcrumb-item').forEach(item => {
        item.addEventListener('click', () => {
            const step = item.dataset.step;
            switch(step) {
                case 'home':
                    scrollToElement('.question-card');
                    break;
                case 'analysis':
                    scrollToElement('.results-card');
                    break;
                case 'results':
                    scrollToElement('.results-card');
                    break;
                case 'templates':
                    scrollToElement('.templates-card');
                    break;
            }
        });
    });

    function scrollToElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // === 标签页管理 ===
    function initializeTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                
                // 更新按钮状态
                btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // 更新内容显示
                const cardBody = btn.closest('.card').querySelector('.card-body');
                cardBody.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                const targetContent = cardBody.querySelector(`#${tabName}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }

                // 更新面包屑
                if (tabName === 'upload' || tabName === 'manage') {
                    updateBreadcrumb('templates');
                }
            });
        });
    }

    // === 消息显示函数 ===
    function displayMessage(element, message, isSuccess) {
        element.innerHTML = `<i class="fas fa-${isSuccess ? 'check-circle' : 'exclamation-triangle'}"></i> ${message}`;
        element.className = 'message ' + (isSuccess ? 'success' : 'error');
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    }

    function displayError(message) {
        const errorText = errorMessageDiv.querySelector('.error-text');
        if (errorText) {
            errorText.textContent = message;
        } else {
            errorMessageDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span class="error-text">${message}</span>`;
        }
        errorMessageDiv.style.display = 'block';
    }

    function hideError() {
        errorMessageDiv.style.display = 'none';
    }

    // === 问题处理相关 ===
    async function simulateProgress(duration) {
        const steps = [
            { percent: 20, text: '正在分析问题...' },
            { percent: 40, text: '识别主题和领域...' },
            { percent: 60, text: '选择合适模板...' },
            { percent: 80, text: '生成方面信息...' },
            { percent: 100, text: '完成处理' }
        ];

        for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, duration / steps.length));
            updateProgressBar(steps[i].percent);
            updateLoadingText(steps[i].text);
            
            if (i === 1) updateProgressIndicator(2, 'processing');
            if (i === 2) updateProgressIndicator(3, 'processing');
        }
    }

    // 清空问题按钮
    if (clearQuestionButton) {
        clearQuestionButton.addEventListener('click', () => {
            userQuestionInput.value = '';
            userQuestionInput.focus();
        });
    }

    // 支持回车键提交
    userQuestionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            submitQuestionButton.click();
        }
    });

    // 提交问题
    submitQuestionButton.addEventListener('click', async () => {
        const question = userQuestionInput.value.trim();
        if (!question) {
            displayError("请输入问题后再提交。");
            return;
        }

        hideError();
        updateProgressIndicator(2, 'processing');
        loadingIndicator.style.display = 'block';
        jsonOutputPre.textContent = '';
        outputPathSpan.textContent = 'N/A';
        updateProgressBar(0);

        // 禁用提交按钮
        submitQuestionButton.disabled = true;

        try {
            // 启动进度模拟
            const progressPromise = simulateProgress(3000);
            
            const response = await fetch('/process_question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: question }),
            });

            // 等待进度完成
            await progressPromise;
            
            loadingIndicator.style.display = 'none';
            const result = await response.json();

            if (result.success) {
                processingData = result.data;
                window.processingData = result.data; // 同时设置全局变量
                jsonOutputPre.textContent = JSON.stringify(result.data, null, 2);
                outputPathSpan.textContent = result.output_path || '保存失败';
                updateProgressIndicator(4, 'completed');
                
                // 渲染新的JSON视图
                renderJsonData(result.data);
                
                if(result.save_error){
                    displayMessage(uploadMessageDiv, `JSON已生成，但保存到文件失败: ${result.save_error}`, false);
                }
            } else {
                displayError(`处理失败: ${result.error}`);
                jsonOutputPre.textContent = '处理失败。';
                updateProgressIndicator(1);
            }
        } catch (error) {
            loadingIndicator.style.display = 'none';
            displayError(`请求错误: ${error.message}`);
            jsonOutputPre.textContent = '请求错误。';
            updateProgressIndicator(1);
        } finally {
            submitQuestionButton.disabled = false;
        }
    });

    // === JSON操作功能 ===
    if (copyJsonButton) {
        copyJsonButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(jsonOutputPre.textContent);
                copyJsonButton.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyJsonButton.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            } catch (err) {
                console.error('复制失败:', err);
            }
        });
    }

    if (downloadJsonButton) {
        downloadJsonButton.addEventListener('click', () => {
            if (!processingData) return;
            
            const dataStr = JSON.stringify(processingData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `question_analysis_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
            link.click();
        });
    }

    if (formatJsonButton) {
        formatJsonButton.addEventListener('click', () => {
            try {
                const formatted = JSON.stringify(JSON.parse(jsonOutputPre.textContent), null, 2);
                jsonOutputPre.textContent = formatted;
            } catch (err) {
                console.error('格式化失败:', err);
            }
        });
    }

    // === 模板验证功能 ===
    if (validateTemplateButton) {
        validateTemplateButton.addEventListener('click', () => {
            const content = newTemplateContentTextarea.value.trim();
            if (!content) {
                displayMessage(uploadMessageDiv, "请先输入模板内容。", false);
                return;
            }

            try {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                    displayMessage(uploadMessageDiv, "✓ JSON格式验证通过！", true);
                } else {
                    displayMessage(uploadMessageDiv, "⚠ JSON格式正确，但期望为数组格式。", false);
                }
            } catch (e) {
                displayMessage(uploadMessageDiv, `❌ JSON格式错误: ${e.message}`, false);
            }
        });
    }

    // === 模板管理 ===
    async function fetchTemplates() {
        try {
            const response = await fetch('/get_templates');
            const result = await response.json();
            if (result.success) {
                existingTemplatesSelect.innerHTML = '<option value="">选择一个模板查看...</option>';
                result.templates.forEach(filename => {
                    const option = document.createElement('option');
                    option.value = filename;
                    option.textContent = filename;
                    existingTemplatesSelect.appendChild(option);
                });
            } else {
                displayMessage(viewTemplateMessageDiv, `加载模板列表失败: ${result.error}`, false);
            }
        } catch (error) {
            displayMessage(viewTemplateMessageDiv, `请求模板列表错误: ${error.message}`, false);
        }
    }

    uploadTemplateButton.addEventListener('click', async () => {
        const filename = newTemplateFilenameInput.value.trim();
        const content = newTemplateContentTextarea.value.trim();

        if (!filename || !content) {
            displayMessage(uploadMessageDiv, "文件名和模板内容不能为空。", false);
            return;
        }
        if (!filename.endsWith(".json")) {
            displayMessage(uploadMessageDiv, "文件名必须以 .json 结尾。", false);
            newTemplateFilenameInput.focus();
            return;
        }

        try {
            JSON.parse(content);
        } catch (e) {
            displayMessage(uploadMessageDiv, "模板内容不是有效的JSON格式。", false);
            newTemplateContentTextarea.focus();
            return;
        }

        try {
            const response = await fetch('/upload_template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename: filename, content: content }),
            });
            const result = await response.json();
            displayMessage(uploadMessageDiv, result.message || result.error, result.success);
            if (result.success) {
                newTemplateFilenameInput.value = '';
                newTemplateContentTextarea.value = '';
                fetchTemplates();
            }
        } catch (error) {
            displayMessage(uploadMessageDiv, `上传请求错误: ${error.message}`, false);
        }
    });
    
    loadSelectedTemplateButton.addEventListener('click', async () => {
        const selectedFilename = existingTemplatesSelect.value;
        if (!selectedFilename) {
            displayMessage(viewTemplateMessageDiv, "请先选择一个模板。", false);
            return;
        }
        try {
            const response = await fetch(`/get_template_content?filename=${encodeURIComponent(selectedFilename)}`);
            const result = await response.json();
            if (result.success) {
                newTemplateFilenameInput.value = result.filename;
                newTemplateContentTextarea.value = JSON.stringify(JSON.parse(result.content), null, 2);
                displayMessage(viewTemplateMessageDiv, `模板 '${result.filename}' 已加载到编辑区。`, true);
                
                // 切换到上传标签页
                const uploadTab = document.querySelector('[data-tab="upload"]');
                if (uploadTab) uploadTab.click();
            } else {
                displayMessage(viewTemplateMessageDiv, `加载模板内容失败: ${result.error}`, false);
            }
        } catch (error) {
            displayMessage(viewTemplateMessageDiv, `请求模板内容错误: ${error.message}`, false);
        }
    });

    if (previewTemplateButton) {
        previewTemplateButton.addEventListener('click', async () => {
            const selectedFilename = existingTemplatesSelect.value;
            if (!selectedFilename) {
                displayMessage(viewTemplateMessageDiv, "请先选择一个模板。", false);
                return;
            }
            try {
                const response = await fetch(`/get_template_content?filename=${encodeURIComponent(selectedFilename)}`);
                const result = await response.json();
                if (result.success) {
                    const formatted = JSON.stringify(JSON.parse(result.content), null, 2);
                    alert(`模板预览 - ${result.filename}:\n\n${formatted}`);
                } else {
                    displayMessage(viewTemplateMessageDiv, `预览模板失败: ${result.error}`, false);
                }
            } catch (error) {
                displayMessage(viewTemplateMessageDiv, `预览请求错误: ${error.message}`, false);
            }
        });
    }

    // === 应用关闭 ===
    shutdownAppButton.addEventListener('click', async () => {
        if (!confirm("确定要关闭应用程序吗？")) {
            return;
        }
        try {
            shutdownMessageDiv.textContent = "正在尝试关闭服务器...";
            shutdownMessageDiv.className = 'message';
            shutdownMessageDiv.style.display = 'block';

            await fetch('/shutdown', { method: 'POST' });
            shutdownMessageDiv.textContent = "关闭请求已发送。如果服务器仍在运行，请手动关闭。";
            shutdownMessageDiv.className = 'message success';
        } catch (error) {
            shutdownMessageDiv.textContent = `关闭请求失败或服务器未响应: ${error.message}`;
            shutdownMessageDiv.className = 'message error';
        }
    });

    // === JSON高级展示功能 ===
    
    // JSON视图模式切换
    function initializeJsonViews() {
        const treeViewBtn = document.getElementById('treeViewBtn');
        const codeViewBtn = document.getElementById('codeViewBtn');
        const jsonTreeView = document.getElementById('jsonTreeView');
        const jsonCodeView = document.getElementById('jsonCodeView');
        
        if (treeViewBtn) {
            treeViewBtn.addEventListener('click', () => {
                switchJsonView('tree');
            });
        }
        
        if (codeViewBtn) {
            codeViewBtn.addEventListener('click', () => {
                switchJsonView('code');
            });
        }
    }
    
    function switchJsonView(mode) {
        const treeViewBtn = document.getElementById('treeViewBtn');
        const codeViewBtn = document.getElementById('codeViewBtn');
        const jsonTreeView = document.getElementById('jsonTreeView');
        const jsonCodeView = document.getElementById('jsonCodeView');
        
        // 更新按钮状态
        treeViewBtn?.classList.toggle('active', mode === 'tree');
        codeViewBtn?.classList.toggle('active', mode === 'code');
        
        // 更新视图显示
        if (jsonTreeView) {
            jsonTreeView.style.display = mode === 'tree' ? 'block' : 'none';
        }
        if (jsonCodeView) {
            jsonCodeView.style.display = mode === 'code' ? 'block' : 'none';
        }
        
        currentViewMode = mode;
        
        // 如果有数据，重新渲染
        if (processingData) {
            renderJsonData(processingData);
        }
    }
    
    // 渲染JSON数据
    function renderJsonData(data) {
        if (currentViewMode === 'tree') {
            renderTreeView(data);
        } else {
            renderCodeView(data);
        }
    }
    
    // 树状视图渲染
    function renderTreeView(data) {
        const container = document.getElementById('jsonTreeView');
        if (!container) return;
        
        try {
            // 清除现有内容
            container.innerHTML = '';
            
            // 使用JSONEditor创建树状视图
            const options = {
                mode: 'view',
                modes: ['view'],
                search: false,
                navigationBar: false,
                statusBar: false,
                mainMenuBar: false,
                onError: function (err) {
                    console.error('JSON Editor Error:', err);
                }
            };
            
            jsonEditor = new JSONEditor(container, options);
            jsonEditor.set(data);
            
            // 添加展开/折叠功能
            initializeTreeControls();
            
        } catch (error) {
            console.error('渲染树状视图失败:', error);
            container.innerHTML = `
                <div class="json-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>渲染树状视图失败</p>
                </div>
            `;
        }
    }
    
    // 代码视图渲染
    function renderCodeView(data) {
        const container = document.getElementById('jsonOutput');
        if (!container) return;
        
        try {
            const formattedJson = JSON.stringify(data, null, 2);
            container.textContent = formattedJson;
            container.className = 'json-output language-json';
            
            // 应用语法高亮
            if (typeof Prism !== 'undefined') {
                Prism.highlightElement(container);
            }
        } catch (error) {
            console.error('渲染代码视图失败:', error);
            container.textContent = '渲染失败';
        }
    }
    
    // 初始化树状视图控制按钮
    function initializeTreeControls() {
        const expandAllBtn = document.getElementById('expandAll');
        const collapseAllBtn = document.getElementById('collapseAll');
        
        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', () => {
                if (jsonEditor) {
                    jsonEditor.expandAll();
                }
            });
        }
        
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => {
                if (jsonEditor) {
                    jsonEditor.collapseAll();
                }
            });
        }
    }
    
    // JSON搜索功能
    function initializeJsonSearch() {
        const searchInput = document.getElementById('jsonSearch');
        const clearSearchBtn = document.getElementById('clearSearch');
        const searchResults = document.getElementById('searchResults');
        const searchResultText = document.getElementById('searchResultText');
        const prevResultBtn = document.getElementById('prevResult');
        const nextResultBtn = document.getElementById('nextResult');
        
        if (searchInput) {
            searchInput.addEventListener('input', debounce(performJsonSearch, 300));
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        navigateSearchResults('prev');
                    } else {
                        navigateSearchResults('next');
                    }
                }
            });
        }
        
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearSearchHighlights();
                hideSearchResults();
            });
        }
        
        if (prevResultBtn) {
            prevResultBtn.addEventListener('click', () => navigateSearchResults('prev'));
        }
        
        if (nextResultBtn) {
            nextResultBtn.addEventListener('click', () => navigateSearchResults('next'));
        }
    }
    
    // 执行JSON搜索
    function performJsonSearch() {
        const searchInput = document.getElementById('jsonSearch');
        const query = searchInput?.value.trim();
        
        if (!query || !processingData) {
            clearSearchHighlights();
            hideSearchResults();
            return;
        }
        
        // 清除之前的高亮
        clearSearchHighlights();
        
        // 搜索JSON数据
        searchResults = [];
        currentSearchIndex = 0;
        
        searchInJson(processingData, query, []);
        
        // 显示搜索结果
        showSearchResults();
        
        // 高亮第一个结果
        if (searchResults.length > 0) {
            highlightSearchResult(0);
        }
    }
    
    // 在JSON中搜索
    function searchInJson(obj, query, path) {
        const lowerQuery = query.toLowerCase();
        
        if (typeof obj === 'string') {
            if (obj.toLowerCase().includes(lowerQuery)) {
                searchResults.push({ path: path.slice(), value: obj, type: 'value' });
            }
        } else if (typeof obj === 'object' && obj !== null) {
            Object.keys(obj).forEach(key => {
                // 搜索键名
                if (key.toLowerCase().includes(lowerQuery)) {
                    searchResults.push({ path: path.concat(key), value: key, type: 'key' });
                }
                
                // 递归搜索值
                searchInJson(obj[key], query, path.concat(key));
            });
        } else if (obj != null && obj.toString().toLowerCase().includes(lowerQuery)) {
            // 搜索其他类型的值
            searchResults.push({ path: path.slice(), value: obj, type: 'value' });
        }
    }
    
    // 显示搜索结果
    function showSearchResults() {
        const searchResultsDiv = document.getElementById('searchResults');
        const searchResultText = document.getElementById('searchResultText');
        
        if (searchResultsDiv && searchResultText) {
            searchResultText.textContent = `搜索结果: ${searchResults.length} 项匹配`;
            searchResultsDiv.style.display = searchResults.length > 0 ? 'flex' : 'none';
        }
    }
    
    // 隐藏搜索结果
    function hideSearchResults() {
        const searchResultsDiv = document.getElementById('searchResults');
        if (searchResultsDiv) {
            searchResultsDiv.style.display = 'none';
        }
    }
    
    // 导航搜索结果
    function navigateSearchResults(direction) {
        if (searchResults.length === 0) return;
        
        // 清除当前高亮
        clearCurrentHighlight();
        
        // 计算新索引
        if (direction === 'next') {
            currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
        } else {
            currentSearchIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
        }
        
        // 高亮新结果
        highlightSearchResult(currentSearchIndex);
        
        // 更新结果文本
        const searchResultText = document.getElementById('searchResultText');
        if (searchResultText) {
            searchResultText.textContent = `搜索结果: ${currentSearchIndex + 1}/${searchResults.length} 项匹配`;
        }
    }
    
    // 高亮搜索结果
    function highlightSearchResult(index) {
        if (index >= searchResults.length) return;
        
        const result = searchResults[index];
        
        if (currentViewMode === 'tree' && jsonEditor) {
            // 树状视图中高亮
            try {
                const node = jsonEditor.node.findNode(result.path);
                if (node) {
                    node.expand();
                    const element = node.getDom();
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('search-highlight', 'current');
                    }
                }
            } catch (error) {
                console.warn('树状视图高亮失败:', error);
            }
        } else {
            // 代码视图中高亮
            highlightInCodeView(result);
        }
    }
    
    // 在代码视图中高亮
    function highlightInCodeView(result) {
        const container = document.getElementById('jsonOutput');
        if (!container) return;
        
        const text = container.textContent;
        const searchQuery = document.getElementById('jsonSearch')?.value;
        
        if (!searchQuery) return;
        
        // 简单的文本高亮实现
        const highlightedText = text.replace(
            new RegExp(escapeRegExp(searchQuery), 'gi'),
            (match) => `<span class="search-highlight">${match}</span>`
        );
        
        container.innerHTML = highlightedText;
    }
    
    // 清除搜索高亮
    function clearSearchHighlights() {
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight', 'current');
        });
        
        // 重新渲染代码视图以清除HTML高亮
        if (currentViewMode === 'code' && processingData) {
            renderCodeView(processingData);
        }
    }
    
    // 清除当前高亮
    function clearCurrentHighlight() {
        document.querySelectorAll('.search-highlight.current').forEach(el => {
            el.classList.remove('current');
        });
    }
    
    // 工具函数：防抖
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // 工具函数：转义正则表达式特殊字符
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // 更新提交问题函数以支持新的JSON展示
    const originalSubmitHandler = submitQuestionButton?.onclick;
    if (submitQuestionButton && !submitQuestionButton.dataset.enhanced) {
        submitQuestionButton.dataset.enhanced = 'true';
        
        // 重写提交成功后的处理
        const originalAddEventListener = submitQuestionButton.addEventListener;
        submitQuestionButton.addEventListener = function(type, listener, options) {
            if (type === 'click') {
                const enhancedListener = async function(event) {
                    await listener.call(this, event);
                    
                    // 如果处理成功，渲染JSON数据
                    if (processingData) {
                        renderJsonData(processingData);
                    }
                };
                return originalAddEventListener.call(this, type, enhancedListener, options);
            }
            return originalAddEventListener.call(this, type, listener, options);
        };
    }

    // === 初始化 ===
    function init() {
        updateProgressIndicator(1);
        initializeTabs();
        initializeJsonViews();
        initializeJsonSearch();
        fetchTemplates();
        
        // 设置输入框焦点
        if (userQuestionInput) {
            userQuestionInput.focus();
        }
    }

    // 页面加载完成后初始化
    init();
});

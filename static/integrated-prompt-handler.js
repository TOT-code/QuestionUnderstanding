// 集成的Prompt处理功能模块 - 方案B实现
(function() {
    'use strict';

    // 全局变量
    let currentJsonData = null;
    let availableOutputFiles = [];
    let isPromptSectionVisible = false;

    // === 初始化集成Prompt功能 ===
    function initIntegratedPromptFeatures() {
        console.log('开始初始化集成Prompt功能');
        
        setupPromptEventListeners();
        loadOutputFiles();
        
        // 监听JSON数据变化
        setInterval(checkForJsonData, 1000);
        
        console.log('集成Prompt功能初始化完成');
    }

    // === 检查JSON数据并显示Prompt区域 ===
    function checkForJsonData() {
        let dataFound = false;
        let newData = null;
        
        // 尝试从主脚本获取processingData
        if (window.processingData && window.processingData !== currentJsonData) {
            newData = window.processingData;
            dataFound = true;
            console.log('从window.processingData获取到JSON数据');
        }
        
        // 也检查JSON输出元素
        if (!dataFound) {
            const jsonOutputElement = document.getElementById('jsonOutput');
            if (jsonOutputElement && jsonOutputElement.textContent && 
                jsonOutputElement.textContent !== '这里将显示处理后的JSON结果...' &&
                jsonOutputElement.textContent.trim() !== '') {
                try {
                    const parsedData = JSON.parse(jsonOutputElement.textContent);
                    if (parsedData && JSON.stringify(parsedData) !== JSON.stringify(currentJsonData)) {
                        newData = parsedData;
                        dataFound = true;
                        console.log('从jsonOutput元素获取到JSON数据');
                    }
                } catch (error) {
                    // 忽略解析错误
                    console.debug('JSON解析失败:', error.message);
                }
            }
        }
        
        if (dataFound && newData) {
            currentJsonData = newData;
            showPromptSection();
            
            // 自动填充用户问题（如果可以从JSON中提取）
            autoFillUserQuestion();
        }
    }

    // === 显示Prompt生成区域 ===
    function showPromptSection() {
        const promptSection = document.getElementById('promptGenerationSection');
        if (promptSection && !isPromptSectionVisible) {
            promptSection.style.display = 'block';
            isPromptSectionVisible = true;
            
            // 添加显示动画
            setTimeout(() => {
                promptSection.style.opacity = '1';
                promptSection.style.transform = 'translateY(0)';
            }, 100);
            
            console.log('显示Prompt生成区域');
        }
    }

    // === 自动填充用户问题 ===
    function autoFillUserQuestion() {
        const quickQuestionInput = document.getElementById('quickUserQuestion');
        if (quickQuestionInput && currentJsonData) {
            // 尝试从JSON数据中提取原始问题
            const originalQuestion = currentJsonData.original_question_cn || 
                                   currentJsonData.main_topic_cn || '';
            
            if (originalQuestion && !quickQuestionInput.value.trim()) {
                quickQuestionInput.value = originalQuestion;
                console.log('自动填充用户问题:', originalQuestion);
            }
        }
    }

    // === 设置事件监听器 ===
    function setupPromptEventListeners() {
        // 快速生成Prompt按钮
        document.addEventListener('click', function(event) {
            const target = event.target;
            const targetId = target.id || target.closest('button')?.id;
            
            switch(targetId) {
                case 'quickGeneratePrompt':
                    event.preventDefault();
                    handleQuickGeneratePrompt();
                    break;
                    
                case 'analyzeQuestionScenario':
                    event.preventDefault();
                    handleAnalyzeScenario();
                    break;
                    
                case 'showAdvancedPrompt':
                    event.preventDefault();
                    showAdvancedOptions();
                    break;
                    
                case 'hideAdvancedPrompt':
                    event.preventDefault();
                    hideAdvancedOptions();
                    break;
                    
                case 'refreshFileList':
                    event.preventDefault();
                    loadOutputFiles();
                    break;
                    
                case 'copyGeneratedPrompt':
                    event.preventDefault();
                    copyPromptToClipboard();
                    break;
                    
                case 'downloadGeneratedPrompt':
                    event.preventDefault();
                    downloadGeneratedPrompt();
                    break;
                    
                case 'editGeneratedPrompt':
                    event.preventDefault();
                    togglePromptEdit();
                    break;
            }
        });

        // 数据源选择变化
        document.addEventListener('change', function(event) {
            if (event.target.name === 'dataSource') {
                handleDataSourceChange(event.target.value);
            }
        });

        // 输入事件监听
        document.addEventListener('input', function(event) {
            if (event.target.id === 'generatedPromptOutput') {
                updateWordCount();
            }
        });
    }

    // === 处理快速生成Prompt ===
    async function handleQuickGeneratePrompt() {
        const userQuestion = document.getElementById('quickUserQuestion').value.trim();
        if (!userQuestion) {
            showPromptError('请输入具体的用户问题');
            return;
        }

        if (!currentJsonData) {
            showPromptError('没有可用的JSON数据，请先分析问题');
            return;
        }

        // 获取选项
        const outputFormat = document.querySelector('input[name="quickOutputFormat"]:checked').value;
        const scenario = document.getElementById('quickScenarioSelect').value;
        
        // 显示加载状态
        const generateBtn = document.getElementById('quickGeneratePrompt');
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
        generateBtn.disabled = true;

        try {
            await generatePrompt(userQuestion, outputFormat, scenario, currentJsonData);
        } catch (error) {
            console.error('生成Prompt失败:', error);
            showPromptError(`生成失败: ${error.message}`);
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    }

    // === 处理场景分析 ===
    async function handleAnalyzeScenario() {
        const userQuestion = document.getElementById('quickUserQuestion').value.trim();
        if (!userQuestion) {
            showPromptError('请先输入用户问题');
            return;
        }

        try {
            const response = await fetch('/analyze_scenario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_question: userQuestion })
            });

            const result = await response.json();
            
            if (result.success) {
                const analysis = result.analysis;
                
                // 自动选择对应的场景
                const scenarioSelect = document.getElementById('quickScenarioSelect');
                const optionToSelect = Array.from(scenarioSelect.options).find(
                    option => option.value === analysis.template_id
                );
                if (optionToSelect) {
                    scenarioSelect.value = analysis.template_id;
                }

                // 显示分析结果
                showScenarioAnalysisResult(analysis);
                hidePromptError();
            } else {
                showPromptError(`分析失败: ${result.error}`);
            }
        } catch (error) {
            showPromptError(`请求失败: ${error.message}`);
        }
    }

    // === 生成Prompt核心函数 ===
    async function generatePrompt(userQuestion, outputFormat, scenario, jsonData) {
        const requestData = {
            json_data: jsonData,
            user_question: userQuestion,
            output_format: outputFormat
        };

        if (scenario !== 'auto') {
            requestData.scenario_hint = scenario;
        }

        const response = await fetch('/generate_prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });

        const result = await response.json();
        
        if (result.success) {
            showPromptResult(result);
            hidePromptError();
        } else {
            throw new Error(result.error || '生成失败');
        }
    }

    // === 显示Prompt生成结果 ===
    function showPromptResult(result) {
        // 显示结果区域
        const resultArea = document.getElementById('promptResultArea');
        resultArea.style.display = 'block';

        // 设置场景信息
        const scenarioInfo = document.getElementById('promptScenarioInfo');
        const confidenceInfo = document.getElementById('promptConfidenceInfo');
        
        const info = result.processing_info;
        scenarioInfo.textContent = info.template_name || info.scenario_type || '未知场景';
        scenarioInfo.className = 'scenario-badge ' + (info.scenario_type || '').toLowerCase().replace('_', '-');
        
        if (info.confidence !== undefined) {
            confidenceInfo.textContent = `置信度: ${(info.confidence * 100).toFixed(0)}%`;
            confidenceInfo.style.display = 'inline';
        } else {
            confidenceInfo.style.display = 'none';
        }

        // 显示生成的prompt
        const promptOutput = document.getElementById('generatedPromptOutput');
        promptOutput.value = result.prompt;
        
        // 更新字数统计
        updateWordCount();
        
        // 滚动到结果区域
        resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        console.log('Prompt生成成功');
    }

    // === 显示场景分析结果 ===
    function showScenarioAnalysisResult(analysis) {
        const message = `场景分析结果：

📊 场景类型：${analysis.scenario_type}
🎯 置信度：${(analysis.confidence * 100).toFixed(0)}%
📈 复杂度：${analysis.complexity_level}
🔧 推荐模板：${analysis.template_id}
❓ 检测到的疑问词：${analysis.detected_question_words.join(', ') || '无'}

系统已自动选择最适合的场景类型，您可以直接生成Prompt。`;

        // 创建美化的提示框
        showNotification(message, 'info', 8000);
    }

    // === 显示/隐藏高级选项 ===
    function showAdvancedOptions() {
        const advancedOptions = document.getElementById('advancedPromptOptions');
        const showBtn = document.getElementById('showAdvancedPrompt');
        
        advancedOptions.style.display = 'block';
        showBtn.style.display = 'none';
        
        // 加载文件列表
        populateFileSelector();
    }

    function hideAdvancedOptions() {
        const advancedOptions = document.getElementById('advancedPromptOptions');
        const showBtn = document.getElementById('showAdvancedPrompt');
        
        advancedOptions.style.display = 'none';
        showBtn.style.display = 'inline-block';
    }

    // === 处理数据源变化 ===
    function handleDataSourceChange(value) {
        const fileDataSource = document.getElementById('fileDataSource');
        
        if (value === 'file') {
            fileDataSource.style.display = 'block';
            populateFileSelector();
        } else {
            fileDataSource.style.display = 'none';
        }
    }

    // === 加载输出文件列表 ===
    async function loadOutputFiles() {
        try {
            const response = await fetch('/get_output_files');
            const result = await response.json();
            
            if (result.success) {
                availableOutputFiles = result.files;
                console.log(`加载了 ${availableOutputFiles.length} 个输出文件`);
                
                // 如果高级选项已显示，更新文件列表
                if (document.getElementById('advancedPromptOptions').style.display === 'block') {
                    populateFileSelector();
                }
            }
        } catch (error) {
            console.error('加载输出文件失败:', error);
        }
    }

    // === 填充文件选择器 ===
    function populateFileSelector() {
        const selectElement = document.getElementById('advancedFileSelect');
        if (!selectElement) return;
        
        selectElement.innerHTML = '<option value="">请选择历史分析文件...</option>';
        
        availableOutputFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file.filename;
            
            // 格式化文件信息
            const fileDate = new Date(file.modified * 1000).toLocaleString('zh-CN');
            const fileSize = formatFileSize(file.size);
            option.textContent = `${file.filename} (${fileSize}, ${fileDate})`;
            
            selectElement.appendChild(option);
        });
    }

    // === 复制Prompt到剪贴板 ===
    async function copyPromptToClipboard() {
        const promptOutput = document.getElementById('generatedPromptOutput');
        const promptText = promptOutput.value;
        
        if (!promptText) {
            showPromptError('没有可复制的Prompt内容');
            return;
        }

        try {
            await navigator.clipboard.writeText(promptText);
            
            // 显示复制成功反馈
            const copyBtn = document.getElementById('copyGeneratedPrompt');
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.classList.add('success');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.classList.remove('success');
            }, 2000);
            
            showNotification('Prompt已复制到剪贴板！', 'success', 3000);
            
        } catch (error) {
            console.error('复制失败:', error);
            showPromptError('复制失败，请手动选择并复制内容');
        }
    }

    // === 下载生成的Prompt ===
    function downloadGeneratedPrompt() {
        const promptOutput = document.getElementById('generatedPromptOutput');
        const promptText = promptOutput.value;
        
        if (!promptText) {
            showPromptError('没有可下载的Prompt内容');
            return;
        }

        // 生成文件名
        const userQuestion = document.getElementById('quickUserQuestion').value.trim();
        const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
        const questionPrefix = userQuestion.substring(0, 20).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
        const filename = `prompt_${questionPrefix}_${timestamp}.txt`;

        // 创建下载
        const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
        
        showNotification('Prompt文件下载开始！', 'success', 3000);
    }

    // === 切换Prompt编辑模式 ===
    function togglePromptEdit() {
        const promptOutput = document.getElementById('generatedPromptOutput');
        const editBtn = document.getElementById('editGeneratedPrompt');
        
        if (promptOutput.readOnly) {
            // 进入编辑模式
            promptOutput.readOnly = false;
            promptOutput.classList.add('editing');
            editBtn.innerHTML = '<i class="fas fa-save"></i>';
            editBtn.title = '保存修改';
            editBtn.classList.add('editing');
            
            showNotification('进入编辑模式，您可以修改Prompt内容', 'info', 3000);
        } else {
            // 退出编辑模式
            promptOutput.readOnly = true;
            promptOutput.classList.remove('editing');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = '编辑Prompt';
            editBtn.classList.remove('editing');
            
            updateWordCount();
            showNotification('修改已保存', 'success', 2000);
        }
    }

    // === 更新字数统计 ===
    function updateWordCount() {
        const promptOutput = document.getElementById('generatedPromptOutput');
        const wordCountElement = document.getElementById('promptWordCount');
        
        if (promptOutput && wordCountElement) {
            const text = promptOutput.value;
            const wordCount = text.length;
            wordCountElement.textContent = wordCount.toLocaleString();
        }
    }

    // === 显示错误信息 ===
    function showPromptError(message) {
        const errorDiv = document.getElementById('promptError');
        const errorText = errorDiv.querySelector('.error-text');
        
        if (errorText) {
            errorText.textContent = message;
        } else {
            errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span class="error-text">${message}</span>`;
        }
        
        errorDiv.style.display = 'block';
        
        // 自动隐藏错误信息
        setTimeout(() => {
            hidePromptError();
        }, 5000);
    }

    // === 隐藏错误信息 ===
    function hidePromptError() {
        const errorDiv = document.getElementById('promptError');
        errorDiv.style.display = 'none';
    }

    // === 显示通知 ===
    function showNotification(message, type = 'info', duration = 3000) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // 自动移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    // === 获取通知图标 ===
    function getNotificationIcon(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-triangle',
            'warning': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // === 工具函数：格式化文件大小 ===
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // === 添加样式 ===
    function addIntegratedPromptStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Prompt生成区域样式 */
            .prompt-section {
                margin-top: 30px;
                padding: 25px;
                background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
                border: 2px solid #e3f2fd;
                border-radius: 12px;
                transition: all 0.3s ease;
                opacity: 0;
                transform: translateY(20px);
            }

            .prompt-section-header {
                margin-bottom: 20px;
                text-align: center;
            }

            .prompt-section-header h4 {
                color: #1976d2;
                margin-bottom: 8px;
                font-size: 1.4em;
            }

            .prompt-description {
                color: #666;
                font-size: 0.95em;
                margin: 0;
            }

            /* 快速生成区域 */
            .quick-prompt-area {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            }

            .prompt-options {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 15px 0;
            }

            .option-group label {
                display: block;
                font-weight: 600;
                color: #333;
                margin-bottom: 8px;
            }

            .radio-group {
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
            }

            .radio-option {
                display: flex;
                align-items: center;
                cursor: pointer;
                padding: 8px 12px;
                border: 2px solid #e0e0e0;
                border-radius: 6px;
                transition: all 0.2s ease;
                font-weight: normal;
            }

            .radio-option:hover {
                border-color: #1976d2;
                background: #f5f9ff;
            }

            .radio-option input[type="radio"] {
                margin-right: 8px;
            }

            .radio-option:has(input:checked) {
                border-color: #1976d2;
                background: #e3f2fd;
                color: #1976d2;
            }

            .prompt-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-top: 20px;
                flex-wrap: wrap;
            }

            /* 高级选项 */
            .advanced-options {
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                margin-bottom: 20px;
                overflow: hidden;
            }

            .advanced-header {
                background: #f5f5f5;
                padding: 12px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #ddd;
            }

            .advanced-header h5 {
                margin: 0;
                color: #555;
            }

            .advanced-controls {
                padding: 20px;
            }

            .btn-link {
                background: none;
                border: none;
                color: #1976d2;
                cursor: pointer;
                font-size: 14px;
                text-decoration: none;
            }

            .btn-link:hover {
                text-decoration: underline;
            }

            /* 结果区域 */
            .prompt-result-area {
                background: white;
                border-radius: 8px;
                border: 1px solid #ddd;
                overflow: hidden;
                margin-bottom: 20px;
            }

            .prompt-result-area .result-header {
                background: #f8f9fa;
                padding: 15px 20px;
                border-bottom: 1px solid #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .prompt-result-area .result-header h5 {
                margin: 0;
                color: #333;
            }

            .result-meta {
                display: flex;
                gap: 15px;
                align-items: center;
            }

            .scenario-badge {
                background: #e3f2fd;
                color: #1976d2;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
            }

            .confidence-info {
                color: #666;
                font-size: 14px;
            }

            .prompt-result-container {
                position: relative;
            }

            .prompt-result-toolbar {
                background: #f8f9fa;
                padding: 10px 15px;
                border-bottom: 1px solid #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .toolbar-left {
                color: #666;
                font-size: 14px;
            }

            .toolbar-right {
                display: flex;
                gap: 8px;
            }

            .btn-icon {
                background: none;
                border: 1px solid #ddd;
                padding: 6px 10px;
                border-radius: 4px;
                cursor: pointer;
                color: #555;
                transition: all 0.2s ease;
            }

            .btn-icon:hover {
                background: #f0f0f0;
                border-color: #999;
            }

            .btn-icon.success {
                background: #4caf50;
                color: white;
                border-color: #4caf50;
            }

            .btn-icon.editing {
                background: #ff9800;
                color: white;
                border-color: #ff9800;
            }

            .prompt-output {
                width: 100%;
                border: none;
                padding: 20px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.6;
                resize: vertical;
                background: #fafafa;
                min-height: 300px;
            }

            .prompt-output.editing {
                background: #fff8e1;
                border-left: 4px solid #ff9800;
            }

            .prompt-usage-tip {
                background: #e8f5e8;
                color: #2e7d32;
                padding: 12px 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 14px;
            }

            /* 错误信息 */
            .prompt-error {
                background: #ffebee;
                color: #c62828;
                padding: 12px 20px;
                border-radius: 6px;
                border-left: 4px solid #f44336;
                margin-top: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            /* 通知样式 */
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 15px;
                z-index: 9999;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 400px;
                min-width: 300px;
            }

            .notification.show {
                transform: translateX(0);
            }

            .notification-success {
                border-left: 4px solid #4caf50;
            }

            .notification-error {
                border-left: 4px solid #f44336;
            }

            .notification-warning {
                border-left: 4px solid #ff9800;
            }

            .notification-info {
                border-left: 4px solid #2196f3;
            }

            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }

            .notification-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
            }

            .notification-close:hover {
                background: #f0f0f0;
                color: #666;
            }

            /* 响应式设计 */
            @media (max-width: 768px) {
                .prompt-options {
                    grid-template-columns: 1fr;
                    gap: 15px;
                }

                .radio-group {
                    flex-direction: column;
                    gap: 10px;
                }

                .prompt-actions {
                    flex-direction: column;
                }

                .result-meta {
                    flex-direction: column;
                    gap: 8px;
                    align-items: flex-start;
                }

                .toolbar-right {
                    flex-wrap: wrap;
                }

                .notification {
                    left: 10px;
                    right: 10px;
                    max-width: none;
                    min-width: auto;
                }
            }

            /* 动画效果 */
            .prompt-section {
                animation: slideInUp 0.5s ease-out forwards;
            }

            @keyframes slideInUp {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* 加载状态 */
            .btn-primary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            .fa-spinner {
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // === 初始化 ===
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                addIntegratedPromptStyles();
                initIntegratedPromptFeatures();
            });
        } else {
            addIntegratedPromptStyles();
            initIntegratedPromptFeatures();
        }
    }

    // 立即初始化
    init();

})();

// Prompt处理功能模块
(function() {
    'use strict';

    // 全局变量
    let currentJsonData = null;
    let availableOutputFiles = [];

    // === Prompt功能初始化 ===
    function initPromptFeatures() {
        console.log('开始初始化Prompt功能');
        
        // 延迟添加按钮，确保DOM完全加载
        setTimeout(() => {
            addPromptButton();
            // 如果第一次没成功，再尝试几次
            let retryCount = 0;
            const retryInterval = setInterval(() => {
                if (!document.getElementById('generatePromptBtn') && retryCount < 5) {
                    console.log(`重试添加Prompt按钮，第${retryCount + 1}次`);
                    addPromptButton();
                    retryCount++;
                } else {
                    clearInterval(retryInterval);
                }
            }, 2000);
        }, 1000);
        
        loadOutputFiles();
        setupPromptEventListeners();
        
        // 定期检查是否有新的JSON数据
        setInterval(checkForJsonData, 1000);
        
        console.log('Prompt功能初始化完成');
    }

    // === 定期检查JSON数据 ===
    function checkForJsonData() {
        let dataFound = false;
        
        // 尝试从主脚本获取processingData
        if (window.processingData && window.processingData !== currentJsonData) {
            currentJsonData = window.processingData;
            dataFound = true;
            console.log('从window.processingData获取到JSON数据');
        }
        
        // 也检查JSON输出元素
        const jsonOutputElement = document.getElementById('jsonOutput');
        if (jsonOutputElement && jsonOutputElement.textContent && 
            jsonOutputElement.textContent !== '这里将显示处理后的JSON结果...' &&
            jsonOutputElement.textContent.trim() !== '') {
            try {
                const parsedData = JSON.parse(jsonOutputElement.textContent);
                if (parsedData && JSON.stringify(parsedData) !== JSON.stringify(currentJsonData)) {
                    currentJsonData = parsedData;
                    dataFound = true;
                    console.log('从jsonOutput元素获取到JSON数据');
                }
            } catch (error) {
                // 忽略解析错误
                console.debug('JSON解析失败:', error.message);
            }
        }
        
        if (dataFound) {
            showPromptButton();
        }
    }

    // === 在结果区域添加Prompt生成按钮 ===
    function addPromptButton() {
        // 检查按钮是否已存在
        if (document.getElementById('generatePromptBtn')) {
            console.log('Prompt按钮已存在，跳过添加');
            return;
        }

        // 尝试多种选择器来查找结果操作容器
        let resultActions = document.querySelector('.result-header .result-actions');
        
        // 如果第一种方式没找到，尝试其他方式
        if (!resultActions) {
            resultActions = document.querySelector('.json-view-controls .result-actions');
        }
        
        if (!resultActions) {
            resultActions = document.querySelector('.result-actions');
        }
        
        if (!resultActions) {
            console.warn('找不到.result-actions容器，尝试延迟添加按钮');
            // 如果没找到，可能DOM还没完全加载，稍后重试
            setTimeout(addPromptButton, 1000);
            return;
        }

        const promptButton = document.createElement('button');
        promptButton.id = 'generatePromptBtn';
        promptButton.className = 'btn-secondary';  // 改为secondary样式以匹配其他按钮
        promptButton.title = '生成Prompt';
        promptButton.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i>';
        promptButton.style.display = 'none'; // 初始隐藏

        resultActions.appendChild(promptButton);
        console.log('Prompt按钮已成功添加到页面，容器:', resultActions.className);
    }

    // === 加载输出文件列表 ===
    async function loadOutputFiles() {
        try {
            const response = await fetch('/get_output_files');
            const result = await response.json();
            
            if (result.success) {
                availableOutputFiles = result.files;
                console.log(`加载了 ${availableOutputFiles.length} 个输出文件`);
            }
        } catch (error) {
            console.error('加载输出文件失败:', error);
        }
    }

    // === 设置事件监听器 ===
    function setupPromptEventListeners() {
        // Prompt生成按钮点击事件
        document.addEventListener('click', function(event) {
            if (event.target.id === 'generatePromptBtn' || event.target.closest('#generatePromptBtn')) {
                event.preventDefault();
                showPromptDialog();
            }
        });
    }

    // === 显示Prompt按钮 ===
    function showPromptButton() {
        const promptButton = document.getElementById('generatePromptBtn');
        
        if (!promptButton) {
            console.warn('Prompt按钮不存在，尝试重新添加');
            addPromptButton();
            return;
        }
        
        if (currentJsonData) {
            promptButton.style.display = 'inline-block';
            console.log('显示Prompt按钮，当前JSON数据可用');
        } else {
            console.log('隐藏Prompt按钮，没有JSON数据');
            promptButton.style.display = 'none';
        }
    }

    // === 显示Prompt生成对话框 ===
    function showPromptDialog() {
        // 再次检查数据
        checkForJsonData();
        
        if (!currentJsonData) {
            alert('没有可用的JSON数据，请先分析问题');
            return;
        }

        const dialog = createPromptDialog();
        document.body.appendChild(dialog);
        dialog.style.display = 'flex';
    }

    // === 创建Prompt对话框 ===
    function createPromptDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'prompt-dialog-overlay';
        dialog.innerHTML = `
            <div class="prompt-dialog">
                <div class="prompt-dialog-header">
                    <h3><i class="fas fa-wand-magic-sparkles"></i> 生成Prompt</h3>
                    <button class="close-btn" onclick="this.closest('.prompt-dialog-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="prompt-dialog-body">
                    <!-- 数据源选择 -->
                    <div class="input-group">
                        <label>数据源</label>
                        <div class="data-source-options">
                            <label class="radio-option">
                                <input type="radio" name="dataSource" value="current" checked>
                                当前分析结果
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="dataSource" value="file">
                                选择已有文件
                            </label>
                        </div>
                    </div>

                    <!-- 文件选择器 -->
                    <div class="input-group" id="fileSelector" style="display: none;">
                        <label>选择JSON文件</label>
                        <select id="jsonFileSelect">
                            <option value="">请选择...</option>
                        </select>
                    </div>

                    <!-- 用户问题输入 -->
                    <div class="input-group">
                        <label for="promptUserQuestion">用户问题</label>
                        <textarea id="promptUserQuestion" rows="2" placeholder="输入具体的用户问题，例如：什么是5G的核心技术？"></textarea>
                    </div>

                    <!-- 场景选择 -->
                    <div class="input-group">
                        <label>场景类型</label>
                        <div class="scenario-options">
                            <label class="radio-option">
                                <input type="radio" name="scenario" value="auto" checked>
                                自动识别
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="scenario" value="direct_answer_v1">
                                直接回答
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="scenario" value="guided_question_v1">
                                引导学习
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="scenario" value="knowledge_explain_v1">
                                详细解释
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="scenario" value="compare_analysis_v1">
                                对比分析
                            </label>
                        </div>
                    </div>

                    <!-- 输出格式 -->
                    <div class="input-group">
                        <label>输出格式</label>
                        <div class="format-options">
                            <label class="radio-option">
                                <input type="radio" name="outputFormat" value="normal" checked>
                                普通模式
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="outputFormat" value="strict">
                                严格控制模式
                            </label>
                        </div>
                    </div>

                    <!-- 生成结果 -->
                    <div class="input-group" id="promptResult" style="display: none;">
                        <label>生成的Prompt</label>
                        <div class="prompt-result-container">
                            <div class="prompt-result-header">
                                <span class="scenario-info" id="scenarioInfo"></span>
                                <div class="result-actions">
                                    <button type="button" id="copyPromptBtn" class="btn-secondary" title="复制">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                    <button type="button" id="downloadPromptBtn" class="btn-secondary" title="下载">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                            <textarea id="generatedPrompt" readonly rows="10"></textarea>
                        </div>
                    </div>

                    <!-- 错误信息 -->
                    <div id="promptError" class="error-message" style="display: none;"></div>
                </div>

                <div class="prompt-dialog-footer">
                    <button type="button" id="generatePromptAction" class="btn-primary">
                        <i class="fas fa-magic"></i> 生成Prompt
                    </button>
                    <button type="button" id="analyzeScenarioBtn" class="btn-secondary">
                        <i class="fas fa-search"></i> 分析场景
                    </button>
                    <button type="button" onclick="this.closest('.prompt-dialog-overlay').remove()" class="btn-secondary">
                        取消
                    </button>
                </div>
            </div>
        `;

        // 设置对话框事件
        setupDialogEvents(dialog);
        
        return dialog;
    }

    // === 设置对话框事件 ===
    function setupDialogEvents(dialog) {
        // 数据源选择变化
        const dataSourceInputs = dialog.querySelectorAll('input[name="dataSource"]');
        const fileSelector = dialog.getElementById('fileSelector');
        const jsonFileSelect = dialog.getElementById('jsonFileSelect');

        dataSourceInputs.forEach(input => {
            input.addEventListener('change', function() {
                if (this.value === 'file') {
                    fileSelector.style.display = 'block';
                    populateFileSelector(jsonFileSelect);
                } else {
                    fileSelector.style.display = 'none';
                }
            });
        });

        // 生成Prompt按钮
        const generateBtn = dialog.getElementById('generatePromptAction');
        generateBtn.addEventListener('click', () => generatePrompt(dialog));

        // 分析场景按钮
        const analyzeBtn = dialog.getElementById('analyzeScenarioBtn');
        analyzeBtn.addEventListener('click', () => analyzeScenario(dialog));

        // 复制按钮
        const copyBtn = dialog.getElementById('copyPromptBtn');
        copyBtn.addEventListener('click', () => copyPromptToClipboard(dialog));

        // 下载按钮
        const downloadBtn = dialog.getElementById('downloadPromptBtn');
        downloadBtn.addEventListener('click', () => downloadPrompt(dialog));

        // 点击遮罩关闭
        dialog.addEventListener('click', function(event) {
            if (event.target === dialog) {
                dialog.remove();
            }
        });
    }

    // === 填充文件选择器 ===
    function populateFileSelector(selectElement) {
        selectElement.innerHTML = '<option value="">请选择...</option>';
        
        availableOutputFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file.filename;
            option.textContent = `${file.filename} (${formatFileSize(file.size)})`;
            selectElement.appendChild(option);
        });
    }

    // === 生成Prompt ===
    async function generatePrompt(dialog) {
        const userQuestion = dialog.getElementById('promptUserQuestion').value.trim();
        if (!userQuestion) {
            showPromptError(dialog, '请输入用户问题');
            return;
        }

        // 获取数据源
        const dataSource = dialog.querySelector('input[name="dataSource"]:checked').value;
        let jsonData = null;

        if (dataSource === 'current') {
            jsonData = currentJsonData;
        } else {
            const selectedFile = dialog.getElementById('jsonFileSelect').value;
            if (!selectedFile) {
                showPromptError(dialog, '请选择JSON文件');
                return;
            }
            
            try {
                const response = await fetch('/load_json_file', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file_path: selectedFile })
                });
                const result = await response.json();
                if (result.success) {
                    jsonData = result.json_data;
                } else {
                    showPromptError(dialog, `加载文件失败: ${result.error}`);
                    return;
                }
            } catch (error) {
                showPromptError(dialog, `请求失败: ${error.message}`);
                return;
            }
        }

        if (!jsonData) {
            showPromptError(dialog, '没有可用的JSON数据');
            return;
        }

        // 准备请求参数
        const scenario = dialog.querySelector('input[name="scenario"]:checked').value;
        const outputFormat = dialog.querySelector('input[name="outputFormat"]:checked').value;
        
        const requestData = {
            json_data: jsonData,
            user_question: userQuestion,
            output_format: outputFormat
        };

        if (scenario !== 'auto') {
            requestData.scenario_hint = scenario;
        }

        // 显示加载状态
        const generateBtn = dialog.getElementById('generatePromptAction');
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
        generateBtn.disabled = true;

        try {
            const response = await fetch('/generate_prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            
            if (result.success) {
                showPromptResult(dialog, result);
                hidePromptError(dialog);
            } else {
                showPromptError(dialog, `生成失败: ${result.error}`);
            }
        } catch (error) {
            showPromptError(dialog, `请求失败: ${error.message}`);
        } finally {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }
    }

    // === 分析场景 ===
    async function analyzeScenario(dialog) {
        const userQuestion = dialog.getElementById('promptUserQuestion').value.trim();
        if (!userQuestion) {
            showPromptError(dialog, '请先输入用户问题');
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
                const scenarioInput = dialog.querySelector(`input[name="scenario"][value="${analysis.template_id}"]`);
                if (scenarioInput) {
                    scenarioInput.checked = true;
                }

                // 显示分析结果
                alert(`场景分析结果:
场景类型: ${analysis.scenario_type}
置信度: ${analysis.confidence.toFixed(2)}
复杂度: ${analysis.complexity_level}
推荐模板: ${analysis.template_id}
检测到的疑问词: ${analysis.detected_question_words.join(', ')}`);

                hidePromptError(dialog);
            } else {
                showPromptError(dialog, `分析失败: ${result.error}`);
            }
        } catch (error) {
            showPromptError(dialog, `请求失败: ${error.message}`);
        }
    }

    // === 显示Prompt结果 ===
    function showPromptResult(dialog, result) {
        const resultContainer = dialog.getElementById('promptResult');
        const scenarioInfo = dialog.getElementById('scenarioInfo');
        const generatedPrompt = dialog.getElementById('generatedPrompt');

        // 显示场景信息
        const info = result.processing_info;
        scenarioInfo.innerHTML = `
            <strong>场景:</strong> ${info.template_name || info.scenario_type} 
            <strong>置信度:</strong> ${info.confidence || 'N/A'}
        `;

        // 显示生成的prompt
        generatedPrompt.value = result.prompt;
        
        // 显示结果区域
        resultContainer.style.display = 'block';
        
        // 滚动到结果区域
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // === 复制Prompt到剪贴板 ===
    async function copyPromptToClipboard(dialog) {
        const promptText = dialog.getElementById('generatedPrompt').value;
        if (!promptText) return;

        try {
            await navigator.clipboard.writeText(promptText);
            const copyBtn = dialog.getElementById('copyPromptBtn');
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
            }, 2000);
        } catch (error) {
            console.error('复制失败:', error);
        }
    }

    // === 下载Prompt ===
    function downloadPrompt(dialog) {
        const promptText = dialog.getElementById('generatedPrompt').value;
        if (!promptText) return;

        const blob = new Blob([promptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prompt_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // === 显示错误信息 ===
    function showPromptError(dialog, message) {
        const errorDiv = dialog.getElementById('promptError');
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        errorDiv.style.display = 'block';
    }

    // === 隐藏错误信息 ===
    function hidePromptError(dialog) {
        const errorDiv = dialog.getElementById('promptError');
        errorDiv.style.display = 'none';
    }

    // === 工具函数：格式化文件大小 ===
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // === CSS样式 ===
    function addPromptStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .prompt-dialog-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                padding: 20px;
            }

            .prompt-dialog {
                background: white;
                border-radius: 8px;
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }

            .prompt-dialog-header {
                padding: 20px;
                border-bottom: 1px solid #e5e5e5;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f8f9fa;
                border-radius: 8px 8px 0 0;
            }

            .prompt-dialog-header h3 {
                margin: 0;
                color: #333;
            }

            .prompt-dialog-header .close-btn {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                padding: 5px;
                color: #666;
                border-radius: 4px;
            }

            .prompt-dialog-header .close-btn:hover {
                background: #e9ecef;
                color: #333;
            }

            .prompt-dialog-body {
                padding: 20px;
            }

            .prompt-dialog-body .input-group {
                margin-bottom: 20px;
            }

            .prompt-dialog-body label {
                display: block;
                margin-bottom: 8px;
                font-weight: 500;
                color: #333;
            }

            .data-source-options,
            .scenario-options,
            .format-options {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                margin-top: 8px;
            }

            .radio-option {
                display: flex;
                align-items: center;
                font-weight: normal;
                cursor: pointer;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                transition: all 0.2s;
            }

            .radio-option:hover {
                background: #f8f9fa;
                border-color: #007bff;
            }

            .radio-option input[type="radio"] {
                margin-right: 8px;
            }

            .radio-option:has(input:checked) {
                background: #e3f2fd;
                border-color: #007bff;
                color: #0056b3;
            }

            .prompt-result-container {
                border: 1px solid #ddd;
                border-radius: 4px;
                overflow: hidden;
            }

            .prompt-result-header {
                background: #f8f9fa;
                padding: 10px 15px;
                border-bottom: 1px solid #ddd;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .scenario-info {
                font-size: 14px;
                color: #666;
            }

            .prompt-result-header .result-actions {
                display: flex;
                gap: 5px;
            }

            .prompt-result-header .btn-secondary {
                padding: 5px 10px;
                font-size: 12px;
            }

            #generatedPrompt {
                width: 100%;
                border: none;
                padding: 15px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.5;
                resize: vertical;
                background: #f9f9f9;
            }

            .prompt-dialog-footer {
                padding: 20px;
                border-top: 1px solid #e5e5e5;
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                background: #f8f9fa;
                border-radius: 0 0 8px 8px;
            }

            .prompt-dialog .btn-primary,
            .prompt-dialog .btn-secondary {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }

            .prompt-dialog .btn-primary {
                background: #007bff;
                color: white;
            }

            .prompt-dialog .btn-primary:hover {
                background: #0056b3;
            }

            .prompt-dialog .btn-secondary {
                background: #6c757d;
                color: white;
            }

            .prompt-dialog .btn-secondary:hover {
                background: #545b62;
            }

            .prompt-dialog .error-message {
                background: #f8d7da;
                color: #721c24;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #f5c6cb;
            }

            #generatePromptBtn {
                margin-left: 10px;
            }

            @media (max-width: 768px) {
                .prompt-dialog {
                    margin: 10px;
                    max-height: 95vh;
                }
                
                .data-source-options,
                .scenario-options,
                .format-options {
                    flex-direction: column;
                    gap: 10px;
                }
                
                .prompt-dialog-footer {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // === 初始化 ===
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                addPromptStyles();
                initPromptFeatures();
            });
        } else {
            addPromptStyles();
            initPromptFeatures();
        }
    }

    // 立即初始化
    init();

})();

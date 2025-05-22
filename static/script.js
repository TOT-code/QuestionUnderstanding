document.addEventListener('DOMContentLoaded', function() {
    const userQuestionInput = document.getElementById('userQuestion');
    const submitQuestionButton = document.getElementById('submitQuestion');
    const jsonOutputPre = document.getElementById('jsonOutput');
    const outputPathSpan = document.getElementById('outputPath');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessageDiv = document.getElementById('errorMessage');

    const newTemplateFilenameInput = document.getElementById('newTemplateFilename');
    const newTemplateContentTextarea = document.getElementById('newTemplateContent');
    const uploadTemplateButton = document.getElementById('uploadTemplate');
    const uploadMessageDiv = document.getElementById('uploadMessage');

    const existingTemplatesSelect = document.getElementById('existingTemplates');
    const loadSelectedTemplateButton = document.getElementById('loadSelectedTemplate');
    const viewTemplateMessageDiv = document.getElementById('viewTemplateMessage');
    
    const shutdownAppButton = document.getElementById('shutdownApp');
    const shutdownMessageDiv = document.getElementById('shutdownMessage');

    function displayMessage(element, message, isSuccess) {
        element.textContent = message;
        element.className = 'message ' + (isSuccess ? 'success' : 'error');
        element.style.display = 'block';
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000); // Hide after 5 seconds
    }

    function displayError(message) {
        errorMessageDiv.textContent = message;
        errorMessageDiv.style.display = 'block';
    }

    function hideError() {
        errorMessageDiv.style.display = 'none';
        errorMessageDiv.textContent = '';
    }

    // --- Process Question ---
    submitQuestionButton.addEventListener('click', async () => {
        const question = userQuestionInput.value.trim();
        if (!question) {
            displayError("请输入问题后再提交。");
            return;
        }

        hideError();
        loadingIndicator.style.display = 'block';
        jsonOutputPre.textContent = '正在处理...';
        outputPathSpan.textContent = 'N/A';

        try {
            const response = await fetch('/process_question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: question }),
            });

            loadingIndicator.style.display = 'none';
            const result = await response.json();

            if (result.success) {
                jsonOutputPre.textContent = JSON.stringify(result.data, null, 2);
                outputPathSpan.textContent = result.output_path || '保存失败';
                if(result.save_error){
                    displayMessage(errorMessageDiv, `JSON已生成，但保存到文件失败: ${result.save_error}`, false);
                }
            } else {
                displayError(`处理失败: ${result.error}`);
                jsonOutputPre.textContent = '处理失败。';
            }
        } catch (error) {
            loadingIndicator.style.display = 'none';
            displayError(`请求错误: ${error.message}`);
            jsonOutputPre.textContent = '请求错误。';
        }
    });

    // --- Template Management ---
    async function fetchTemplates() {
        try {
            const response = await fetch('/get_templates');
            const result = await response.json();
            if (result.success) {
                existingTemplatesSelect.innerHTML = '<option value="">选择一个模板查看...</option>'; // Clear existing
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
            // Validate JSON content locally before sending
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
                fetchTemplates(); // Refresh template list
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
                newTemplateContentTextarea.value = result.content; // Or pretty print: JSON.stringify(JSON.parse(result.content), null, 2)
                displayMessage(viewTemplateMessageDiv, `模板 '${result.filename}' 已加载到编辑区。`, true);
            } else {
                displayMessage(viewTemplateMessageDiv, `加载模板内容失败: ${result.error}`, false);
            }
        } catch (error) {
            displayMessage(viewTemplateMessageDiv, `请求模板内容错误: ${error.message}`, false);
        }
    });

    // --- Shutdown App ---
    shutdownAppButton.addEventListener('click', async () => {
        if (!confirm("确定要关闭应用程序吗？")) {
            return;
        }
        try {
            shutdownMessageDiv.textContent = "正在尝试关闭服务器...";
            shutdownMessageDiv.className = 'message';
            shutdownMessageDiv.style.display = 'block';

            await fetch('/shutdown', { method: 'POST' });
            // If successful, the server will stop, and further messages might not be displayed
            // or the browser might show a connection error page.
            shutdownMessageDiv.textContent = "关闭请求已发送。如果服务器仍在运行，请手动关闭。";
            shutdownMessageDiv.className = 'message success';
        } catch (error) {
            // This catch block might not be reached if the server shuts down before responding
            shutdownMessageDiv.textContent = `关闭请求失败或服务器未响应: ${error.message}`;
            shutdownMessageDiv.className = 'message error';
        }
    });


    // Initial load
    fetchTemplates();
});

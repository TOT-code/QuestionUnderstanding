# 问题理解与方面生成助手 - 完整使用指南

## 🎯 项目概述

这是一个基于AI的智能问题分析与知识方面生成工具，集成了先进的prompt处理系统，能够将用户的自然语言问题转换为结构化的知识框架，并生成严格控制的LLM提示词。

### 核心功能
1. **问题理解与分析** - 智能解析用户问题，识别领域和主题
2. **知识方面生成** - 基于问题生成多维度的知识分析框架
3. **Prompt模板系统** - 解决LLM不严格按照JSON回复的问题
4. **Web界面操作** - 用户友好的图形界面
5. **模板管理** - 支持自定义领域模板

## 🏗️ 系统架构

```
用户问题输入
    ↓
问题理解与分析 (LLM + 模板系统)
    ↓
生成结构化JSON数据
    ↓
Prompt处理器 (场景识别 + 模板选择)
    ↓
生成控制性提示词
    ↓
LLM严格按照JSON内容回复
```

## 📦 项目结构

```
QuestionUnderstanding/
├── 核心模块
│   ├── app.py                      # Flask Web应用主程序
│   ├── main_processor.py           # 核心问题处理逻辑
│   ├── llm_analyzer.py            # LLM分析器
│   ├── data_structures.py         # 数据结构定义
│   └── template_processor.py       # 模板处理器
│
├── Prompt处理系统
│   ├── prompt_processor.py         # 主prompt处理器
│   ├── scenario_detector.py        # 场景识别器
│   ├── template_loader.py          # 模板加载器
│   └── prompt_templates/           # Prompt模板库
│       ├── direct_answer_template.json
│       ├── guided_question_template.json
│       ├── knowledge_explain_template.json
│       └── compare_analysis_template.json
│
├── 领域模板
│   └── templates/                  # 领域专用模板
│       ├── communication_template.json
│       ├── radar_template.json
│       ├── electronics_template.json
│       └── ...
│
├── Web界面
│   ├── html_templates/index.html   # 主页面
│   └── static/
│       ├── style.css              # 样式文件
│       ├── script.js              # 主JavaScript逻辑
│       └── prompt-handler.js      # Prompt处理模块
│
├── 输出与测试
│   ├── output_json/               # JSON输出目录
│   ├── test_prompt_system.py      # 系统测试
│   └── prompt_usage_example.py    # 使用示例
│
└── 文档
    └── README.md                  # 项目说明文档
```

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Flask
- requests库
- DashScope API密钥（阿里云通义千问）

### 安装步骤

1. **克隆项目**
```bash
git clone <项目地址>
cd QuestionUnderstanding
```

2. **安装依赖**
```bash
pip install flask requests dashscope
```

3. **配置API密钥**
在 `llm_analyzer.py` 中设置您的DashScope API密钥：
```python
dashscope.api_key = "your-api-key-here"
```

4. **启动应用**
```bash
python app.py
```

5. **访问界面**
打开浏览器访问：`http://localhost:5001`

## 🎮 使用流程

### 第一步：问题分析
1. 在Web界面的"问题输入"区域输入您的问题
   - 例如："我想了解5G通信技术的原理"
   - 例如："什么是CFAR检测算法？"
   - 例如："Python的装饰器如何使用？"

2. 点击"开始分析"按钮

3. 系统将：
   - 识别问题的技术领域
   - 确定主要主题
   - 生成多个分析维度（facets）
   - 输出结构化的JSON数据

### 第二步：查看分析结果
分析完成后，您将看到：
- **结构化数据**：包含领域、主题、分析维度等信息
- **JSON树状视图**：可展开/折叠的层次结构
- **文件保存路径**：结果自动保存到 `output_json/` 目录

### 第三步：生成智能Prompt（解决LLM回复问题）
**✅ 已完成UI集成：Prompt功能直接集成到分析结果中**

分析完成后，系统会自动在结果卡片中显示"生成智能Prompt"区域，提供：

#### 快速生成功能
1. **输入具体问题**：在"您的具体问题"文本框中输入详细问题
2. **选择输出模式**：
   - **普通模式**：标准prompt生成
   - **严格控制模式**：确保LLM严格按照JSON内容回复
3. **场景类型选择**：
   - **自动识别**：系统智能判断最适合的场景
   - **直接回答**：获得具体问题的直接答案
   - **引导学习**：获得学习路径和引导问题
   - **详细解释**：获得深入的概念阐述
   - **对比分析**：获得多维度的比较分析

#### 智能功能
- **自动场景分析**：点击"智能分析场景"自动识别最适合的回复模式
- **高级选项**：支持从历史分析文件生成Prompt
- **实时编辑**：生成后可直接编辑Prompt内容
- **一键复制/下载**：便捷的结果处理

#### 使用步骤
1. 完成问题分析后，系统自动显示Prompt生成区域
2. 输入您的具体问题（系统会自动填充原始问题）
3. 选择合适的输出模式和场景类型
4. 点击"快速生成Prompt"
5. 查看生成结果，包括场景信息和置信度
6. 复制生成的Prompt到您的LLM对话中使用

**API调用方式（高级用户）：**
```python
import requests

# 生成prompt
prompt_response = requests.post('http://localhost:5001/generate_prompt', json={
    "json_data": json_data,
    "user_question": "您的具体问题",
    "output_format": "strict"  # 严格控制模式
})

prompt = prompt_response.json()["prompt"]
# 现在将这个prompt发送给LLM，获得严格按照JSON内容的回复
```

## 🎨 高级功能

### 1. 模板管理
- **上传自定义模板**：支持JSON格式的领域专用模板
- **模板验证**：自动检查模板格式的正确性
- **模板预览**：查看现有模板的结构和内容

### 2. Prompt场景识别
系统自动识别4种场景：
- **直接回答**：用户询问具体问题
- **引导学习**：用户表达学习兴趣但问题不具体
- **详细解释**：用户需要深入的概念阐述
- **对比分析**：用户需要多维度比较

### 3. JSON数据搜索
- **实时搜索**：在生成的JSON中搜索特定内容
- **高亮显示**：搜索结果自动高亮
- **导航功能**：快速跳转到搜索结果

## 📊 支持的领域

### 技术领域
- **通信工程**：5G、OFDM、信号处理
- **雷达技术**：相控阵、CFAR、信号检测
- **电子工程**：电路设计、器件特性
- **计算机科学**：算法、数据结构、编程语言

### 扩展支持
通过添加自定义模板，可以支持任何专业领域：
1. 在 `templates/` 目录下创建新的JSON模板
2. 定义该领域的特征关键词和分析维度
3. 重启应用自动加载新模板

## 🔧 API接口文档

### 核心分析接口

#### `/process_question` (POST)
分析用户问题并生成结构化数据

**请求：**
```json
{
    "question": "用户的问题"
}
```

**响应：**
```json
{
    "success": true,
    "data": {
        "original_question_cn": "原始问题",
        "main_topic_cn": "主要主题",
        "domain_cn": "技术领域",
        "potential_facets_cn": [...],  // 分析维度数组
        "processing_metadata": {...}   // 处理元数据
    },
    "output_path": "文件保存路径"
}
```

### Prompt处理接口

#### `/generate_prompt` (POST)
生成结构化prompt

**请求参数：**
```json
{
    "json_data": {...},                    // 分析得到的JSON数据
    "user_question": "用户的具体问题",      // 用户问题
    "scenario_hint": "direct_answer_v1",   // 可选：手动指定模板
    "output_format": "strict"              // 可选：strict/normal
}
```

**响应示例：**
```json
{
    "success": true,
    "prompt": "你是一位专业的电子工程领域专家...",
    "processing_info": {
        "scenario_type": "direct_answer",
        "confidence": 0.85,
        "template_id": "direct_answer_v1",
        "template_name": "直接回答模板"
    },
    "user_question": "什么是无人机飞行的基本原理？"
}
```

#### `/analyze_scenario` (POST)  
分析问题场景类型

#### `/get_prompt_templates` (GET)
获取可用的prompt模板

#### `/load_json_file` (POST)
加载已生成的JSON文件

#### `/get_output_files` (GET)
获取输出目录中的JSON文件列表

### 模板管理接口

#### `/upload_template` (POST)
上传自定义模板

#### `/get_templates` (GET)
获取领域模板列表

#### `/get_template_content` (GET)
获取指定模板内容

## 🎯 实际应用场景

### 1. 技术学习助手
- 输入技术概念，获得结构化学习路径
- 生成针对性的学习材料组织方式
- 提供深度学习的引导问题

### 2. 文档生成辅助
- 分析技术主题，生成文档大纲
- 确保内容覆盖的完整性和逻辑性
- 生成标准化的技术文档结构

### 3. LLM应用开发
- 解决LLM输出格式不可控的问题
- 生成结构化的prompt模板
- 确保AI回复的准确性和专业性

### 4. 知识管理系统
- 将非结构化问题转换为结构化知识框架
- 建立主题间的关联关系
- 支持知识图谱的构建

## 🔍 测试和调试

### 运行测试
```bash
# 测试整个系统
python test_prompt_system.py

# 测试API接口
python prompt_usage_example.py

# 测试模板功能
python test_new_templates.py
```

### 调试技巧
1. **查看日志**：在控制台观察处理过程
2. **检查输出**：查看 `output_json/` 目录中的文件
3. **验证模板**：使用模板验证功能检查格式
4. **场景测试**：使用不同类型的问题测试场景识别

## ⚙️ 配置说明

### LLM配置
在 `llm_analyzer.py` 中：
```python
# API配置
dashscope.api_key = "your-api-key"

# 模型参数
model_name = "qwen-plus"
temperature = 0.1
max_tokens = 2000
```

### 模板配置
在 `template_processor.py` 中：
```python
# 模板目录
TEMPLATES_DIR = "templates"

# 默认模板
DEFAULT_TEMPLATE_NAME = "generic_template.json"
```

### Prompt配置
在 `prompt_processor.py` 中可以调整：
- 场景识别阈值
- 模板选择逻辑
- 输出格式控制

## 🚨 已知问题与解决方案

### 1. ✅ Prompt生成功能（已修复）
**问题描述：**
- ~~原版本中动态添加的Prompt生成按钮无法正常工作~~

**解决方案：**
- ✅ **已采用方案B - UI集成**：将Prompt功能直接集成到分析结果卡片中
- ✅ **避免动态DOM操作**：所有UI元素在页面加载时就存在
- ✅ **改进用户体验**：分析完成后自动显示Prompt选项区域
- ✅ **增强功能**：提供快速生成、智能分析、高级选项等多种功能

**技术实现：**
- 使用 `integrated-prompt-handler.js` 替代原有的动态按钮添加方式
- HTML模板中预置完整的Prompt生成区域，初始隐藏
- 通过数据监听自动显示和填充，提供更流畅的用户体验

### 2. API连接问题
**问题**：无法连接到DashScope API
**解决**：
- 检查API密钥是否正确
- 确认网络连接正常
- 验证API额度是否充足

### 3. 模板加载失败
**问题**：自定义模板无法加载
**解决**：
- 检查JSON格式是否正确
- 确认必需字段是否完整
- 使用模板验证功能检查

### 4. 场景识别不准确
**问题**：Prompt场景识别错误
**解决**：
- 使用 `scenario_hint` 手动指定
- 调整问题表述方式
- 修改识别规则（需要代码修改）

### 5. 输出格式问题
**问题**：LLM仍然不按JSON内容回复
**解决**：
- 使用 `output_format: "strict"` 模式
- 检查生成的prompt是否完整
- 验证JSON数据的质量

## 🏆 最佳实践

### 1. 问题表述
- **具体明确**：避免过于宽泛的问题
- **包含领域信息**：有助于准确识别技术领域
- **使用专业术语**：提高分析的准确性

### 2. 模板设计
- **结构清晰**：遵循标准的JSON模板格式
- **关键词丰富**：包含领域特征词汇
- **维度完整**：覆盖该领域的主要分析角度

### 3. Prompt使用
- **选择合适场景**：根据用户意图选择正确的模板
- **使用严格模式**：对于重要应用使用strict输出格式
- **验证生成质量**：检查prompt的完整性和准确性

## 📈 扩展开发

### 添加新的技术领域
1. 创建领域专用模板文件
2. 定义领域特征关键词
3. 添加相应的分析维度
4. 测试和优化识别准确性

### 集成其他LLM
1. 修改 `llm_analyzer.py` 中的API调用
2. 调整prompt格式以适应不同LLM
3. 测试不同模型的兼容性

### 开发新的Prompt场景
1. 在 `prompt_templates/` 添加新模板
2. 在 `scenario_detector.py` 添加识别规则
3. 在 `prompt_processor.py` 添加处理逻辑

## 📞 技术支持

### 问题报告
如果您遇到问题，请提供：
1. 错误信息的完整日志
2. 重现问题的步骤
3. 使用的输入数据示例
4. 系统环境信息

### 常见错误排查
1. **查看控制台输出**：`python app.py` 的日志信息
2. **检查文件权限**：确保输出目录可写
3. **验证JSON格式**：使用在线JSON验证器
4. **测试API连接**：直接调用API接口测试

### 开发调试
```bash
# 启用调试模式
export FLASK_DEBUG=1
python app.py

# 查看详细日志
tail -f output_json/*.json
```

## 📋 更新日志

### 版本 1.3.0 (当前版本) - 2025/5/24
- ✅ **重大改进：采用方案B UI集成方式**
- ✅ **修复Prompt生成功能**：将Prompt功能直接集成到分析结果卡片中
- ✅ **改进用户体验**：分析完成后自动显示Prompt生成区域
- ✅ **增强功能完整性**：
  - 快速生成与高级选项
  - 智能场景分析
  - 实时编辑功能
  - 一键复制/下载
  - 字数统计与元数据显示
- ✅ **优化前端架构**：使用 `integrated-prompt-handler.js` 避免动态DOM操作
- ✅ **完善样式设计**：现代化UI设计，响应式布局，动画效果
- ✅ **提升稳定性**：消除前后端连接问题，确保功能可靠性

### 版本 1.2.0
- ✅ 集成Prompt生成系统
- ✅ 添加场景自动识别
- ✅ 支持多种输出格式
- ⚠️ 存在前端按钮功能问题（已在v1.3.0修复）

### 版本 1.1.0
- ✅ 添加JSON搜索功能
- ✅ 改进用户界面
- ✅ 增强模板管理

### 版本 1.0.0
- ✅ 基础问题分析功能
- ✅ 模板系统
- ✅ Web界面

---

## 🎉 核心价值

**本系统解决的关键问题：**
- ✅ **LLM输出控制**：确保AI严格按照结构化数据回复，不再自由发挥
- ✅ **智能问题分析**：自动识别技术领域和主题，生成全面的分析框架
- ✅ **场景自适应**：根据用户意图自动选择最合适的回复模式
- ✅ **专业知识组织**：将非结构化问题转化为结构化知识体系
- ✅ **可扩展架构**：支持新领域和新场景的快速集成

**这个系统将帮助您：**
- 🎯 确保LLM严格按照内容回复，提高回复质量
- 📊 将复杂问题分解为多个分析维度，全面理解
- 🔄 自动适配不同的用户需求和交互场景
- ⚙️ 通过模板系统轻松扩展到新的技术领域
- 🚀 提升AI应用的可控性、准确性和专业性

---

**🎉 恭喜！您现在已经掌握了这个强大的问题理解与prompt生成系统！**

**✅ 系统已完全集成：所有功能均已通过UI集成方式实现，确保稳定可靠的用户体验。**

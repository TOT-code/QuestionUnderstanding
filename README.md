# 问题理解与方面生成助手

## 项目原理说明 (How it Works)

本项目的核心目标是理解用户用自然语言提出的关于编程或科学领域的问题，并将其转化为一个结构化的JSON对象。这个JSON对象旨在帮助用户更清晰地梳理问题，并引导他们从不同方面深入了解相关知识点。

其工作流程主要包含以下几个步骤：

1. __用户输入 (User Input)__：

   - 系统通过一个简单的Web界面 (基于Flask) 接收用户用中文提出的自然语言问题。用户在界面上的文本框中输入问题并提交。
2. __核心主题识别与领域分类 (Topic & Domain Analysis - via LLM)__：

   - 用户的原始问题会被发送给一个大型语言模型（LLM），本项目当前配置为使用阿里云灵积平台（DashScope）的 `qwen-plus` 模型。
   - 通过精心设计的系统提示（System Prompt），引导LLM分析问题，并以JSON格式返回以下关键信息：

     - `main_topic_cn`: 核心主题（中文）。
     - `main_topic_en`: 核心主题（英文，可选）。
     - `domain_cn`: 主要领域（例如：“编程”、“科学”）。
     - `sub_domain_cn`: 更具体的子领域（例如：“Python”、“算法与数据结构”、“物理学-经典力学”）。
     - `confidence_score`: LLM对分析结果的置信度。
   - 这部分逻辑主要在 `llm_analyzer.py` 中实现，并通过 `app.py` 中的API端点调用。
3. __方面模板选择 (Facet Template Selection)__：

   - 系统维护一个方面模板库（存储在 `templates/` 目录下的JSON文件中）。每个模板针对某一类主题（如编程概念、算法、科学定律等）预定义了一组相关的知识“方面”（Facets）。
   - 根据LLM分析出的 `domain_cn` 和 `sub_domain_cn`，系统会从模板库中选择最匹配的方面模板。
   - 如果找不到精确匹配的模板，系统会尝试匹配更通用的领域模板，或者回退到一个默认的通用模板 (`generic_template.json`)。
   - 这部分逻辑主要在 `template_processor.py` 中的 `select_template_name` 函数实现。
4. __方面内容填充与适配 (Facet Population & Adaptation)__：

   - 选定模板后，系统会使用LLM识别出的 `main_topic_cn` 来填充模板中预设的占位符（如 `[主题]`）。
   - 这样，通用的方面名称、描述和示例问题就会被适配为针对当前具体主题的内容。
   - 例如，模板中的“`[主题]`的基本定义”会被填充为“Python装饰器的基本定义”。
   - 这部分逻辑主要在 `template_processor.py` 中的 `populate_facets` 函数实现。
5. __结构化JSON组装 (Structured JSON Assembly)__：

   - 将用户原始问题、LLM的分析结果（主题、领域等）、以及填充适配后的各个方面信息，组装成一个定义好的结构化JSON对象（遵循 `data_structures.py` 中 `StructuredQuery` 类的定义）。
   - 同时，系统还会根据生成的主题和方面，动态生成一些整体性的后续引导问题 (`suggested_overall_follow_ups_cn`)。
6. __输出与展示 (Output & Display)__：

   - 最终，系统将这个结构化的JSON对象返回给Web界面。
   - 界面上会展示生成的JSON内容，并告知用户该JSON已保存到服务器的 `output_json/` 目录下的一个文件中。
   - 核心处理逻辑的串联和最终对象的构建在 `main_processor.py` 中完成，由 `app.py` 调度。

## 项目文件结构简介：

- `app.py`: Flask Web应用的主文件，提供API接口和渲染前端页面。
- `main_processor.py`: 包含核心的问题处理逻辑函数 `process_user_question`。
- `llm_analyzer.py`: 负责与LLM API交互，进行问题分析和主题提取。
- `template_processor.py`: 负责加载、选择和填充方面模板。
- `data_structures.py`: 定义了项目中使用的核心数据结构，如 `StructuredQuery` 和 `PotentialFacet`。
- `html_templates/` (目录): 存放Flask应用的HTML模板文件。

  - `index.html`: 项目的前端主界面。
- `static/` (目录): 存放Web应用的静态文件。

  - `style.css`: 页面的CSS样式表。
  - `script.js`: 前端页面的JavaScript交互逻辑。
- `templates/` (目录): 存放JSON格式的方面模板文件 (注意与 `html_templates/` 区分)。

  - `python_concept_template.json`: 针对Python等编程语言概念的模板。
  - `algorithm_template.json`: 针对算法类主题的模板。
  - `generic_template.json`: 通用后备模板。
  - *(未来可以添加更多特定领域的模板)*
- `output_json/` (目录): 存放每次处理用户问题后生成的JSON文件。

---

## 使用说明 (Usage Guide)

1. __环境准备 (Prerequisites)__：

   - Python 3.7+
   - 安装必要的Python库：

     ```bash
     pip install openai Flask
     ```
     （`openai` 库用于与DashScope的OpenAI兼容模式API交互，`Flask` 用于构建Web界面）
2. __API密钥配置 (API Key Configuration)__：

   - 本项目使用阿里云灵积平台（DashScope）的LLM服务。您需要在 `llm_analyzer.py` 文件中配置您的API密钥。
   - 找到以下行并替换为您自己的密钥：

     ```python
     DASHSCOPE_API_KEY = "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" # 替换为您的DashScope API Key
     ```
   - __注意__：直接在代码中硬编码API密钥仅为演示方便，生产环境中强烈建议使用环境变量或其他安全方式管理密钥。例如，将密钥存储在名为 `DASHSCOPE_API_KEY` 的环境变量中，并在代码中通过 `os.getenv("DASHSCOPE_API_KEY")` 获取。
3. __运行程序 (Running the Program)__：

   - 启动Flask Web应用：

     ```bash
     python app.py
     ```
   - 应用启动后，通常会在终端显示类似 `* Running on http://127.0.0.1:5001/` 的信息。
   - 在您的网页浏览器中打开此地址 (例如 `http://127.0.0.1:5001/`)。
   - 您可以通过Web界面输入问题、上传模板、查看结果等。
   - 生成的JSON文件会自动保存在项目根目录下的 `output_json/` 文件夹中。
   - 可以通过界面上的“关闭应用”按钮（或在运行 `app.py` 的终端按 Ctrl+C）来停止Web服务器。
4. __命令行交互 (Legacy Command-Line Interaction)__：

   - 如果您仍希望通过命令行进行交互（不使用Web界面），可以运行 `main_processor.py`：

     ```bash
     python main_processor.py
     ```
   - 它会提示您输入问题，并将结果保存到 `output_json/` 目录。
5. __集成到其他应用 (Integration)__：

   - 如果您想在其他Python程序中调用本项目的核心逻辑，可以导入并使用 `main_processor.py` 中的 `process_user_question(user_question_string)` 函数。
   - 该函数会返回一个 `StructuredQuery` 对象（定义在 `data_structures.py` 中）。
   - 您可以使用 `dataclasses.asdict(structured_query_object)` 将其转换为字典，然后用 `json.dumps()` 序列化为JSON字符串。
6. __自定义与扩展 (Customization & Extension)__：

   - __添加/修改方面模板__：您可以在 `templates/` 目录下创建新的JSON模板文件，或修改现有模板。Web界面也提供了上传新模板的功能。
   - __调整模板选择逻辑__：可以在 `template_processor.py` 文件中的 `TEMPLATE_MAPPING` 字典中添加新的领域/子领域到模板文件的映射规则。
   - __优化LLM提示__：如果需要调整LLM的行为，可以修改 `llm_analyzer.py` 中的 `build_system_prompt()` 函数。
   - __更换LLM模型/提供商__：主要修改 `llm_analyzer.py` 中的客户端初始化和API调用部分。
   - __修改前端界面__：可以直接编辑 `html_templates/index.html`, `static/style.css`, 和 `static/script.js` 文件。
   - __扩展后端API__：可以在 `app.py` 中添加新的Flask路由和处理函数。

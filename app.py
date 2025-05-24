from flask import Flask, render_template, request, jsonify
import os
import json
from dataclasses import asdict

# 假设我们的处理逻辑在 main_processor.py 中
# 我们需要能够导入其中的 process_user_question 函数
# 以及 sanitize_filename (如果决定在app.py中处理文件名)
from main_processor import process_user_question, sanitize_filename, OUTPUT_DIR as MP_OUTPUT_DIR
from template_processor import TEMPLATES_DIR, DEFAULT_TEMPLATE_NAME # TEMPLATES_DIR is 'templates'

# 导入新的prompt处理功能
from prompt_processor import PromptProcessor

app = Flask(__name__, template_folder='html_templates') # 指定HTML模板文件夹

# 初始化prompt处理器
prompt_processor = PromptProcessor()

# 确保输出目录存在 (与main_processor.py中的逻辑类似，但Flask应用启动时也检查一下)
if not os.path.exists(MP_OUTPUT_DIR):
    os.makedirs(MP_OUTPUT_DIR)
    print(f"Flask App: 已创建输出目录: {MP_OUTPUT_DIR}")

# 确保模板目录存在
if not os.path.exists(TEMPLATES_DIR):
    os.makedirs(TEMPLATES_DIR)
    print(f"Flask App: 已创建方面模板目录: {TEMPLATES_DIR}")

@app.route('/')
def index():
    # 后续我们会在这里传递更多信息给模板，比如API配置、模板列表等
    return render_template('index.html', current_api="DashScope qwen-plus")

@app.route('/process_question', methods=['POST'])
def handle_process_question():
    try:
        data = request.get_json()
        user_question = data.get('question')
        if not user_question:
            return jsonify({"success": False, "error": "没有提供问题"}), 400

        result_obj = process_user_question(user_question) # 调用我们已有的核心逻辑
        result_dict = asdict(result_obj)

        # 保存到文件 (与main_processor.py中的逻辑类似)
        import time
        safe_filename_base = sanitize_filename(user_question)
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        output_filename = f"{safe_filename_base}_{timestamp}.json"
        output_path = os.path.join(MP_OUTPUT_DIR, output_filename)

        try:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(result_dict, f, ensure_ascii=False, indent=2)
            print(f"结果已保存到: {output_path}")
            return jsonify({"success": True, "data": result_dict, "output_path": output_path})
        except Exception as e:
            print(f"错误：无法保存结果到文件 {output_path}. 原因: {e}")
            # 即使保存失败，也尝试返回处理结果给前端
            return jsonify({"success": True, "data": result_dict, "output_path": None, "save_error": str(e)})

    except Exception as e:
        print(f"处理问题时发生错误: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# Prompt处理相关API
@app.route('/generate_prompt', methods=['POST'])
def generate_prompt():
    """生成prompt的API接口"""
    try:
        data = request.get_json()
        
        # 获取参数
        json_data = data.get('json_data')
        user_question = data.get('user_question')
        scenario_hint = data.get('scenario_hint')  # 可选
        output_format = data.get('output_format', 'normal')  # normal 或 strict
        
        if not json_data or not user_question:
            return jsonify({"success": False, "error": "缺少必要参数: json_data 和 user_question"}), 400
        
        # 如果json_data是字符串，尝试解析为dict
        if isinstance(json_data, str):
            try:
                json_data = json.loads(json_data)
            except json.JSONDecodeError:
                return jsonify({"success": False, "error": "json_data格式错误，无法解析"}), 400
        
        # 生成prompt
        if output_format == 'strict':
            prompt = prompt_processor.create_controlled_prompt(json_data, user_question, "strict")
            processing_info = {"output_format": "strict"}
        else:
            prompt, processing_info = prompt_processor.process_json_to_prompt(
                json_data, user_question, scenario_hint
            )
        
        return jsonify({
            "success": True,
            "prompt": prompt,
            "processing_info": processing_info,
            "user_question": user_question
        })
        
    except Exception as e:
        print(f"生成prompt时发生错误: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/load_json_file', methods=['POST'])
def load_json_file():
    """加载JSON文件的API接口"""
    try:
        data = request.get_json()
        file_path = data.get('file_path')
        
        if not file_path:
            return jsonify({"success": False, "error": "未提供文件路径"}), 400
        
        # 安全检查：确保文件在允许的目录内
        if not file_path.startswith(MP_OUTPUT_DIR):
            # 如果是相对路径，尝试拼接
            if not os.path.isabs(file_path):
                file_path = os.path.join(MP_OUTPUT_DIR, file_path)
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            return jsonify({"success": False, "error": f"文件不存在: {file_path}"}), 404
        
        # 读取JSON文件
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                json_data = json.load(f)
            
            return jsonify({
                "success": True,
                "json_data": json_data,
                "file_path": file_path
            })
            
        except json.JSONDecodeError as e:
            return jsonify({"success": False, "error": f"文件不是有效的JSON格式: {str(e)}"}), 400
            
    except Exception as e:
        print(f"加载JSON文件时发生错误: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/get_prompt_templates', methods=['GET'])
def get_prompt_templates():
    """获取prompt模板列表"""
    try:
        templates = prompt_processor.template_loader.list_available_templates()
        return jsonify({"success": True, "templates": templates})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/analyze_scenario', methods=['POST'])
def analyze_scenario():
    """分析用户问题的场景类型"""
    try:
        data = request.get_json()
        user_question = data.get('user_question')
        
        if not user_question:
            return jsonify({"success": False, "error": "未提供用户问题"}), 400
        
        # 分析场景
        analysis = prompt_processor.scenario_detector.analyze_user_intent(user_question)
        
        return jsonify({"success": True, "analysis": analysis})
        
    except Exception as e:
        print(f"分析场景时发生错误: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/get_output_files', methods=['GET'])
def get_output_files():
    """获取输出目录中的JSON文件列表"""
    try:
        if not os.path.exists(MP_OUTPUT_DIR):
            return jsonify({"success": True, "files": []})
        
        files = []
        for filename in os.listdir(MP_OUTPUT_DIR):
            if filename.endswith('.json'):
                file_path = os.path.join(MP_OUTPUT_DIR, filename)
                file_stat = os.stat(file_path)
                files.append({
                    "filename": filename,
                    "path": file_path,
                    "size": file_stat.st_size,
                    "modified": file_stat.st_mtime
                })
        
        # 按修改时间排序（最新的在前）
        files.sort(key=lambda x: x['modified'], reverse=True)
        
        return jsonify({"success": True, "files": files})
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/upload_template', methods=['POST'])
def handle_upload_template():
    try:
        data = request.get_json()
        filename = data.get('filename')
        content_str = data.get('content')

        if not filename or not content_str:
            return jsonify({"success": False, "error": "缺少文件名或模板内容"}), 400

        if not filename.endswith(".json"):
            return jsonify({"success": False, "error": "模板文件名必须以 .json 结尾"}), 400
        
        # 基本的文件名安全检查 (避免路径遍历等)
        if '/' in filename or '\\' in filename or '..' in filename:
            return jsonify({"success": False, "error": "模板文件名包含非法字符"}), 400

        try:
            # 校验内容是否为合法JSON
            json.loads(content_str) 
        except json.JSONDecodeError:
            return jsonify({"success": False, "error": "模板内容不是有效的JSON格式"}), 400

        template_path = os.path.join(TEMPLATES_DIR, filename)
        
        # 防止覆盖默认模板，除非明确允许 (这里简单地禁止)
        if filename == DEFAULT_TEMPLATE_NAME and os.path.exists(template_path):
             print(f"尝试覆盖默认模板 {DEFAULT_TEMPLATE_NAME}，已阻止。")
             # return jsonify({"success": False, "error": f"不允许覆盖默认模板 {DEFAULT_TEMPLATE_NAME}"}), 403

        with open(template_path, "w", encoding="utf-8") as f:
            f.write(content_str)
        
        print(f"新模板已保存: {template_path}")
        return jsonify({"success": True, "message": f"模板 '{filename}' 已成功上传并保存。", "template_path": template_path})

    except Exception as e:
        print(f"上传模板时发生错误: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# 获取模板列表的API
@app.route('/get_templates', methods=['GET'])
def get_templates_list():
    try:
        templates = [f for f in os.listdir(TEMPLATES_DIR) if f.endswith('.json')]
        return jsonify({"success": True, "templates": templates})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 获取指定模板内容的API
@app.route('/get_template_content', methods=['GET'])
def get_template_content():
    filename = request.args.get('filename')
    if not filename:
        return jsonify({"success": False, "error": "未提供文件名"}), 400
    
    if '/' in filename or '\\' in filename or '..' in filename: # 安全检查
        return jsonify({"success": False, "error": "文件名包含非法字符"}), 400

    template_path = os.path.join(TEMPLATES_DIR, filename)
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return jsonify({"success": True, "filename": filename, "content": content})
    except FileNotFoundError:
        return jsonify({"success": False, "error": f"模板文件 '{filename}' 未找到"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

# 简单的退出功能 (仅在开发服务器中有效)
def shutdown_server():
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        raise RuntimeError('Not running with the Werkzeug Server')
    func()

@app.route('/shutdown', methods=['POST'])
def shutdown():
    print("服务器准备关闭...")
    shutdown_server()
    return '服务器正在关闭...'

if __name__ == '__main__':
    # 注意：Flask的 `templates` 文件夹是默认的HTML模板路径。
    # 我们的方面模板在 `TEMPLATES_DIR` (即 "templates")，这可能会引起混淆。
    # 为了清晰，可以考虑将Flask的HTML模板放到一个名为 `html_templates` 的文件夹，
    # 然后在 Flask 初始化时指定 `Flask(__name__, template_folder='html_templates')`
    # 但为了简单起见，如果 `index.html` 直接放在项目根目录的 `templates` 文件夹下，Flask也能找到。
    # 这里我们假设 `index.html` 会在 `html_templates` 文件夹下。
    
    flask_html_templates_dir = "html_templates" # 已更新为新的HTML模板目录
    if not os.path.exists(flask_html_templates_dir):
        os.makedirs(flask_html_templates_dir)
        print(f"Flask App: 已创建HTML模板目录: {flask_html_templates_dir}")

    print("成功加载Prompt处理器，支持以下功能:")
    print("- /generate_prompt: 生成结构化prompt")
    print("- /load_json_file: 加载JSON文件")
    print("- /get_prompt_templates: 获取prompt模板列表")
    print("- /analyze_scenario: 分析用户问题场景")
    print("- /get_output_files: 获取输出文件列表")

    app.run(debug=True, port=5001) # 使用一个非默认端口，以防冲突

import json
from typing import Dict, Optional, Any # Added Any
from openai import OpenAI
import os

# DashScope API Credentials
# 更好的做法: os.environ.get("DASHSCOPE_API_KEY")
DASHSCOPE_API_KEY = "sk-8f6c94372d804ceca9dd394cc98ee2e4" # 您提供的API Key
DASHSCOPE_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"

client = OpenAI(
  base_url=DASHSCOPE_BASE_URL,
  api_key=DASHSCOPE_API_KEY,
)

DEFAULT_LLM_RESPONSE = {
    "main_topic_cn": "无法识别主题",
    "main_topic_en": "Topic Not Identified",
    "domain_cn": "通用",
    "sub_domain_cn": "通用",
    "confidence_score": 0.10
}

def build_system_prompt() -> str:
    # 适配DashScope JSON模式的系统提示
    # 确保提示词中包含 "JSON" 字样，并指导模型输出JSON
    # 提供清晰的字段说明和示例
    
    # 预定义示例响应（用于few-shot提示）
    example1_response_json_str = json.dumps({
        "main_topic_cn": "Python 装饰器",
        "main_topic_en": "Python Decorators",
        "domain_cn": "编程",
        "sub_domain_cn": "Python",
        "confidence_score": 0.95
    }, ensure_ascii=False)

    example2_response_json_str = json.dumps({
        "main_topic_cn": "牛顿第一定律",
        "main_topic_en": "Newton's First Law of Motion",
        "domain_cn": "科学",
        "sub_domain_cn": "物理学-经典力学",
        "confidence_score": 0.98
    }, ensure_ascii=False)

    # 新增通信和雷达领域的示例响应
    example3_response_json_str = json.dumps({
        "main_topic_cn": "OFDM调制技术",
        "main_topic_en": "OFDM Modulation",
        "domain_cn": "电子工程",
        "sub_domain_cn": "通信算法",
        "confidence_score": 0.93
    }, ensure_ascii=False)

    example4_response_json_str = json.dumps({
        "main_topic_cn": "CFAR检测算法",
        "main_topic_en": "CFAR Detection Algorithm",
        "domain_cn": "电子工程",
        "sub_domain_cn": "雷达信号处理",
        "confidence_score": 0.92
    }, ensure_ascii=False)

    system_prompt = f"""你是一个智能助手，负责分析用户关于编程、科学和电子工程领域的提问。
你的任务是从用户的提问中识别出核心主题，并将其分类到一个合适的领域和子领域。
请严格以JSON格式输出分析结果。

我们主要关注以下领域：
- 编程 (Programming)
  - 子领域示例: Python, Java, JavaScript, C++, 算法与数据结构, Web开发, 机器学习库, 数据库, 操作系统, 计算机网络等。
- 科学 (Science)
  - 子领域示例: 物理学 (经典力学, 电磁学, 量子力学, 相对论, 天体物理), 化学 (有机化学, 无机化学, 物理化学), 生物学 (细胞生物学, 遗传学, 生态学, 生理学), 地球科学, 数学等。
- 电子工程 (Electronics Engineering)
  - 子领域示例: 通信算法 (OFDM, MIMO, Turbo码, LDPC码, 调制解调), 雷达信号处理 (脉冲压缩, CFAR检测, 目标跟踪, 波束形成), 数字信号处理, 射频电路设计等。

输出的JSON对象必须包含以下字段：
- "main_topic_cn": 字符串类型，识别出的核心主题（中文）。
- "main_topic_en": 字符串类型，核心主题的英文翻译（如果适用且能判断，若不能则为空字符串 ""）。
- "domain_cn": 字符串类型，主要领域（例如："编程", "科学" 或 "电子工程"）。
- "sub_domain_cn": 字符串类型，更具体的子领域（例如："Python", "算法与数据结构", "物理学-经典力学", "通信算法", "雷达信号处理"）。
- "confidence_score": 浮点数类型，你对这个分析结果的置信度 (0.0 - 1.0)，请尽量评估。

以下是一些示例，请学习并遵循此JSON格式：

Q: "我想了解一下Python的装饰器"
A: {example1_response_json_str}

Q: "牛顿第一定律讲的是啥？"
A: {example2_response_json_str}

Q: "OFDM调制技术的原理是什么？"
A: {example3_response_json_str}

Q: "CFAR检测算法如何工作？"
A: {example4_response_json_str}
"""
    return system_prompt

def analyze_question_with_llm(user_question: str) -> Dict[str, Optional[any]]:
    """
    调用DashScope LLM API来分析用户问题。
    """
    print(f"正在使用DashScope LLM分析用户提问: \"{user_question}\"")
    
    system_prompt_content = build_system_prompt()

    try:
        completion = client.chat.completions.create(
            model="qwen-plus", # 使用DashScope推荐的模型
            messages=[
                {
                    "role": "system",
                    "content": system_prompt_content
                },
                {
                    "role": "user",
                    "content": f"Q: \"{user_question}\"\nA:" # 遵循示例的Q/A格式
                }
            ],
            response_format={"type": "json_object"}, # 关键参数，确保返回JSON
            temperature=0.2, 
            max_tokens=300 # 适当增加max_tokens以容纳JSON输出和可能的少量额外文本
        )
        
        llm_response_content = completion.choices[0].message.content
        print(f"LLM原始JSON响应: {llm_response_content}")

        # DashScope在json_object模式下应该直接返回合法的JSON字符串
        try:
            response_data = json.loads(llm_response_content)
            # 确保关键字段存在
            if not all(key in response_data for key in ["main_topic_cn", "domain_cn", "sub_domain_cn"]):
                print("错误: LLM响应的JSON缺少必要字段。使用默认响应。")
                response_data = DEFAULT_LLM_RESPONSE.copy()
            
            # 确保可选字段存在或有默认值
            if "confidence_score" not in response_data or not isinstance(response_data["confidence_score"], (float, int)):
                response_data["confidence_score"] = response_data.get("confidence_score", 0.5) 
            if "main_topic_en" not in response_data:
                response_data["main_topic_en"] = ""

            print(f"LLM解析后的分析结果: {response_data}")
            return response_data
        except json.JSONDecodeError as e:
            print(f"错误：无法解析LLM响应中的JSON: {llm_response_content}. 错误: {e}. 使用默认响应。")
            return DEFAULT_LLM_RESPONSE.copy()

    except Exception as e:
        print(f"调用DashScope LLM API时发生错误: {e}")
        return DEFAULT_LLM_RESPONSE.copy()

def perform_deep_analysis_with_llm(master_prompt: str) -> Dict[str, Any]:
    """
    使用主分析指令调用LLM进行深度分析。
    :param master_prompt: 包含所有方面分析要求的主指令。
    :return: LLM返回的深度分析结果。
    """
    print(f"正在使用DashScope LLM进行深度分析...")
    
    try:
        completion = client.chat.completions.create(
            model="qwen-max", # 使用更强大的模型进行深度分析
            messages=[
                {
                    "role": "system",
                    "content": "你是一位资深的领域专家和技术作家，擅长对复杂主题进行深入、全面且结构清晰的分析。请严格按照用户提供的分析指令进行作答。"
                },
                {
                    "role": "user",
                    "content": master_prompt
                }
            ],
            # 深度分析可能不需要严格的JSON输出，而是结构化的文本
            # response_format={"type": "text"}, 
            temperature=0.5, # 允许一定的创造性，但保持准确性
            max_tokens=3000, # 深度分析需要更多token
            top_p=0.9
        )
        
        llm_response_content = completion.choices[0].message.content
        print(f"LLM深度分析原始响应: {llm_response_content[:500]}...") # 打印部分响应

        # 这里假设LLM会按照指令返回结构化的文本
        # 后续可能需要解析这个文本来填充到各个方面
        # 目前简单返回整个文本
        return {"deep_analysis_text": llm_response_content}

    except Exception as e:
        print(f"调用DashScope LLM API进行深度分析时发生错误: {e}")
        return {"deep_analysis_text": f"深度分析失败: {e}"}

if __name__ == '__main__':
    test_questions = [
        "我想了解一下Python的装饰器",
        "牛顿第一定律讲的是啥？",
        "什么是宇宙大爆炸理论？" 
    ]

    # 提示用户API Key已硬编码
    print(f"提示: DashScope API Key ({DASHSCOPE_API_KEY[:10]}...) 已在 llm_analyzer.py 文件中硬编码。\n")

    for q in test_questions:
        analysis_result = analyze_question_with_llm(q)
        print(f"用户提问: {q}")
        print(f"最终分析结果: {json.dumps(analysis_result, ensure_ascii=False, indent=2)}\n")

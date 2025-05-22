import json
import os
from typing import List, Dict, Any
from data_structures import PotentialFacet # 确保data_structures.py在PYTHONPATH中

TEMPLATES_DIR = "templates"
DEFAULT_TEMPLATE_NAME = "generic_template.json"

# 模板映射配置
# 键是 (domain_cn, sub_domain_cn) 元组，值是模板文件名
# 使用 None 表示任意子领域
TEMPLATE_MAPPING = {
    ("编程", "Python"): "python_concept_template.json",
    ("编程", "算法与数据结构"): "algorithm_template.json",
    ("编程", None): "python_concept_template.json", # 通用编程概念也先用python的模板
    ("科学", "物理学-经典力学"): "physics_law_template.json", # 假设我们未来会创建这个
    ("科学", "生物学"): "biology_process_template.json", # 假设我们未来会创建这个
    ("科学", None): "science_generic_template.json" # 假设我们未来会创建这个
}

def load_facet_template(template_name: str) -> List[Dict[str, Any]]:
    """从指定名称的JSON文件加载方面模板"""
    template_path = os.path.join(TEMPLATES_DIR, template_name)
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            template_data = json.load(f)
        return template_data
    except FileNotFoundError:
        print(f"警告：模板文件 {template_path} 未找到。")
        # 如果特定模板找不到，尝试加载默认通用模板
        if template_name != DEFAULT_TEMPLATE_NAME:
            print(f"尝试加载默认模板: {DEFAULT_TEMPLATE_NAME}")
            return load_facet_template(DEFAULT_TEMPLATE_NAME)
    except json.JSONDecodeError:
        print(f"错误：无法解析模板文件 {template_path}。")
    return [] # 返回空列表表示加载失败

def select_template_name(domain_cn: str, sub_domain_cn: str) -> str:
    """根据领域和子领域选择合适的模板文件名"""
    # 优先匹配 (domain, sub_domain)
    template_name = TEMPLATE_MAPPING.get((domain_cn, sub_domain_cn))
    if template_name:
        return template_name
    
    # 其次匹配 (domain, None) 作为该领域的通用模板
    template_name = TEMPLATE_MAPPING.get((domain_cn, None))
    if template_name:
        return template_name
        
    # 最后返回默认模板
    return DEFAULT_TEMPLATE_NAME

def populate_facets(main_topic_cn: str, llm_domain_info: Dict[str, Any]) -> List[PotentialFacet]:
    """
    根据LLM分析结果选择模板并填充方面。
    :param main_topic_cn: LLM识别出的核心主题。
    :param llm_domain_info: LLM返回的包含domain_cn和sub_domain_cn的字典。
    :return: 填充后的PotentialFacet列表。
    """
    domain_cn = llm_domain_info.get("domain_cn", "通用")
    sub_domain_cn = llm_domain_info.get("sub_domain_cn", "通用")

    selected_template_file = select_template_name(domain_cn, sub_domain_cn)
    print(f"为主题 '{main_topic_cn}' (领域: {domain_cn}, 子领域: {sub_domain_cn}) 选择模板: {selected_template_file}")
    
    template_facets_data = load_facet_template(selected_template_file)
    if not template_facets_data: # 如果加载失败或模板为空
        # 尝试加载最通用的模板作为最后的备用
        print(f"警告：选定模板 {selected_template_file} 加载失败或为空，尝试加载最通用模板 {DEFAULT_TEMPLATE_NAME}")
        template_facets_data = load_facet_template(DEFAULT_TEMPLATE_NAME)
        if not template_facets_data:
             print(f"错误：最通用模板 {DEFAULT_TEMPLATE_NAME} 也加载失败或为空。无法生成方面。")
             return []


    populated_facets_list: List[PotentialFacet] = []
    for facet_data in template_facets_data:
        facet_name = facet_data.get("facet_name_cn_template", "[方面名称]").replace("[主题]", main_topic_cn)
        facet_desc = facet_data.get("facet_description_cn_template", "关于[主题]的[方面名称]的描述。").replace("[主题]", main_topic_cn).replace("[方面名称]", facet_name)
        
        example_questions = []
        for q_template in facet_data.get("example_question_templates", []):
            question = q_template.replace("[主题]", main_topic_cn).replace("[方面名称]", facet_name)
            example_questions.append(question)
            
        keywords = facet_data.get("base_keywords", []) + [main_topic_cn] # 简单地将主题词加入关键词

        populated_facets_list.append(
            PotentialFacet(
                facet_id=facet_data.get("facet_id", "unknown_facet"),
                facet_name_cn=facet_name,
                facet_description_cn=facet_desc,
                example_questions_cn=example_questions,
                keywords_cn=list(set(keywords)) # 去重
            )
        )
    return populated_facets_list

if __name__ == '__main__':
    # 测试
    mock_llm_output_decorator = {
        "main_topic_cn": "Python 装饰器",
        "main_topic_en": "Python Decorators",
        "domain_cn": "编程",
        "sub_domain_cn": "Python",
        "confidence_score": 0.95
    }
    facets_decorator = populate_facets(mock_llm_output_decorator["main_topic_cn"], mock_llm_output_decorator)
    print(f"\n--- 针对 '{mock_llm_output_decorator['main_topic_cn']}' 生成的方面 ---")
    for facet in facets_decorator:
        print(json.dumps(facet.__dict__, ensure_ascii=False, indent=2))

    mock_llm_output_algorithm = {
        "main_topic_cn": "快速排序",
        "main_topic_en": "Quicksort",
        "domain_cn": "编程",
        "sub_domain_cn": "算法与数据结构",
        "confidence_score": 0.92
    }
    facets_algorithm = populate_facets(mock_llm_output_algorithm["main_topic_cn"], mock_llm_output_algorithm)
    print(f"\n--- 针对 '{mock_llm_output_algorithm['main_topic_cn']}' 生成的方面 ---")
    for facet in facets_algorithm:
        print(json.dumps(facet.__dict__, ensure_ascii=False, indent=2))

    mock_llm_output_unknown = {
        "main_topic_cn": "火星移民",
        "main_topic_en": "Mars Colonization",
        "domain_cn": "未知领域", # 模拟LLM无法准确分类
        "sub_domain_cn": "未来科技",
        "confidence_score": 0.7
    }
    facets_unknown = populate_facets(mock_llm_output_unknown["main_topic_cn"], mock_llm_output_unknown)
    print(f"\n--- 针对 '{mock_llm_output_unknown['main_topic_cn']}' 生成的方面 ---")
    for facet in facets_unknown:
        print(json.dumps(facet.__dict__, ensure_ascii=False, indent=2))

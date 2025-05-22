import json
import os
import re
import time
from typing import List
from dataclasses import asdict

from data_structures import StructuredQuery, PotentialFacet
from llm_analyzer import analyze_question_with_llm
from template_processor import populate_facets

OUTPUT_DIR = "output_json"

def generate_suggested_follow_ups(main_topic_cn: str, facets: List[PotentialFacet]) -> List[str]:
    """根据主题和已生成的方面，动态生成一些整体的后续引导问题。"""
    follow_ups = []
    if not facets:
        follow_ups.append(f"您想了解关于“{main_topic_cn}”的哪些具体内容？")
        return follow_ups

    follow_ups.append(f"关于“{main_topic_cn}”，您想先了解哪个方面？")
    
    if len(facets) >= 2:
        options = "、".join([f"“{f.facet_name_cn}”" for f in facets[:2]])
        if len(facets) > 2:
            options += "等"
        follow_ups.append(f"例如：{options}方面的内容？")
    elif facets:
        follow_ups.append(f"例如：“{facets[0].facet_name_cn}”方面的内容？")
        
    follow_ups.append(f"或者，您有其他关于“{main_topic_cn}”的具体问题吗？")
    return follow_ups

def process_user_question(user_question: str) -> StructuredQuery:
    """
    处理用户提问的完整流程。
    """
    print(f"\n>> 开始处理用户提问: \"{user_question}\"")

    llm_analysis_result = analyze_question_with_llm(user_question)
    
    main_topic_cn = llm_analysis_result.get("main_topic_cn", "未知主题")
    main_topic_en = llm_analysis_result.get("main_topic_en")
    domain_cn = llm_analysis_result.get("domain_cn", "通用")
    sub_domain_cn = llm_analysis_result.get("sub_domain_cn", "通用")
    llm_confidence = llm_analysis_result.get("confidence_score")

    populated_facets = populate_facets(main_topic_cn, llm_analysis_result)
    suggested_follow_ups = generate_suggested_follow_ups(main_topic_cn, populated_facets)

    structured_query_output = StructuredQuery(
        original_question_cn=user_question,
        main_topic_cn=main_topic_cn,
        main_topic_en=main_topic_en,
        domain_cn=domain_cn,
        sub_domain_cn=sub_domain_cn,
        potential_facets_cn=populated_facets,
        suggested_overall_follow_ups_cn=suggested_follow_ups,
        llm_confidence_score=llm_confidence
    )
    
    print(f"<< 处理完成。")
    return structured_query_output

def sanitize_filename(filename: str) -> str:
    """清理字符串以用作文件名。"""
    # 移除或替换不安全字符
    filename = re.sub(r'[<>:"/\\|?*\s]', '_', filename)
    # 限制长度
    return filename[:100] 

if __name__ == '__main__':
    # 确保输出目录存在
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"已创建输出目录: {OUTPUT_DIR}")

    print("欢迎使用问题理解助手！")
    print("请输入您的问题。输入 'exit' 或 'quit' 退出程序。")

    while True:
        user_input = input("\n您的问题是 (输入 'q', 'exit' 或 'quit' 退出): ").strip()

        if user_input.lower() in ['exit', 'quit', 'q']:
            print("感谢使用，再见！")
            break
        
        if not user_input:
            continue

        result_obj = process_user_question(user_input)
        
        # 将结果保存到JSON文件
        # 使用问题的前几个词和时间戳生成文件名，以避免冲突和过长文件名
        safe_filename_base = sanitize_filename(user_input)
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        output_filename = f"{safe_filename_base}_{timestamp}.json"
        output_path = os.path.join(OUTPUT_DIR, output_filename)

        try:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(asdict(result_obj), f, ensure_ascii=False, indent=2)
            print(f"结果已保存到: {output_path}")
        except Exception as e:
            print(f"错误：无法保存结果到文件 {output_path}. 原因: {e}")
        
        print("-" * 60)

from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class PotentialFacet:
    """代表一个潜在的知识方面"""
    facet_id: str  # 方面的唯一标识符，例如："definition_what_it_is"
    facet_name_cn: str  # 方面名称（中文），例如："基本定义与用途"
    facet_description_cn: str  # 该方面的简要描述（中文）
    example_questions_cn: List[str] = field(default_factory=list)  # 针对这个方面的示例提问
    keywords_cn: List[str] = field(default_factory=list)  # 与该方面相关的中文关键词

@dataclass
class StructuredQuery:
    """代表最终输出的完整结构化JSON对象"""
    original_question_cn: str  # 用户原始提问（中文）
    main_topic_cn: str  # 核心主题（中文）
    domain_cn: str  # 主要领域（例如："编程" 或 "科学"）
    sub_domain_cn: str  # 更具体的子领域（例如："Python", "算法与数据结构"）
    potential_facets_cn: List[PotentialFacet] = field(default_factory=list)  # 潜在的知识方面列表
    suggested_overall_follow_ups_cn: List[str] = field(default_factory=list)  # 基于所有方面生成的总体引导问题
    main_topic_en: Optional[str] = None  # 核心主题的英文翻译（可选）
    llm_confidence_score: Optional[float] = None # LLM分析的置信度（可选）

if __name__ == '__main__':
    # 示例用法
    facet1 = PotentialFacet(
        facet_id="definition",
        facet_name_cn="基本定义",
        facet_description_cn="解释这个概念是什么。",
        example_questions_cn=["什么是[主题]？"],
        keywords_cn=["定义", "概念"]
    )

    structured_query_example = StructuredQuery(
        original_question_cn="我想了解一下Python的装饰器",
        main_topic_cn="Python 装饰器",
        main_topic_en="Python Decorators",
        domain_cn="编程",
        sub_domain_cn="Python",
        potential_facets_cn=[facet1],
        suggested_overall_follow_ups_cn=["您想先了解哪个方面？"]
    )

    import json
    # dataclasses 通常需要一个辅助函数来转换为JSON，或者使用 asdict
    from dataclasses import asdict
    print(json.dumps(asdict(structured_query_example), ensure_ascii=False, indent=2))

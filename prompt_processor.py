#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prompt处理器 - 中间处理层
将JSON数据转换为具有指导性的prompt，确保LLM严格按照内容回复
"""

import json
from typing import Dict, List, Optional, Any, Tuple
from template_loader import TemplateLoader
from scenario_detector import ScenarioDetector, ScenarioType

class PromptProcessor:
    """Prompt处理器主类"""
    
    def __init__(self, templates_dir: str = "prompt_templates"):
        """
        初始化Prompt处理器
        
        Args:
            templates_dir: 模板目录路径
        """
        self.template_loader = TemplateLoader(templates_dir)
        self.scenario_detector = ScenarioDetector()
        
    def process_json_to_prompt(self, 
                              json_data: Dict[str, Any], 
                              user_question: str,
                              scenario_hint: Optional[str] = None) -> Tuple[str, Dict[str, Any]]:
        """
        将JSON数据转换为具有指导性的prompt
        
        Args:
            json_data: 项目输出的JSON数据
            user_question: 用户的问题
            scenario_hint: 场景提示（可选）
            
        Returns:
            生成的prompt和处理信息的元组
        """
        # 识别场景
        if scenario_hint:
            # 如果提供了场景提示，直接使用
            template_id = scenario_hint
            scenario_type = ScenarioType.DIRECT_ANSWER  # 默认值
            confidence = 1.0
        else:
            # 自动识别场景
            scenario_type, confidence = self.scenario_detector.detect_scenario(user_question)
            template_id = self.scenario_detector.get_template_id_for_scenario(scenario_type)
        
        # 获取模板
        template = self.template_loader.get_template(template_id)
        if not template:
            raise ValueError(f"模板 {template_id} 不存在")
        
        # 根据场景类型生成不同的prompt
        if scenario_type == ScenarioType.DIRECT_ANSWER:
            prompt = self._generate_direct_answer_prompt(template, json_data, user_question)
        elif scenario_type == ScenarioType.GUIDED_QUESTION:
            prompt = self._generate_guided_question_prompt(template, json_data, user_question)
        elif scenario_type == ScenarioType.KNOWLEDGE_EXPLAIN:
            prompt = self._generate_knowledge_explain_prompt(template, json_data, user_question)
        elif scenario_type == ScenarioType.COMPARE_ANALYSIS:
            prompt = self._generate_compare_analysis_prompt(template, json_data, user_question)
        else:
            # 默认使用直接回答模板
            direct_template = self.template_loader.get_template("direct_answer_v1")
            prompt = self._generate_direct_answer_prompt(direct_template, json_data, user_question)
        
        # 处理信息
        processing_info = {
            'scenario_type': scenario_type.value if hasattr(scenario_type, 'value') else str(scenario_type),
            'confidence': confidence,
            'template_id': template_id,
            'template_name': template.get('template_name', ''),
            'facets_used': len(json_data.get('potential_facets_cn', [])),
            'processing_success': True
        }
        
        return prompt, processing_info
    
    def _generate_direct_answer_prompt(self, template: Dict, json_data: Dict, user_question: str) -> str:
        """生成直接回答类型的prompt"""
        # 找到最相关的facet
        best_facet = self._find_best_matching_facet(json_data, user_question)
        
        if not best_facet:
            best_facet = json_data.get('potential_facets_cn', [{}])[0]
        
        # 填充模板
        prompt_template = template.get('prompt_template', '')
        
        filled_prompt = prompt_template.format(
            domain_cn=json_data.get('domain_cn', '未知领域'),
            main_topic_cn=json_data.get('main_topic_cn', '未知主题'),
            user_question=user_question,
            facet_name_cn=best_facet.get('facet_name_cn', '相关知识'),
            facet_description_cn=best_facet.get('facet_description_cn', '相关描述'),
            keywords_cn='、'.join(best_facet.get('keywords_cn', [])),
            example_questions_cn='\n   - '.join(best_facet.get('example_questions_cn', []))
        )
        
        return filled_prompt
    
    def _generate_guided_question_prompt(self, template: Dict, json_data: Dict, user_question: str) -> str:
        """生成引导提问类型的prompt"""
        # 格式化所有facets
        facets_list = self._format_facets_for_guidance(json_data.get('potential_facets_cn', []))
        
        prompt_template = template.get('prompt_template', '')
        
        filled_prompt = prompt_template.format(
            domain_cn=json_data.get('domain_cn', '未知领域'),
            sub_domain_cn=json_data.get('sub_domain_cn', '通用'),
            main_topic_cn=json_data.get('main_topic_cn', '未知主题'),
            facets_list=facets_list
        )
        
        return filled_prompt
    
    def _generate_knowledge_explain_prompt(self, template: Dict, json_data: Dict, user_question: str) -> str:
        """生成知识解释类型的prompt"""
        # 选择最适合详细解释的facet
        target_facet = self._select_facet_for_explanation(json_data, user_question)
        
        if not target_facet:
            target_facet = json_data.get('potential_facets_cn', [{}])[0]
        
        prompt_template = template.get('prompt_template', '')
        
        filled_prompt = prompt_template.format(
            domain_cn=json_data.get('domain_cn', '未知领域'),
            main_topic_cn=json_data.get('main_topic_cn', '未知主题'),
            facet_name_cn=target_facet.get('facet_name_cn', '相关知识'),
            facet_description_cn=target_facet.get('facet_description_cn', '相关描述'),
            keywords_cn='、'.join(target_facet.get('keywords_cn', [])),
            example_questions_cn='\n   - '.join(target_facet.get('example_questions_cn', []))
        )
        
        return filled_prompt
    
    def _generate_compare_analysis_prompt(self, template: Dict, json_data: Dict, user_question: str) -> str:
        """生成对比分析类型的prompt"""
        # 选择用于对比的facets（通常选择前3-4个）
        selected_facets = self._select_facets_for_comparison(json_data)
        formatted_facets = self._format_facets_for_comparison(selected_facets)
        
        prompt_template = template.get('prompt_template', '')
        
        filled_prompt = prompt_template.format(
            domain_cn=json_data.get('domain_cn', '未知领域'),
            sub_domain_cn=json_data.get('sub_domain_cn', '通用'),
            main_topic_cn=json_data.get('main_topic_cn', '未知主题'),
            selected_facets=formatted_facets
        )
        
        return filled_prompt
    
    def _find_best_matching_facet(self, json_data: Dict, user_question: str) -> Optional[Dict]:
        """找到与用户问题最匹配的facet"""
        facets = json_data.get('potential_facets_cn', [])
        if not facets:
            return None
        
        # 简单的关键词匹配算法
        best_facet = None
        best_score = 0
        
        user_question_lower = user_question.lower()
        
        for facet in facets:
            score = 0
            
            # 检查facet名称匹配
            facet_name = facet.get('facet_name_cn', '').lower()
            if any(word in facet_name for word in user_question_lower.split()):
                score += 3
            
            # 检查关键词匹配
            keywords = facet.get('keywords_cn', [])
            for keyword in keywords:
                if keyword.lower() in user_question_lower:
                    score += 2
            
            # 检查示例问题匹配
            example_questions = facet.get('example_questions_cn', [])
            for question in example_questions:
                question_words = set(question.lower().split())
                user_words = set(user_question_lower.split())
                common_words = question_words.intersection(user_words)
                score += len(common_words)
            
            if score > best_score:
                best_score = score
                best_facet = facet
        
        return best_facet
    
    def _format_facets_for_guidance(self, facets: List[Dict]) -> str:
        """为引导提问格式化facets"""
        if not facets:
            return "暂无可用的学习维度"
        
        formatted_list = []
        for i, facet in enumerate(facets, 1):
            facet_name = facet.get('facet_name_cn', f'维度{i}')
            facet_desc = facet.get('facet_description_cn', '无描述')
            keywords = '、'.join(facet.get('keywords_cn', [])[:3])  # 只显示前3个关键词
            
            formatted_item = f"{i}. **{facet_name}**\n   描述：{facet_desc}\n   关键词：{keywords}"
            formatted_list.append(formatted_item)
        
        return '\n\n'.join(formatted_list)
    
    def _select_facet_for_explanation(self, json_data: Dict, user_question: str) -> Optional[Dict]:
        """选择最适合详细解释的facet"""
        # 对于知识解释，优先选择基础概念相关的facet
        facets = json_data.get('potential_facets_cn', [])
        
        # 首先尝试找到基础概念相关的facet
        basic_keywords = ['基本', '概念', '原理', '定义', '基础']
        for facet in facets:
            facet_name = facet.get('facet_name_cn', '').lower()
            if any(keyword in facet_name for keyword in basic_keywords):
                return facet
        
        # 如果没有基础概念facet，使用最匹配的facet
        return self._find_best_matching_facet(json_data, user_question)
    
    def _select_facets_for_comparison(self, json_data: Dict) -> List[Dict]:
        """选择用于对比分析的facets"""
        facets = json_data.get('potential_facets_cn', [])
        
        # 选择前4个facets进行对比（如果少于4个则全选）
        return facets[:4]
    
    def _format_facets_for_comparison(self, facets: List[Dict]) -> str:
        """为对比分析格式化facets"""
        if not facets:
            return "暂无可用的对比维度"
        
        formatted_list = []
        for facet in facets:
            facet_name = facet.get('facet_name_cn', '未知维度')
            facet_desc = facet.get('facet_description_cn', '无描述')
            keywords = facet.get('keywords_cn', [])
            
            formatted_item = f"**{facet_name}**\n- 描述：{facet_desc}\n- 关键词：{', '.join(keywords[:5])}"
            formatted_list.append(formatted_item)
        
        return '\n\n'.join(formatted_list)
    
    def create_controlled_prompt(self, json_data: Dict, user_question: str, output_format: str = "strict") -> str:
        """
        创建具有严格控制的prompt
        
        Args:
            json_data: JSON数据
            user_question: 用户问题
            output_format: 输出格式控制 ("strict", "flexible")
            
        Returns:
            受控的prompt字符串
        """
        base_prompt, _ = self.process_json_to_prompt(json_data, user_question)
        
        if output_format == "strict":
            # 添加严格的格式控制指令
            control_instructions = """

**严格输出控制指令：**
1. 你必须严格按照上述知识内容回答，不得添加任何上述内容之外的信息
2. 你的回答必须准确、专业，基于提供的结构化知识
3. 如果用户问题与提供的知识不匹配，请明确指出并基于最相关的部分回答
4. 保持回答的简洁性和准确性，避免冗长的解释
5. 不要生成格式化的总结或引言，直接回答问题

现在请严格按照要求回答用户的问题。"""
            
            return base_prompt + control_instructions
        
        return base_prompt

def main():
    """测试Prompt处理器"""
    print("=== Prompt处理器测试 ===")
    
    # 创建处理器实例
    processor = PromptProcessor()
    
    # 模拟JSON数据
    mock_json_data = {
        "original_question_cn": "无人机飞行",
        "main_topic_cn": "无人机飞行",
        "domain_cn": "电子工程",
        "sub_domain_cn": "雷达信号处理",
        "potential_facets_cn": [
            {
                "facet_name_cn": "无人机飞行的基本概念与原理",
                "facet_description_cn": "解释无人机飞行的基本概念、工作原理和物理基础。",
                "keywords_cn": ["基本概念", "工作原理", "物理基础"],
                "example_questions_cn": ["什么是无人机飞行？", "无人机飞行的工作原理是什么？"]
            },
            {
                "facet_name_cn": "无人机飞行的电路设计与结构",
                "facet_description_cn": "分析无人机飞行的电路结构、设计方法和电路拓扑。",
                "keywords_cn": ["电路设计", "电路结构", "设计方法"],
                "example_questions_cn": ["无人机飞行的电路结构是怎样的？", "如何设计无人机飞行电路？"]
            }
        ]
    }
    
    # 测试不同类型的问题
    test_questions = [
        "什么是无人机飞行的基本原理？",
        "我想了解无人机飞行",
        "请详细解释无人机飞行的概念",
        "比较无人机飞行的不同方面"
    ]
    
    for question in test_questions:
        print(f"\n{'='*60}")
        print(f"用户问题: {question}")
        print('='*60)
        
        try:
            prompt, info = processor.process_json_to_prompt(mock_json_data, question)
            
            print(f"识别场景: {info['scenario_type']}")
            print(f"置信度: {info['confidence']:.2f}")
            print(f"使用模板: {info['template_name']}")
            print(f"\n生成的Prompt:")
            print("-" * 40)
            print(prompt[:500] + "..." if len(prompt) > 500 else prompt)
            
        except Exception as e:
            print(f"处理出错: {e}")

if __name__ == '__main__':
    main()

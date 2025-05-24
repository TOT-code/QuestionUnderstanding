#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
场景识别器
根据用户输入和意图识别最适合的模板场景
"""

import re
from typing import Dict, List, Optional, Tuple
from enum import Enum

class ScenarioType(Enum):
    """场景类型枚举"""
    DIRECT_ANSWER = "direct_answer"
    GUIDED_QUESTION = "guided_question"
    KNOWLEDGE_EXPLAIN = "knowledge_explain"
    COMPARE_ANALYSIS = "compare_analysis"
    UNKNOWN = "unknown"

class ScenarioDetector:
    """场景识别器"""
    
    def __init__(self):
        """初始化场景识别器"""
        self._init_patterns()
    
    def _init_patterns(self) -> None:
        """初始化识别模式"""
        # 直接回答模式的关键词和模式
        self.direct_answer_patterns = [
            r'什么是',
            r'如何',
            r'为什么',
            r'怎样',
            r'怎么',
            r'原理',
            r'方法',
            r'步骤',
            r'过程',
            r'定义',
            r'解释',
            r'说明',
            r'介绍',
            r'.*的作用',
            r'.*的特点',
            r'.*的优缺点',
            r'.*如何工作'
        ]
        
        # 引导提问模式的关键词和模式
        self.guided_question_patterns = [
            r'我想了解',
            r'我对.*感兴趣',
            r'学习.*',
            r'了解.*',
            r'入门',
            r'开始学',
            r'从哪里开始',
            r'不知道.*从何',
            r'系统.*学习',
            r'全面.*了解'
        ]
        
        # 知识解释模式的关键词和模式
        self.knowledge_explain_patterns = [
            r'详细.*解释',
            r'深入.*了解',
            r'具体.*说明',
            r'全面.*介绍',
            r'详细.*描述',
            r'深层.*理解',
            r'更多.*信息',
            r'进一步.*了解',
            r'深入.*分析'
        ]
        
        # 对比分析模式的关键词和模式
        self.compare_analysis_patterns = [
            r'比较',
            r'对比',
            r'分析.*区别',
            r'.*之间.*关系',
            r'多个.*方面',
            r'各个.*维度',
            r'不同.*特点',
            r'综合.*分析',
            r'全面.*对比',
            r'系统.*比较'
        ]
    
    def detect_scenario(self, user_input: str, context: Optional[Dict] = None) -> Tuple[ScenarioType, float]:
        """
        检测用户输入对应的场景类型
        
        Args:
            user_input: 用户输入文本
            context: 上下文信息（可选）
            
        Returns:
            场景类型和置信度的元组
        """
        if not user_input or not user_input.strip():
            return ScenarioType.UNKNOWN, 0.0
        
        user_input = user_input.strip().lower()
        
        # 计算各种场景的匹配分数
        scores = {
            ScenarioType.DIRECT_ANSWER: self._calculate_pattern_score(user_input, self.direct_answer_patterns),
            ScenarioType.GUIDED_QUESTION: self._calculate_pattern_score(user_input, self.guided_question_patterns),
            ScenarioType.KNOWLEDGE_EXPLAIN: self._calculate_pattern_score(user_input, self.knowledge_explain_patterns),
            ScenarioType.COMPARE_ANALYSIS: self._calculate_pattern_score(user_input, self.compare_analysis_patterns)
        }
        
        # 应用额外的启发式规则
        scores = self._apply_heuristic_rules(user_input, scores, context)
        
        # 找到最高分数的场景
        best_scenario = max(scores.items(), key=lambda x: x[1])
        
        # 如果最高分数太低，返回未知场景
        if best_scenario[1] < 0.3:
            return ScenarioType.UNKNOWN, best_scenario[1]
        
        return best_scenario[0], best_scenario[1]
    
    def _calculate_pattern_score(self, text: str, patterns: List[str]) -> float:
        """
        计算文本与模式列表的匹配分数
        
        Args:
            text: 输入文本
            patterns: 模式列表
            
        Returns:
            匹配分数 (0.0 - 1.0)
        """
        if not patterns:
            return 0.0
        
        matches = 0
        total_patterns = len(patterns)
        
        for pattern in patterns:
            if re.search(pattern, text):
                matches += 1
        
        # 基础分数：匹配比例
        base_score = matches / total_patterns
        
        # 如果有匹配，给予额外加分
        if matches > 0:
            base_score += 0.2
        
        return min(base_score, 1.0)
    
    def _apply_heuristic_rules(self, text: str, scores: Dict[ScenarioType, float], context: Optional[Dict]) -> Dict[ScenarioType, float]:
        """
        应用启发式规则调整分数
        
        Args:
            text: 输入文本
            scores: 当前分数字典
            context: 上下文信息
            
        Returns:
            调整后的分数字典
        """
        # 文本长度启发式
        text_length = len(text)
        
        # 短文本更可能是直接问题
        if text_length < 20:
            scores[ScenarioType.DIRECT_ANSWER] += 0.1
            scores[ScenarioType.KNOWLEDGE_EXPLAIN] -= 0.1
        
        # 长文本更可能需要详细解释
        elif text_length > 50:
            scores[ScenarioType.KNOWLEDGE_EXPLAIN] += 0.1
            scores[ScenarioType.DIRECT_ANSWER] -= 0.1
        
        # 问号启发式
        if '？' in text or '?' in text:
            if text.count('？') + text.count('?') == 1:
                scores[ScenarioType.DIRECT_ANSWER] += 0.15
            else:
                scores[ScenarioType.COMPARE_ANALYSIS] += 0.1
        
        # 多个关键词启发式
        key_concepts = ['原理', '方法', '应用', '优缺点', '特点', '结构', '参数', '性能']
        concept_count = sum(1 for concept in key_concepts if concept in text)
        
        if concept_count >= 3:
            scores[ScenarioType.COMPARE_ANALYSIS] += 0.2
        elif concept_count >= 2:
            scores[ScenarioType.KNOWLEDGE_EXPLAIN] += 0.15
        
        # 上下文启发式
        if context:
            # 如果用户之前已经询问过基础问题，可能需要更深入的解释
            if context.get('previous_questions', 0) > 0:
                scores[ScenarioType.KNOWLEDGE_EXPLAIN] += 0.1
                scores[ScenarioType.GUIDED_QUESTION] -= 0.1
        
        # 确保分数在合理范围内
        for scenario_type in scores:
            scores[scenario_type] = max(0.0, min(1.0, scores[scenario_type]))
        
        return scores
    
    def get_template_id_for_scenario(self, scenario_type: ScenarioType) -> str:
        """
        根据场景类型获取对应的模板ID
        
        Args:
            scenario_type: 场景类型
            
        Returns:
            模板ID
        """
        template_mapping = {
            ScenarioType.DIRECT_ANSWER: "direct_answer_v1",
            ScenarioType.GUIDED_QUESTION: "guided_question_v1",
            ScenarioType.KNOWLEDGE_EXPLAIN: "knowledge_explain_v1",
            ScenarioType.COMPARE_ANALYSIS: "compare_analysis_v1"
        }
        
        return template_mapping.get(scenario_type, "direct_answer_v1")
    
    def analyze_user_intent(self, user_input: str, context: Optional[Dict] = None) -> Dict:
        """
        分析用户意图的详细信息
        
        Args:
            user_input: 用户输入
            context: 上下文信息
            
        Returns:
            包含详细分析结果的字典
        """
        scenario_type, confidence = self.detect_scenario(user_input, context)
        template_id = self.get_template_id_for_scenario(scenario_type)
        
        # 提取关键信息
        question_words = ['什么', '如何', '为什么', '怎样', '怎么', '哪些', '哪个']
        detected_question_words = [word for word in question_words if word in user_input]
        
        analysis_result = {
            'scenario_type': scenario_type.value,
            'confidence': confidence,
            'template_id': template_id,
            'detected_question_words': detected_question_words,
            'text_length': len(user_input),
            'is_question': ('？' in user_input or '?' in user_input),
            'complexity_level': self._assess_complexity(user_input)
        }
        
        return analysis_result
    
    def _assess_complexity(self, text: str) -> str:
        """
        评估问题复杂度
        
        Args:
            text: 输入文本
            
        Returns:
            复杂度级别：'simple', 'medium', 'complex'
        """
        # 技术术语列表
        technical_terms = ['算法', '架构', '系统', '协议', '技术', '方法', '原理', '机制', '结构', '参数', '性能', '优化']
        
        tech_term_count = sum(1 for term in technical_terms if term in text)
        text_length = len(text)
        
        if tech_term_count >= 3 or text_length > 100:
            return 'complex'
        elif tech_term_count >= 1 or text_length > 30:
            return 'medium'
        else:
            return 'simple'

def main():
    """测试场景识别器"""
    print("=== 场景识别器测试 ===")
    
    detector = ScenarioDetector()
    
    # 测试用例
    test_cases = [
        "什么是无人机飞行的基本原理？",
        "我想了解5G通信技术",
        "请详细解释快速傅里叶变换的数学原理",
        "比较无人机飞行的不同维度",
        "如何设计运算放大器电路？",
        "学习雷达技术应该从哪里开始？",
        "深入分析相控阵雷达的各个方面",
        "信号处理和通信工程有什么区别？"
    ]
    
    for i, test_input in enumerate(test_cases, 1):
        print(f"\n测试案例 {i}: {test_input}")
        
        # 检测场景
        scenario, confidence = detector.detect_scenario(test_input)
        template_id = detector.get_template_id_for_scenario(scenario)
        
        print(f"识别场景: {scenario.value}")
        print(f"置信度: {confidence:.2f}")
        print(f"推荐模板: {template_id}")
        
        # 详细分析
        analysis = detector.analyze_user_intent(test_input)
        print(f"复杂度: {analysis['complexity_level']}")
        print(f"检测到的疑问词: {analysis['detected_question_words']}")

if __name__ == '__main__':
    main()

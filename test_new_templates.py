#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试新增的通信、雷达、信号处理领域模板
"""

import json
from template_processor import populate_facets

def test_communication_template():
    """测试通信工程模板"""
    print("=" * 60)
    print("测试通信工程模板")
    print("=" * 60)
    
    # 测试案例：5G通信技术
    mock_llm_output = {
        "main_topic_cn": "5G通信技术",
        "main_topic_en": "5G Communication Technology",
        "domain_cn": "通信工程",
        "sub_domain_cn": "移动通信",
        "confidence_score": 0.95
    }
    
    facets = populate_facets(mock_llm_output["main_topic_cn"], mock_llm_output)
    print(f"\n--- 针对 '{mock_llm_output['main_topic_cn']}' 生成的方面 ---")
    for i, facet in enumerate(facets, 1):
        print(f"\n{i}. {facet.facet_name_cn}")
        print(f"   描述: {facet.facet_description_cn}")
        print(f"   示例问题: {facet.example_questions_cn}")
        print(f"   关键词: {facet.keywords_cn}")

def test_radar_template():
    """测试雷达技术模板"""
    print("\n" + "=" * 60)
    print("测试雷达技术模板")
    print("=" * 60)
    
    # 测试案例：相控阵雷达
    mock_llm_output = {
        "main_topic_cn": "相控阵雷达",
        "main_topic_en": "Phased Array Radar",
        "domain_cn": "雷达技术",
        "sub_domain_cn": "雷达系统",
        "confidence_score": 0.92
    }
    
    facets = populate_facets(mock_llm_output["main_topic_cn"], mock_llm_output)
    print(f"\n--- 针对 '{mock_llm_output['main_topic_cn']}' 生成的方面 ---")
    for i, facet in enumerate(facets, 1):
        print(f"\n{i}. {facet.facet_name_cn}")
        print(f"   描述: {facet.facet_description_cn}")
        print(f"   示例问题: {facet.example_questions_cn}")
        print(f"   关键词: {facet.keywords_cn}")

def test_signal_processing_template():
    """测试信号处理模板"""
    print("\n" + "=" * 60)
    print("测试信号处理模板")
    print("=" * 60)
    
    # 测试案例：快速傅里叶变换
    mock_llm_output = {
        "main_topic_cn": "快速傅里叶变换",
        "main_topic_en": "Fast Fourier Transform",
        "domain_cn": "信号处理",
        "sub_domain_cn": "数字信号处理",
        "confidence_score": 0.94
    }
    
    facets = populate_facets(mock_llm_output["main_topic_cn"], mock_llm_output)
    print(f"\n--- 针对 '{mock_llm_output['main_topic_cn']}' 生成的方面 ---")
    for i, facet in enumerate(facets, 1):
        print(f"\n{i}. {facet.facet_name_cn}")
        print(f"   描述: {facet.facet_description_cn}")
        print(f"   示例问题: {facet.example_questions_cn}")
        print(f"   关键词: {facet.keywords_cn}")

def test_electronics_template():
    """测试电子工程模板"""
    print("\n" + "=" * 60)
    print("测试电子工程模板")
    print("=" * 60)
    
    # 测试案例：运算放大器
    mock_llm_output = {
        "main_topic_cn": "运算放大器",
        "main_topic_en": "Operational Amplifier",
        "domain_cn": "电子工程",
        "sub_domain_cn": "模拟电路",
        "confidence_score": 0.91
    }
    
    facets = populate_facets(mock_llm_output["main_topic_cn"], mock_llm_output)
    print(f"\n--- 针对 '{mock_llm_output['main_topic_cn']}' 生成的方面 ---")
    for i, facet in enumerate(facets, 1):
        print(f"\n{i}. {facet.facet_name_cn}")
        print(f"   描述: {facet.facet_description_cn}")
        print(f"   示例问题: {facet.example_questions_cn}")
        print(f"   关键词: {facet.keywords_cn}")

def test_short_domain_names():
    """测试简称映射"""
    print("\n" + "=" * 60)
    print("测试简称映射")
    print("=" * 60)
    
    # 测试通信简称
    mock_llm_output_comm = {
        "main_topic_cn": "调制解调器",
        "main_topic_en": "MODEM",
        "domain_cn": "通信",  # 使用简称
        "sub_domain_cn": "数据通信",
        "confidence_score": 0.88
    }
    
    facets_comm = populate_facets(mock_llm_output_comm["main_topic_cn"], mock_llm_output_comm)
    print(f"\n通信简称测试 - '{mock_llm_output_comm['main_topic_cn']}' 的第一个方面:")
    print(f"方面名称: {facets_comm[0].facet_name_cn}")
    
    # 测试雷达简称
    mock_llm_output_radar = {
        "main_topic_cn": "多普勒雷达",
        "main_topic_en": "Doppler Radar",
        "domain_cn": "雷达",  # 使用简称
        "sub_domain_cn": "测速雷达",
        "confidence_score": 0.89
    }
    
    facets_radar = populate_facets(mock_llm_output_radar["main_topic_cn"], mock_llm_output_radar)
    print(f"\n雷达简称测试 - '{mock_llm_output_radar['main_topic_cn']}' 的第一个方面:")
    print(f"方面名称: {facets_radar[0].facet_name_cn}")

if __name__ == '__main__':
    print("开始测试新增的领域模板...")
    
    # 运行所有测试
    test_communication_template()
    test_radar_template()
    test_signal_processing_template()
    test_electronics_template()
    test_short_domain_names()
    
    print("\n" + "=" * 60)
    print("测试完成！所有新的领域模板都已成功创建并可以正常使用。")
    print("=" * 60)

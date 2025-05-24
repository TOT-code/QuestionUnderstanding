#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prompt模板加载器
负责加载和管理所有的prompt模板
"""

import json
import os
from typing import Dict, List, Optional, Any
from pathlib import Path

class TemplateLoader:
    """Prompt模板加载器"""
    
    def __init__(self, templates_dir: str = "prompt_templates"):
        """
        初始化模板加载器
        
        Args:
            templates_dir: 模板文件目录路径
        """
        self.templates_dir = Path(templates_dir)
        self.templates: Dict[str, Dict[str, Any]] = {}
        self.template_by_scenario: Dict[str, str] = {}
        self._load_all_templates()
    
    def _load_all_templates(self) -> None:
        """加载所有模板文件"""
        if not self.templates_dir.exists():
            print(f"警告：模板目录 {self.templates_dir} 不存在")
            return
        
        template_files = list(self.templates_dir.glob("*.json"))
        if not template_files:
            print(f"警告：在 {self.templates_dir} 中未找到模板文件")
            return
        
        for template_file in template_files:
            try:
                with open(template_file, 'r', encoding='utf-8') as f:
                    template_data = json.load(f)
                
                template_id = template_data.get('template_id')
                if template_id:
                    self.templates[template_id] = template_data
                    # 建立场景到模板ID的映射
                    scenario = template_data.get('scenario', '')
                    if scenario:
                        self.template_by_scenario[scenario] = template_id
                    
                    print(f"成功加载模板: {template_data.get('template_name', template_id)}")
                else:
                    print(f"警告：模板文件 {template_file} 缺少 template_id")
                    
            except json.JSONDecodeError as e:
                print(f"错误：无法解析模板文件 {template_file}: {e}")
            except Exception as e:
                print(f"错误：加载模板文件 {template_file} 时出错: {e}")
    
    def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        """
        根据模板ID获取模板
        
        Args:
            template_id: 模板ID
            
        Returns:
            模板数据字典，如果不存在则返回None
        """
        return self.templates.get(template_id)
    
    def get_template_by_scenario(self, scenario_keyword: str) -> Optional[Dict[str, Any]]:
        """
        根据场景关键词获取模板
        
        Args:
            scenario_keyword: 场景关键词
            
        Returns:
            匹配的模板数据字典，如果不存在则返回None
        """
        # 精确匹配
        for scenario, template_id in self.template_by_scenario.items():
            if scenario_keyword in scenario:
                return self.templates.get(template_id)
        
        return None
    
    def list_available_templates(self) -> List[Dict[str, str]]:
        """
        列出所有可用的模板
        
        Returns:
            包含模板基本信息的列表
        """
        template_list = []
        for template_id, template_data in self.templates.items():
            template_info = {
                'template_id': template_id,
                'template_name': template_data.get('template_name', ''),
                'template_name_en': template_data.get('template_name_en', ''),
                'scenario': template_data.get('scenario', ''),
                'use_cases': template_data.get('use_cases', [])
            }
            template_list.append(template_info)
        
        return template_list
    
    def get_template_prompt(self, template_id: str) -> str:
        """
        获取模板的prompt内容
        
        Args:
            template_id: 模板ID
            
        Returns:
            prompt模板字符串
        """
        template = self.get_template(template_id)
        if template:
            return template.get('prompt_template', '')
        return ''
    
    def validate_template(self, template_id: str) -> bool:
        """
        验证模板的完整性
        
        Args:
            template_id: 模板ID
            
        Returns:
            模板是否有效
        """
        template = self.get_template(template_id)
        if not template:
            return False
        
        required_fields = ['template_id', 'template_name', 'scenario', 'prompt_template']
        for field in required_fields:
            if field not in template or not template[field]:
                print(f"模板 {template_id} 缺少必需字段: {field}")
                return False
        
        return True
    
    def reload_templates(self) -> None:
        """重新加载所有模板"""
        self.templates.clear()
        self.template_by_scenario.clear()
        self._load_all_templates()


def main():
    """测试模板加载器"""
    print("=== Prompt模板加载器测试 ===")
    
    # 创建模板加载器实例
    loader = TemplateLoader()
    
    # 列出所有可用模板
    print("\n可用的模板：")
    templates = loader.list_available_templates()
    for i, template in enumerate(templates, 1):
        print(f"{i}. {template['template_name']} ({template['template_id']})")
        print(f"   场景: {template['scenario']}")
        print(f"   用例: {', '.join(template['use_cases'])}")
        print()
    
    # 测试获取特定模板
    print("=== 测试获取直接回答模板 ===")
    direct_template = loader.get_template('direct_answer_v1')
    if direct_template:
        print(f"模板名称: {direct_template['template_name']}")
        print(f"场景: {direct_template['scenario']}")
        print("Prompt片段:", direct_template['prompt_template'][:100] + "...")
    
    # 测试场景匹配
    print("\n=== 测试场景匹配 ===")
    scenario_template = loader.get_template_by_scenario('用户询问具体问题')
    if scenario_template:
        print(f"匹配到模板: {scenario_template['template_name']}")
    
    # 验证模板
    print("\n=== 模板验证 ===")
    for template_id in loader.templates.keys():
        is_valid = loader.validate_template(template_id)
        print(f"{template_id}: {'有效' if is_valid else '无效'}")


if __name__ == '__main__':
    main()

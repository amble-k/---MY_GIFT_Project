import { joinFields, matchTags, matchTagsWithEvidence } from "./tag_matcher.js";

// 统一把 UI/保存数据的字段拼成可匹配 raw 文本
export function buildRaw(fields){
  return joinFields(Array.isArray(fields) ? fields : []);
}

// 兼容旧页面：只要 tags 数组
export function getTags(text, tags){
  return matchTags(text, tags);
}

// 专业版：返回 tags + evidence（可解释）
export function getTagsWithEvidence(text, tags){
  return matchTagsWithEvidence(text, tags);
}

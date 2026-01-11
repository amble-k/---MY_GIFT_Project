/**
 * /js/utils.js
 * 通用工具函数库
 */

// 安全获取 DOM 元素
export function getEl(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`[Utils] Element not found: #${id}`);
    return el;
}

// 获取 URL 参数 (兼容大小写)
export function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return (urlParams.get(param) || "").toLowerCase();
}

// 简单的数组排序工具 (降序)
export function sortDesc(arr, key) {
    return arr.sort((a, b) => b[key] - a[key]);
}
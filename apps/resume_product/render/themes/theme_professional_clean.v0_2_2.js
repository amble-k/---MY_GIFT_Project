/**
 * Resume Product - Theme Tokens
 * professional_clean
 * v0.2.2
 *
 * 目标：把“看起来专业”的视觉规则工程化为 tokens，禁止散落 inline style。
 * 后续 renderer 只能消费 tokens，不允许随手写字号/间距。
 */

export const THEME_PROFESSIONAL_CLEAN_V0_2_2 = Object.freeze({
  meta: {
    product: "Resume Product",
    theme: "professional_clean",
    version: "0.2.2",
  },

  // 页面尺度
  page: {
    width: "794px",          // 约等于 A4 96dpi 宽（用于预览；导出时会换算）
    padding: "28px",
    maxWidth: "820px",
  },

  // 字体与层级（先不指定具体字体名，避免平台差异；导出再落地）
  typography: {
    h1: { fontSize: "22px", fontWeight: 800, lineHeight: "1.2", letterSpacing: "0.2px" },
    h2: { fontSize: "13px", fontWeight: 800, lineHeight: "1.2", letterSpacing: "0.2px" },
    body: { fontSize: "12.5px", fontWeight: 500, lineHeight: "1.55" },
    small: { fontSize: "11px", fontWeight: 500, lineHeight: "1.45" },
    mono: { fontSize: "11px", fontWeight: 600, lineHeight: "1.4" },
  },

  // 间距系统（只允许使用这些值）
  spacing: {
    xs: "6px",
    sm: "10px",
    md: "14px",
    lg: "18px",
    xl: "24px",
  },

  // 边框/圆角（克制、统一）
  shape: {
    radiusCard: "14px",
    radiusChip: "999px",
    borderThin: "1px solid #e9e9e9",
    borderDash: "1px dashed #dddddd",
  },

  // 色彩（黑白灰为主，低饱和强调）
  color: {
    text: "#111111",
    subText: "rgba(0,0,0,0.65)",
    faint: "rgba(0,0,0,0.45)",
    border: "#e9e9e9",
    bg: "#ffffff",
    bgSoft: "#fafafa",
    dangerBg: "#fff7f7",
    dangerBorder: "#f3d6d6",
  },

  // 布局规则（专业感核心）
  layout: {
    sectionGap: "14px",
    blockGap: "10px",
    rowGap: "6px",
    headerSplitGap: "12px",
    align: "left",
  },

  // 组件 tokens（给 block renderer 用）
  components: {
    card: {
      padding: "14px 16px",
      border: "1px solid #e9e9e9",
      radius: "14px",
      bg: "#ffffff",
    },
    hint: {
      padding: "10px 12px",
      border: "1px dashed #e6e6e6",
      radius: "14px",
      bg: "#fafafa",
    },
    chip: {
      padding: "6px 10px",
      border: "1px solid #e8e8e8",
      radius: "999px",
    },
  },
});

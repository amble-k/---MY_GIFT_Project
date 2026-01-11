/* auto-generated from job_models_v0_1.json */
export const JOB_MODELS_V0_1 = {
  "meta": {
    "schema": "MY_GIFT_JOB_MODELS_V0_1",
    "version": "0.1.0",
    "locale": "ja-JP",
    "created_at": "2026-01-11",
    "notes": [
      "Job model is a calculable target vector for KASH + optional A_sub facets.",
      "Targets are 0-100, weights sum to 1.0.",
      "must_have / nice_to_have are simple gate expressions (string), evaluated later."
    ]
  },
  "enums": {
    "kash_keys": [
      "K",
      "A",
      "S",
      "H"
    ],
    "job_family": [
      "OFFICE",
      "SALES",
      "PM",
      "CS",
      "ENGINEERING",
      "MARKETING",
      "HR",
      "FINANCE",
      "OTHER"
    ],
    "level": [
      "junior",
      "mid",
      "senior"
    ],
    "context_tags": [
      "routine",
      "deadline",
      "stakeholder",
      "cross-functional",
      "accuracy",
      "speed",
      "customer-facing",
      "negotiation",
      "documentation",
      "process-improvement",
      "ambiguity",
      "high-pressure"
    ]
  },
  "models": [
    {
      "job_id": "jp_office_admin_001",
      "job_title_ja": "一般事務（バックオフィス）",
      "job_title_en": "Office Administrator",
      "job_family": "OFFICE",
      "level": "junior",
      "context_tags": [
        "routine",
        "accuracy",
        "documentation",
        "deadline",
        "process-improvement"
      ],
      "summary_ja": "正確性と段取り力が重要。関係者の依頼を滞りなく処理し、ミスを減らし、業務の型を整える役割。",
      "KASH": {
        "K": {
          "target": 55,
          "weight": 0.15,
          "notes_ja": "基本知識（業務ルール、社内手続き、ツール運用）"
        },
        "A": {
          "target": 75,
          "weight": 0.25,
          "notes_ja": "丁寧さ、協調、受け止め力、安定した態度"
        },
        "S": {
          "target": 70,
          "weight": 0.3,
          "notes_ja": "処理力（正確な入力、確認、報連相、整理）"
        },
        "H": {
          "target": 80,
          "weight": 0.3,
          "notes_ja": "習慣（チェックリスト、締切逆算、ルーティン化、ミス予防）"
        }
      },
      "A_sub": {
        "align": 75,
        "feedback": 65,
        "conflict": 55,
        "ownership": 60
      },
      "must_have": [
        "H>=70",
        "S>=65"
      ],
      "nice_to_have": [
        "A>=70",
        "K>=55"
      ],
      "evidence_prompts_ja": [
        "ミスを減らすために普段している工夫は？",
        "締切が重なった時の優先順位の付け方は？",
        "依頼が曖昧な場合、どう確認する？"
      ]
    },
    {
      "job_id": "jp_sales_001",
      "job_title_ja": "法人営業（新規・既存）",
      "job_title_en": "B2B Sales",
      "job_family": "SALES",
      "level": "mid",
      "context_tags": [
        "customer-facing",
        "negotiation",
        "deadline",
        "high-pressure",
        "ambiguity",
        "stakeholder"
      ],
      "summary_ja": "関係構築と提案力が軸。数字と顧客課題の両方を扱い、断られても粘り強く改善を続ける役割。",
      "KASH": {
        "K": {
          "target": 65,
          "weight": 0.15,
          "notes_ja": "商材理解、業界理解、顧客課題の理解"
        },
        "A": {
          "target": 80,
          "weight": 0.3,
          "notes_ja": "前向きさ、切替え、対人の安定、主体性"
        },
        "S": {
          "target": 80,
          "weight": 0.35,
          "notes_ja": "提案/交渉/ヒアリング/クロージング"
        },
        "H": {
          "target": 70,
          "weight": 0.2,
          "notes_ja": "行動量の維持、振り返り、改善サイクル"
        }
      },
      "A_sub": {
        "align": 70,
        "feedback": 75,
        "conflict": 70,
        "ownership": 80
      },
      "must_have": [
        "A>=75",
        "S>=75"
      ],
      "nice_to_have": [
        "H>=65",
        "K>=60"
      ],
      "evidence_prompts_ja": [
        "断られた後、次の一手をどう設計する？",
        "顧客課題を引き出す質問の組み立て方は？",
        "社内（技術/運用）を巻き込む時の進め方は？"
      ]
    },
    {
      "job_id": "jp_pm_001",
      "job_title_ja": "プロジェクトマネージャー",
      "job_title_en": "Project Manager",
      "job_family": "PM",
      "level": "mid",
      "context_tags": [
        "cross-functional",
        "deadline",
        "stakeholder",
        "documentation",
        "ambiguity",
        "process-improvement"
      ],
      "summary_ja": "利害調整とリスク管理が本質。関係者を動かし、仕様の曖昧さを整理し、期限内に成果を出す役割。",
      "KASH": {
        "K": {
          "target": 70,
          "weight": 0.2,
          "notes_ja": "要件整理、全体設計、業務理解、判断の軸"
        },
        "A": {
          "target": 75,
          "weight": 0.25,
          "notes_ja": "責任感、冷静さ、対立時の態度、合意形成"
        },
        "S": {
          "target": 80,
          "weight": 0.3,
          "notes_ja": "推進力（計画、調整、意思決定支援、伝達）"
        },
        "H": {
          "target": 75,
          "weight": 0.25,
          "notes_ja": "リズム（週次運用、記録、早期検知、改善）"
        }
      },
      "A_sub": {
        "align": 80,
        "feedback": 70,
        "conflict": 75,
        "ownership": 85
      },
      "must_have": [
        "A>=70",
        "S>=75"
      ],
      "nice_to_have": [
        "H>=70",
        "K>=65"
      ],
      "evidence_prompts_ja": [
        "要件が曖昧なとき、どう切り分けて合意を作る？",
        "遅延の兆候をどう検知し、どう手を打つ？",
        "利害が割れた場で、どう意思決定を前に進める？"
      ]
    }
  ]
};
export default JOB_MODELS_V0_1;

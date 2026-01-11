/**
 * Resume Product - Output Spec (Professional Clean)
 * v0.2.3
 *
 * 输入：ResumeDoc@0.2.3
 * 输出：sections/blocks（渲染器消费）
 */

export const OUTPUT_SPEC_PRO_CLEAN_V0_2_3 = Object.freeze({
  meta: {
    product: "Resume Product",
    contract: "output_spec",
    theme: "professional_clean",
    version: "0.2.3",
    input_model: "ResumeDoc@0.2.3",
  },

  sections: [
    { id:"header", title:{ zh:"抬头信息", en:"Header" }, blocks:[{ id:"header_card", type:"header_card", props:{ source:"header" } }] },
    { id:"summary", title:{ zh:"个人简介", en:"Summary" }, blocks:[{ id:"summary_bullets", type:"summary_bullets", props:{ source:"summary.bullets" } }] },
    { id:"skills", title:{ zh:"技能", en:"Skills" }, blocks:[{ id:"skills_grouped", type:"skills_grouped", props:{ source:"skills.groups" } }] },

    { id:"experience", title:{ zh:"工作经历", en:"Experience" }, blocks:[{ id:"experience_timeline", type:"experience_timeline", props:{ source:"experience" } }] },
    { id:"projects", title:{ zh:"项目经历", en:"Projects" }, blocks:[{ id:"projects_cards", type:"projects_cards", props:{ source:"projects" } }] },
    { id:"education", title:{ zh:"教育背景", en:"Education" }, blocks:[{ id:"education_rows", type:"education_rows", props:{ source:"education" } }] },

    { id:"certifications", title:{ zh:"证书", en:"Certifications" }, blocks:[{ id:"cert_rows", type:"certifications_rows", props:{ source:"certifications" } }] },
    { id:"trainings", title:{ zh:"培训经历", en:"Trainings" }, blocks:[{ id:"train_rows", type:"trainings_rows", props:{ source:"trainings" } }] },

    { id:"trace", title:{ zh:"可追溯信息", en:"Trace" }, blocks:[{ id:"trace_refs", type:"trace_refs", props:{ source:"trace" } }] },
  ],
});

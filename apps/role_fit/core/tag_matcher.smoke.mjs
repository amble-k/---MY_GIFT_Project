import { loadTaxonomy } from "./data_loader.js";
import { matchTags } from "./tag_matcher.js";

function eq(a, b){
  return JSON.stringify(a) === JSON.stringify(b);
}
function ok(name, got, exp){
  if (eq(got, exp)){
    console.log(`[OK] ${name} =>`, got);
    return 0;
  }
  console.error(`[BAD] ${name} =>`, got, "expect", exp);
  return 1;
}

const TAX = await loadTaxonomy();
const K = TAX?.K_TAGS || [];
const S = TAX?.S_TAGS || [];

let fail = 0;

// S matcher cases
fail += ok('S "推进"', matchTags("推进", S), []);
fail += ok('S "推动"', matchTags("推动", S), []);
fail += ok('S "项目推进"', matchTags("项目推进", S), ["project_mgmt"]);
fail += ok('S "我负责推进落地"', matchTags("我负责推进落地", S), ["execution"]);
fail += ok('S "推动落地"', matchTags("推动落地", S), ["execution"]);

// K matcher cases
fail += ok('K "数据库查询"', matchTags("数据库查询", K), ["sql"]);
fail += ok('K "SQL 数据分析"', matchTags("SQL 数据分析", K), ["sql", "data_analysis"]);

if (fail){
  console.error(`\nMATCHER SMOKE FAILED: ${fail} failed`);
  process.exit(1);
}
console.log("\nMATCHER SMOKE OK");

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app/admin/(dashboard)/collectors/CollectorsClient.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove UserPlan from imports
content = content.replace(/, UserPlan/g, '');
// 2. Remove "plan" from SortField
content = content.replace(/ \| "plan"/g, '');
// 3. Remove selectedPlan state
content = content.replace(/  const \[selectedPlan, setSelectedPlan\] = useState\("all"\);\n/g, '');
// 4. Remove selectedPlan from filtering logic
content = content.replace(/\s*\/\/ Plan filter\s*if \(selectedPlan !== "all" && Collector\.plan !== selectedPlan\) \{\s*return false;\s*\}/g, '');
// 5. Remove selectedPlan from dependency array
content = content.replace(/, selectedPlan/g, '');
// 6. Remove handleChangePlan
content = content.replace(/\s*\/\/ Drawer action: Change plan \(optimistic\)[\s\S]*?toast\.error\("Network error", "Could not update plan\."\);\s*\}\s*\};\n/g, '\n');
// 7. Remove Plan filter from UI (the whole object in filterConfigs)
content = content.replace(/\s*\{\s*id: "plan",\s*label: "Plan",\s*value: selectedPlan,\s*onChange: \(val\) => \{\s*setSelectedPlan\(val\);\s*setCurrentPage\(1\);\s*\},\s*options: \[\s*\{ label: "All Plans", value: "all" \},\s*\{ label: "Free", value: "free" \},\s*\{ label: "Elite", value: "elite" \},\s*\{ label: "Pro", value: "pro" \},\s*\],\s*\},/g, '');
// 8. Remove selectedPlan from clear filters
content = content.replace(/\s*selectedPlan !== "all" \|\|/g, '');
content = content.replace(/\s*setSelectedPlan\("all"\);/g, '');
// 9. Remove plan from ExportDropdown
content = content.replace(/, plan: selectedPlan === "all" \? undefined : selectedPlan /g, '');
// 10. Remove Plan column header
content = content.replace(/\s*<TableHead>\s*<button[\s\S]*?onClick=\{.*?handleSort\("plan"\)\}[\s\S]*?<span>Plan<\/span>[\s\S]*?<\/button>\s*<\/TableHead>/g, '');
// 11. Remove Plan column cell
content = content.replace(/\s*\{\/\* Plan \*\/\}\s*<TableCell>[\s\S]*?<\/TableCell>/g, '');
// 12. Remove plan tier from header description
content = content.replace(/, plan tier,/g, '');
// 13. Remove selectedCollector.plan from drawer header
content = content.replace(/\s*\{selectedCollector\.plan && \([\s\S]*?<\/Badge>\s*\)\}/g, '');
// 14. Remove Change Plan action from drawer
content = content.replace(/\s*\{\/\* Action: Change Plan.*? \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated CollectorsClient.tsx");

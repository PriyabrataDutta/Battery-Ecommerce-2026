const XLSX = require('xlsx');
const wb = XLSX.readFile(process.argv[2]);
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Developer_Price_List'], { header: 1, defval: null }).slice(1);
const out = []; let cur = null;
for (const r of rows) {
  const [name, brand, , carBrands, carModels, , , pwe, , , pwoe, warranty, note] = r;
  if (name && /^TOTAL/i.test(name)) continue;
  const models = (carModels || '').split(',').map(s => s.trim()).filter(Boolean);
  const cbs = (carBrands || '').split(',').map(s => s.trim()).filter(Boolean);
  if (name) { cur = { name: name.trim(), brand, pwe, pwoe, warranty, note, models, carBrands: cbs }; out.push(cur); }
  else if (cur) { cur.models.push(...models); cur.carBrands.push(...cbs); }
}
require('fs').writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log('batteries', out.length, 'notes', [...new Set(out.map(o => o.note))]);
console.log('missing prices', out.filter(o => !o.pwe || !o.pwoe).map(o => `${o.name} pwe=${o.pwe} pwoe=${o.pwoe}`));
console.log('exch>=noexch', out.filter(o => o.pwe >= o.pwoe).map(o => o.name));
console.log('brands', [...new Set(out.map(o => o.brand))]);
const dup = out.map(o=>o.name.toLowerCase()).filter((n,i,a)=>a.indexOf(n)!==i); console.log('dup names', dup);

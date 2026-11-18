const XLSX = require('xlsx');
const wb = XLSX.readFile(process.argv[2]);
for (const sheet of wb.SheetNames) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { header: 1, defval: null });
  const hdr = rows[0];
  const iName = 0, iBrand = 1;
  const iPw = hdr.findIndex(h => /With Exchange( \(Incl|$)/i.test(h || ''));
  const iPwo = hdr.findIndex(h => /Without Exchange( \(Incl|$)/i.test(h || ''));
  const data = rows.slice(1).filter(r => r.some(v => v !== null && v !== ''));
  const named = data.filter(r => r[iName] && !/^TOTAL/i.test(r[iName]));
  const total = data.filter(r => r[iName] && /^TOTAL/i.test(r[iName]));
  const unnamed = data.filter(r => !r[iName]);
  console.log(`\n== ${sheet}: header + ${data.length} data rows → named ${named.length}, unnamed ${unnamed.length}, TOTAL ${total.length}`);
  console.log(`   unnamed rows WITH a price: ${unnamed.filter(r => r[iPw] || r[iPwo]).length}`);
  data.forEach((r, k) => { if (!r[iName]) console.log(`   row ${rows.indexOf(r) + 1}: brand=${r[iBrand]} carBrand=${r[3]} models="${(r[4] || '').slice(0, 70)}" prices=${r[iPw]}/${r[iPwo]}`); });
  const names = named.map(r => String(r[iName]).trim());
  const dups = names.filter((n, i) => names.findIndex(m => m.toLowerCase() === n.toLowerCase()) !== i);
  console.log('   duplicate names:', dups.length ? dups : 'none');
  console.log('   odd names:', names.filter(n => n.length < 6 || !/battery/i.test(n)));
}

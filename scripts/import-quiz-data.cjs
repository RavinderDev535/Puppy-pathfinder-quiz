// Convert the supplied workbook export and verified public store/reference data.
// Usage: node scripts/import-quiz-data.cjs workbooks.json products.json compatibility.json
const fs = require('fs');
const read = path => JSON.parse(fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const [books, catalog, reference] = process.argv.slice(2).map(read);
const breedRows = books['EZclassic - Single Box Quiz\\A_Quiz_Handover\\2_Breed_Mapping.xlsx']['05 Breed to box'];
const breeds = breedRows.filter(row => /^(28x28|38x38|48x48|48x76)$/.test(row.B)).map(row => ({name: row.A, sizes: [row.B, row.C].filter(Boolean)}));
const products = catalog.products.flatMap(product => product.variants.map(variant => ({
  key: variant.sku || `variant:${variant.id}`, sku: variant.sku || null,
  variantId: String(variant.id), handle: product.handle, title: product.title,
  variant: variant.title === 'Default Title' ? '' : variant.title,
  image: (product.images.find(image => image.variant_ids.includes(variant.id)) || product.images[0])?.src || '',
})));
const strip = value => Array.isArray(value) ? value.map(strip) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).filter(([key]) => !['price','compare_at','status','stock','units_left','cart_url','shopify_variant_id','discounted_alternative'].includes(key)).map(([key,value]) => [key,strip(value)])) : value;
const data = {breeds, products, compatibility:strip(reference.compatibility), boxes:strip(reference.boxes),
  restock:strip(reference.restock_repair_lane), kits:strip(reference.upgrade_lane.size_path.ezclassic.resolved_kit_matrix), bundles:strip(reference.bundles)};
fs.mkdirSync('src/lib/quiz-lanes', {recursive:true});
fs.writeFileSync('src/lib/quiz-lanes/reference-data.json',JSON.stringify(data,null,2)+'\n');
const fixtures = Object.fromEntries(Object.entries(books).filter(([name]) => /Test_Cases/.test(name)).map(([name,sheets]) => [name.split('\\')[0],sheets]));
fs.mkdirSync('src/test/fixtures',{recursive:true});
fs.writeFileSync('src/test/fixtures/quiz-workbooks.json',JSON.stringify(fixtures,null,2)+'\n');
console.log(`Imported ${breeds.length} breeds, ${products.length} verified variants, compatibility gates and workbook test cases. No prices or stock snapshots imported.`);

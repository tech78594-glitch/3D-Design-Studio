import { CADObject, BOMRowItem, BOMReportSummary } from '../types/cad';

// Densities in g/cm3 for various CAD material types
const MATERIAL_DENSITY_MAP: Record<string, number> = {
  anodized_aluminum: 2.70,
  polished_metal: 7.85,
  matte_plastic: 1.05,
  glossy_ceramic: 2.40,
  tinted_glass: 2.50,
  clear_glass: 2.50,
  carbon_fiber: 1.60,
  gold_trace: 19.32,
  copper: 8.96,
  pcb_green: 1.85,
  pcb_black: 1.85,
  rubber_grip: 1.15,
  led_emissive: 1.40,
  concrete: 2.40,
  warm_wood: 0.65,
  white_plaster: 1.20,
  brick: 1.90,
  steel_beam: 7.85,
};

// Manufacturing process inference
function inferManufacturingProcess(category: string, materialType: string): { process: string; leadWeeks: number } {
  if (category === 'pcb' || materialType.includes('pcb')) {
    return { process: 'Multi-layer SMT & Pick-and-Place', leadWeeks: 2 };
  }
  if (category === 'optics' || materialType.includes('glass')) {
    return { process: 'Precision CNC Grinding & AR Coating', leadWeeks: 3 };
  }
  if (category === 'power') {
    return { process: 'Automated Battery Cell Ultrasonic Welding', leadWeeks: 2 };
  }
  if (materialType === 'anodized_aluminum' || materialType === 'polished_metal' || materialType === 'steel_beam') {
    return { process: '5-Axis High-Speed CNC Milling', leadWeeks: 1 };
  }
  if (materialType === 'carbon_fiber') {
    return { process: 'Pre-preg Autoclave Compression Molding', leadWeeks: 4 };
  }
  if (materialType === 'matte_plastic' || materialType === 'rubber_grip') {
    return { process: 'Precision High-Pressure Injection Molding', leadWeeks: 2 };
  }
  if (category === 'fastener') {
    return { process: 'Cold-Headed Thread Rolling (Off-The-Shelf)', leadWeeks: 1 };
  }
  return { process: 'Additive DMLS / Subtractive CNC', leadWeeks: 2 };
}

// Generate supplier SKU from name and material
function generateSKU(obj: CADObject, index: number): string {
  const catCode = (obj.category || 'GEN').substring(0, 3).toUpperCase();
  const matCode = (obj.material?.type || 'MAT').substring(0, 3).toUpperCase();
  const hex = (index + 101).toString(16).toUpperCase();
  return `CAD-${catCode}-${matCode}-#${hex}`;
}

export function generateBOMReport(
  objects: CADObject[],
  assemblyName: string = 'CAD Engineered Assembly',
  author: string = 'Lead Mechanical Engineer'
): BOMReportSummary {
  const items: BOMRowItem[] = objects.map((obj, idx) => {
    const dim = obj.dimensions;
    const w = dim?.width ?? 10;
    const h = dim?.height ?? 10;
    const d = dim?.depth ?? 10;

    // Approximate volume in cm3 (dimensions are in mm, so mm3 / 1000)
    let volMm3 = w * h * d;
    if (obj.primitive === 'cylinder' || obj.primitive === 'screw_head') {
      const r = (dim.radius || w / 2);
      volMm3 = Math.PI * r * r * (dim.height || h);
    } else if (obj.primitive === 'sphere') {
      const r = (dim.radius || w / 2);
      volMm3 = (4 / 3) * Math.PI * Math.pow(r, 3);
    }
    const unitVolCm3 = Math.max(0.01, parseFloat((volMm3 / 1000).toFixed(3)));

    const matType = obj.material?.type || 'matte_plastic';
    const density = MATERIAL_DENSITY_MAP[matType] || 1.2;
    const unitMassG = parseFloat((unitVolCm3 * density).toFixed(2));

    const { process, leadWeeks } = inferManufacturingProcess(obj.category, matType);

    // Cost heuristic: raw material volume + complexity modifier
    let baseRate = 0.85;
    if (matType === 'anodized_aluminum') baseRate = 1.4;
    else if (matType === 'carbon_fiber') baseRate = 3.2;
    else if (matType === 'clear_glass' || matType === 'tinted_glass') baseRate = 2.1;
    else if (matType === 'gold_trace' || matType === 'copper') baseRate = 4.5;
    else if (obj.category === 'optics') baseRate = 3.8;
    else if (obj.category === 'pcb') baseRate = 2.8;

    const unitCost = Math.max(0.5, parseFloat((unitVolCm3 * baseRate + 2.5).toFixed(2)));

    return {
      id: `bom_${obj.id}`,
      partId: obj.id,
      itemNumber: idx + 1,
      name: obj.name,
      category: obj.category.toUpperCase(),
      materialName: obj.material?.name || 'Standard Alloy',
      materialType: matType,
      quantity: 1,
      dimensionsFormatted: `${w.toFixed(1)} × ${h.toFixed(1)} × ${d.toFixed(1)} mm`,
      unitVolumeCm3: unitVolCm3,
      totalVolumeCm3: unitVolCm3,
      densityGPerCm3: density,
      unitMassGrams: unitMassG,
      totalMassGrams: unitMassG,
      unitCostUsd: unitCost,
      totalCostUsd: unitCost,
      supplierSKU: generateSKU(obj, idx),
      manufacturingProcess: process,
      leadTimeWeeks: leadWeeks,
      status: obj.category === 'fastener' ? 'off_the_shelf' : 'approved',
    };
  });

  const totalMassGrams = items.reduce((acc, i) => acc + i.totalMassGrams, 0);
  const totalCostUsd = parseFloat(items.reduce((acc, i) => acc + i.totalCostUsd, 0).toFixed(2));

  // Subsystem breakdown
  const catMap = new Map<string, { count: number; mass: number; cost: number }>();
  items.forEach(item => {
    const c = item.category;
    const current = catMap.get(c) || { count: 0, mass: 0, cost: 0 };
    current.count += item.quantity;
    current.mass += item.totalMassGrams;
    current.cost += item.totalCostUsd;
    catMap.set(c, current);
  });

  const categoryBreakdown = Array.from(catMap.entries()).map(([category, stats]) => ({
    category,
    partCount: stats.count,
    totalMassGrams: parseFloat(stats.mass.toFixed(1)),
    totalCostUsd: parseFloat(stats.cost.toFixed(2)),
  }));

  return {
    assemblyName,
    generatedDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    author,
    totalComponents: items.length,
    uniqueParts: items.length,
    totalMassKg: parseFloat((totalMassGrams / 1000).toFixed(3)),
    totalCostUsd,
    currency: 'USD',
    items,
    categoryBreakdown,
  };
}

export function exportBOMToCSV(bom: BOMReportSummary): string {
  const headers = [
    'Item #',
    'Part Name',
    'Category',
    'Material',
    'SKU / Part Number',
    'Qty',
    'Dimensions (W x H x D)',
    'Unit Volume (cm3)',
    'Unit Mass (g)',
    'Total Mass (g)',
    'Unit Cost ($)',
    'Total Cost ($)',
    'Manufacturing Process',
    'Lead Time (Weeks)',
    'Status',
  ];

  const rows = bom.items.map(i => [
    i.itemNumber,
    `"${i.name.replace(/"/g, '""')}"`,
    i.category,
    `"${i.materialName}"`,
    i.supplierSKU,
    i.quantity,
    `"${i.dimensionsFormatted}"`,
    i.unitVolumeCm3,
    i.unitMassGrams,
    i.totalMassGrams,
    i.unitCostUsd,
    i.totalCostUsd,
    `"${i.manufacturingProcess}"`,
    i.leadTimeWeeks,
    i.status,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generatePrintableBOMHTML(bom: BOMReportSummary): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${bom.assemblyName} - Bill of Materials (BOM)</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 32px;
      color: #0f172a;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin: 0 0 4px 0;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .meta-box {
      text-align: right;
      font-size: 12px;
      color: #475569;
      line-height: 1.6;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .kpi-val {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      font-family: monospace;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 32px;
    }
    th {
      background: #0f172a;
      color: #ffffff;
      text-align: left;
      padding: 8px 10px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .sku {
      font-family: monospace;
      color: #3b82f6;
      font-weight: 600;
    }
    .approval-section {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #cbd5e1;
      font-size: 11px;
    }
    .sign-line {
      border-bottom: 1px dashed #94a3b8;
      height: 36px;
      margin-bottom: 6px;
    }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${bom.assemblyName}</h1>
      <p class="subtitle">Official Engineering Bill of Materials & Procurement Datasheet</p>
    </div>
    <div class="meta-box">
      <div><strong>Date:</strong> ${bom.generatedDate}</div>
      <div><strong>Author:</strong> ${bom.author}</div>
      <div><strong>Classification:</strong> Engineering Standard Level 3</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Components</div>
      <div class="kpi-val">${bom.totalComponents} Parts</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Assembly Net Mass</div>
      <div class="kpi-val">${(bom.totalMassKg * 1000).toFixed(1)} g (${bom.totalMassKg} kg)</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Estimated BOM Cost</div>
      <div class="kpi-val">$${bom.totalCostUsd.toLocaleString()} ${bom.currency}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Subsystems Count</div>
      <div class="kpi-val">${bom.categoryBreakdown.length} Categories</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Part Name</th>
        <th>Subsystem</th>
        <th>Material</th>
        <th>SKU Code</th>
        <th>Qty</th>
        <th>Dimensions</th>
        <th>Mass (g)</th>
        <th>Unit ($)</th>
        <th>Total ($)</th>
        <th>Process</th>
        <th>Lead</th>
      </tr>
    </thead>
    <tbody>
      ${bom.items
        .map(
          item => `
        <tr>
          <td><strong>${item.itemNumber}</strong></td>
          <td><strong>${item.name}</strong></td>
          <td>${item.category}</td>
          <td>${item.materialName}</td>
          <td class="sku">${item.supplierSKU}</td>
          <td>${item.quantity}</td>
          <td>${item.dimensionsFormatted}</td>
          <td>${item.unitMassGrams}g</td>
          <td>$${item.unitCostUsd.toFixed(2)}</td>
          <td><strong>$${item.totalCostUsd.toFixed(2)}</strong></td>
          <td>${item.manufacturingProcess}</td>
          <td>${item.leadTimeWeeks}w</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="approval-section">
    <div>
      <div class="sign-line"></div>
      <div><strong>Prepared By:</strong> ${bom.author}</div>
      <div style="color: #64748b; font-size: 10px;">Mechanical CAD Engineer</div>
    </div>
    <div>
      <div class="sign-line"></div>
      <div><strong>Checked & Verified:</strong> Lead Systems Architect</div>
      <div style="color: #64748b; font-size: 10px;">Manufacturing Engineering</div>
    </div>
    <div>
      <div class="sign-line"></div>
      <div><strong>BOM Signoff / Purchase Approval:</strong> Director of Hardware</div>
      <div style="color: #64748b; font-size: 10px;">Hardware Procurement Operations</div>
    </div>
  </div>
</body>
</html>`;
}

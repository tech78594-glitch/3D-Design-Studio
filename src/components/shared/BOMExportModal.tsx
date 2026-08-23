import React, { useState, useMemo } from 'react';
import { CADObject, BOMReportSummary, BOMRowItem } from '../../types/cad';
import { generateBOMReport, exportBOMToCSV, generatePrintableBOMHTML } from '../../utils/bomGenerator';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Copy,
  Check,
  Search,
  Filter,
  DollarSign,
  Scale,
  Layers,
  Box,
  FileCode,
  X,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface BOMExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  objects: CADObject[];
  assemblyName?: string;
}

export const BOMExportModal: React.FC<BOMExportModalProps> = ({
  isOpen,
  onClose,
  objects,
  assemblyName = 'Precision CAD Assembly',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [authorName, setAuthorName] = useState('Lead CAD Hardware Engineer');
  const [copied, setCopied] = useState(false);

  const bom: BOMReportSummary = useMemo(() => {
    return generateBOMReport(objects, assemblyName, authorName);
  }, [objects, assemblyName, authorName]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(bom.items.map(i => i.category)));
    return ['ALL', ...cats];
  }, [bom]);

  const filteredItems = useMemo(() => {
    return bom.items.filter(item => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplierSKU.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.materialName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [bom, selectedCategory, searchTerm]);

  const handleDownloadCSV = () => {
    const csvContent = exportBOMToCSV(bom);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BOM_Report_${assemblyName.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(bom, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BOM_Structured_${assemblyName.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintOrPreviewDatasheet = () => {
    const htmlContent = generatePrintableBOMHTML(bom);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
    } else {
      // Fallback download
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BOM_Datasheet_${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyMarkdown = () => {
    const mdHeaders = '| # | Part Name | Category | Material | SKU | Qty | Dimensions | Mass (g) | Cost ($) |\n|---|---|---|---|---|---|---|---|---|\n';
    const mdRows = bom.items
      .map(
        i =>
          `| ${i.itemNumber} | ${i.name} | ${i.category} | ${i.materialName} | \`${i.supplierSKU}\` | ${i.quantity} | ${i.dimensionsFormatted} | ${i.unitMassGrams}g | $${i.unitCostUsd.toFixed(2)} |`
      )
      .join('\n');

    navigator.clipboard.writeText(mdHeaders + mdRows);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-6xl h-[92vh] max-h-[900px] shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                Engineering Bill of Materials (BOM)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                  {bom.totalComponents} Items (${bom.totalCostUsd})
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Itemized parts classification, material properties, volume & mass modeling, manufacturing processes, and supplier procurement specs
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
              title="Copy Markdown table to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              <span>{copied ? 'Copied' : 'Copy MD'}</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 transition-colors"
              title="Export standard CSV format for Excel/Google Sheets"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
              title="Export structured JSON CAD schema"
            >
              <FileCode className="w-4 h-4 text-indigo-400" />
              <span>JSON</span>
            </button>

            <button
              onClick={handlePrintOrPreviewDatasheet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
              title="Print official engineering datasheet / Open in new window"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print Datasheet</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-4 gap-3 px-6 py-3 bg-zinc-950/40 border-b border-zinc-800/80 text-xs">
          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-400 block">Total Assembly Mass</span>
              <span className="text-base font-bold font-mono text-zinc-100">
                {(bom.totalMassKg * 1000).toFixed(1)} g <span className="text-xs text-zinc-500 font-normal">({bom.totalMassKg} kg)</span>
              </span>
            </div>
            <Scale className="w-5 h-5 text-blue-400" />
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-400 block">Total Est. Production Cost</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                ${bom.totalCostUsd} <span className="text-xs text-zinc-500 font-normal">USD</span>
              </span>
            </div>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-400 block">Unique Components</span>
              <span className="text-base font-bold font-mono text-indigo-400">
                {bom.uniqueParts} parts
              </span>
            </div>
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-zinc-400 block">Subsystem Categories</span>
              <span className="text-base font-bold font-mono text-amber-400">
                {bom.categoryBreakdown.length} subsystems
              </span>
            </div>
            <Box className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-zinc-950/60 border-b border-zinc-800 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search part, SKU, material..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold bg-zinc-950/80 sticky top-0 z-10 backdrop-blur-md">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Component Name</th>
                <th className="py-2.5 px-3">Subsystem</th>
                <th className="py-2.5 px-3">Material</th>
                <th className="py-2.5 px-3">Supplier SKU</th>
                <th className="py-2.5 px-3">Dimensions</th>
                <th className="py-2.5 px-3 text-right">Mass (g)</th>
                <th className="py-2.5 px-3 text-right">Unit ($)</th>
                <th className="py-2.5 px-3">Mfg Process</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-zinc-500 font-bold">{item.itemNumber}</td>
                  <td className="py-2.5 px-3 font-semibold text-zinc-100">{item.name}</td>
                  <td className="py-2.5 px-3 text-zinc-400">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/60 text-[10px] font-mono">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300">{item.materialName}</td>
                  <td className="py-2.5 px-3 font-mono text-cyan-400 text-[11px]">{item.supplierSKU}</td>
                  <td className="py-2.5 px-3 font-mono text-zinc-400 text-[11px]">{item.dimensionsFormatted}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-200">{item.unitMassGrams}g</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">${item.unitCostUsd.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-zinc-400 text-[11px]">{item.manufacturingProcess}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.status === 'off_the_shelf'
                          ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {item.status === 'off_the_shelf' ? 'OTS Stock' : 'Approved'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="p-12 text-center text-zinc-500 text-xs">
              No component matches found for current filter criteria.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
          <span>Standard ASME Y14.34 BOM Compliance Schema • Total: {bom.items.length} items</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold"
          >
            Close BOM Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

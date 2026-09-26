// Generates the two FICTITIOUS tender PDFs used to demo the AI checklist.
// Run: node scripts/make-demo-pdfs.mjs  -> public/demo/*.pdf
// Part numbers come from the seeded products table; some lines deliberately have none,
// so the AI must leave them blank and list them under uncertainties.
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs";

const PARTS = [["IP-0001-A","Circular Connector Assembly, Type A","Nos"],["IP-0002-B","Circular Connector Assembly, Type B","Nos"],["IP-0003-C","Circular Connector Assembly, Type C","Nos"],["IP-0004-D","Circular Connector Assembly, Type D","Nos"],["IP-0005-E","Circular Connector Assembly, Type E","Nos"],["IP-0006-F","Circular Connector Assembly, Type F","Nos"],["IP-0007-A","Hydraulic Seal Kit, Type A","Set"],["IP-0008-B","Hydraulic Seal Kit, Type B","Set"],["IP-0009-C","Hydraulic Seal Kit, Type C","Set"],["IP-0010-D","Hydraulic Seal Kit, Type D","Set"],["IP-0011-E","Hydraulic Seal Kit, Type E","Set"],["IP-0012-F","Hydraulic Seal Kit, Type F","Set"],["IP-0013-A","Cable Harness Assembly, Type A","Nos"],["IP-0014-B","Cable Harness Assembly, Type B","Nos"],["IP-0015-C","Cable Harness Assembly, Type C","Nos"],["IP-0016-D","Cable Harness Assembly, Type D","Nos"],["IP-0017-E","Cable Harness Assembly, Type E","Nos"],["IP-0018-F","Cable Harness Assembly, Type F","Nos"],["IP-0019-A","Bearing Assembly, Type A","Nos"],["IP-0020-B","Bearing Assembly, Type B","Nos"],["IP-0021-C","Bearing Assembly, Type C","Nos"],["IP-0022-D","Bearing Assembly, Type D","Nos"],["IP-0023-E","Bearing Assembly, Type E","Nos"],["IP-0024-F","Bearing Assembly, Type F","Nos"],["IP-0025-A","Filter Element, Type A","Nos"],["IP-0026-B","Filter Element, Type B","Nos"],["IP-0027-C","Filter Element, Type C","Nos"],["IP-0028-D","Filter Element, Type D","Nos"],["IP-0029-E","Filter Element, Type E","Nos"],["IP-0030-F","Filter Element, Type F","Nos"],["IP-0031-A","Solenoid Valve Assembly, Type A","Nos"],["IP-0032-B","Solenoid Valve Assembly, Type B","Nos"],["IP-0033-C","Solenoid Valve Assembly, Type C","Nos"],["IP-0034-D","Solenoid Valve Assembly, Type D","Nos"],["IP-0035-E","Solenoid Valve Assembly, Type E","Nos"],["IP-0036-F","Solenoid Valve Assembly, Type F","Nos"],["IP-0037-A","Gear Pump, Type A","Nos"],["IP-0038-B","Gear Pump, Type B","Nos"],["IP-0039-C","Gear Pump, Type C","Nos"],["IP-0040-D","Gear Pump, Type D","Nos"],["IP-0041-E","Gear Pump, Type E","Nos"],["IP-0042-F","Gear Pump, Type F","Nos"],["IP-0043-A","Power Relay Unit, Type A","Nos"],["IP-0044-B","Power Relay Unit, Type B","Nos"],["IP-0045-C","Power Relay Unit, Type C","Nos"]];

const DOCS = [
  "Copy of GST registration certificate",
  "Udyam (MSME) registration certificate",
  "OEM authorisation letter for each quoted item",
  "ISO 9001 certificate of the OEM",
  "Past supply orders for similar items (last 3 years)",
  "Signed technical compliance statement",
];
const CHECKS = [
  "EMD bank guarantee of Rs 2,00,000 (sample) enclosed in the technical bid",
  "Every page of the tender booklet signed and stamped",
  "Price bid uploaded separately on the portal",
  "Delivery period undertaking (120 days from PO) signed",
  "Bid validity of 180 days confirmed",
];

function lines(n, seed) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const [pn, name, uom] = PARTS[(i * 7 + seed) % PARTS.length];
    // Every 6th line has no part number in the document.
    const blank = i % 6 === 4;
    out.push({ sno: i + 1, pn: blank ? "" : pn, desc: blank ? name + " (part number to be confirmed)" : name, qty: 10 + ((i * 13 + seed) % 90), uom });
  }
  return out;
}

async function make(file, ref, title, items) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595, 842]);
  let y = 800;
  const text = (s, x, size = 10, f = font) => page.drawText(s, { x, y, size, font: f, color: rgb(0, 0, 0) });
  const newPageIfNeeded = () => {
    if (y < 60) {
      page = pdf.addPage([595, 842]);
      y = 800;
    }
  };
  const para = (s, size = 10, f = font) => {
    newPageIfNeeded();
    text(s, 40, size, f);
    y -= size + 6;
  };

  para("FICTITIOUS DEMO DOCUMENT - NOT A REAL TENDER", 9, bold);
  para("Directorate of Demo Procurement (fictitious)", 14, bold);
  para("Tender enquiry " + ref + "   Date: 01 Oct 2026   Bid due: 31 Oct 2026");
  para(title, 12, bold);
  y -= 6;
  para("1. Schedule of requirements", 11, bold);
  const header = () => {
    text("S.No", 40, 9, bold); text("Part No.", 75, 9, bold); text("Description", 160, 9, bold);
    text("Qty", 470, 9, bold); text("Unit", 510, 9, bold);
    y -= 14;
  };
  header();
  for (const it of items) {
    if (y < 60) { page = pdf.addPage([595, 842]); y = 800; header(); }
    text(String(it.sno), 40, 9); text(it.pn || "-", 75, 9); text(it.desc.slice(0, 58), 160, 9);
    text(String(it.qty), 470, 9); text(it.uom, 510, 9);
    y -= 13;
  }
  y -= 10;
  para("2. Documents to be submitted with the technical bid", 11, bold);
  DOCS.forEach((d, i) => para("  (" + String.fromCharCode(97 + i) + ") " + d));
  y -= 6;
  para("3. Submission instructions", 11, bold);
  CHECKS.forEach((c, i) => para("  " + (i + 1) + ". " + c));
  y -= 6;
  para("4. Delivery: 120 days from date of purchase order. LD as per standard clause (sample).");
  para("Where a part number is shown as '-', bidders shall confirm it with the buyer before quoting.", 9);
  fs.writeFileSync(file, await pdf.save());
  console.log("wrote", file, items.length, "lines");
}

await make("public/demo/demo-tender-5-lines.pdf", "DEMO/TE/2026/005", "Supply of connector and relay spares (5 items)", lines(5, 0));
await make("public/demo/demo-tender-40-lines.pdf", "DEMO/TE/2026/040", "Supply of vehicle and avionics spares (40 items)", lines(40, 3));

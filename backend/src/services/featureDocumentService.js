import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR, deleteAttachmentFile } from '../config/upload.js';
import * as db from '../db/index.js';

const PRIORITY_LABEL = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  critical: 'Critique',
};

function sanitizeName(name) {
  return (name || 'fonctionnalite')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function buildPdf(doc, feature, campaignName, testCases) {
  doc.fontSize(18).font('Helvetica-Bold').text('Fiche de test', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica-Bold').text(feature.name, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10).font('Helvetica').fillColor('#444444')
    .text(`${campaignName || ''}${campaignName ? '  ·  ' : ''}Module : ${feature.module || '—'}`, { align: 'center' });
  doc.fillColor('black');
  doc.moveDown(0.6);

  doc.fontSize(10).font('Helvetica').text(`Priorité : ${PRIORITY_LABEL[feature.priority] || feature.priority}`, { align: 'left' });
  if (feature.description) {
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').text(`Description : ${feature.description}`);
  }
  doc.moveDown(0.8);

  doc.fontSize(12).font('Helvetica-Bold').text(`Cas de test (${testCases.length})`);
  doc.moveDown(0.4);

  if (testCases.length === 0) {
    doc.fontSize(10).font('Helvetica').fillColor('#666666')
      .text('Aucun cas de test associé à cette fonctionnalité pour le moment.');
    return;
  }

  testCases.forEach((tc, i) => {
    doc.fillColor('#1f2937');
    doc.fontSize(11).font('Helvetica-Bold')
      .text(`${i + 1}. ${tc.name || `TC-${tc.id}`}  —  Priorité : ${PRIORITY_LABEL[tc.priority] || tc.priority}`);
    doc.moveDown(0.2);
    if (tc.description || tc.steps) {
      doc.fontSize(10).font('Helvetica').fillColor('#374151');
      doc.text('Étapes :');
      doc.moveDown(0.1);
      doc.text(tc.steps || tc.description || '—');
      doc.moveDown(0.2);
    }
    if (tc.expected_result) {
      doc.text('Résultat attendu :');
      doc.moveDown(0.1);
      doc.text(tc.expected_result);
    }
    doc.moveDown(0.6);
  });
}

/**
 * Génère automatiquement le document PDF des cas de test d'une fonctionnalité
 * et le stocke comme pièce jointe (remplace une éventuelle pièce existante).
 * @param {number} featureId
 * @returns {Promise<object|null>} La fonctionnalité mise à jour, ou null si aucun cas de test
 */
export async function generateFeatureDocument(featureId) {
  const feature = await db.features.findById(featureId);
  if (!feature) return null;

  const testCases = await db.testCases.list(featureId, undefined);
  if (!testCases || testCases.length === 0) return null;

  const campaign = feature.campaign_id
    ? await db.campaigns.findById(feature.campaign_id).catch(() => null)
    : null;

  const fileName = sanitizeName(feature.name);
  const filePath = path.join(UPLOAD_DIR, `${fileName}-cas-test-${Date.now()}.pdf`);
  const attachmentName = `${fileName}-cas-test.pdf`;

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 45 });
    const stream = fs.createWriteStream(filePath);
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);
    doc.pipe(stream);
    buildPdf(doc, feature, campaign?.name || null, testCases);
    doc.end();
  });

  if (feature.attachment_path) deleteAttachmentFile(feature.attachment_path);

  return db.features.setAttachment(featureId, {
    path: filePath,
    name: attachmentName,
    type: 'application/pdf',
    size: fs.statSync(filePath).size,
  });
}

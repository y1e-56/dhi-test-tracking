import { AppError } from '../middleware/errorHandler.js';
import * as db from '../db/index.js';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.resolve('uploads/evidence');

export async function listEvidencePaginated(filters = {}) {
  return db.evidence.findByEntityPaginated(filters);
}

export async function listByEntity(entityType, entityId) {
  return db.evidence.findByEntity(entityType, entityId);
}

export async function getEvidence(id) {
  const ev = await db.evidence.findById(id);
  if (!ev) throw new AppError('Preuve non trouvée', 404);
  return ev;
}

/**
 * Resout le chemin du fichier d'une preuve en refusant toute sortie du dossier
 * d'upload. `file_path` peut provenir du corps de la requete (createEvidence
 * accepte un depot sans fichier), il ne doit donc jamais autoriser la lecture
 * d'un fichier arbitraire du serveur.
 */
export function resolveEvidenceFile(ev) {
  if (!ev.file_path) {
    throw new AppError('Aucun fichier joint à cette preuve', 404);
  }
  const absolute = path.resolve(ev.file_path);
  if (absolute !== UPLOAD_DIR && !absolute.startsWith(UPLOAD_DIR + path.sep)) {
    throw new AppError('Chemin de fichier invalide', 400);
  }
  if (!fs.existsSync(absolute)) {
    throw new AppError('Fichier indisponible sur le serveur', 404);
  }
  return absolute;
}

/** Preuve + chemin absolu verifie, pour le telechargement. */
export async function getEvidenceFile(id) {
  const ev = await getEvidence(id);
  return { ev, absolutePath: resolveEvidenceFile(ev) };
}

/**
 * Nom de fichier propose au telechargement : on ne garde que le nom de base,
 * sans séparateur ni caractere de controle, pour ne jamais injecter d'en-tete.
 */
export function sanitizeDownloadName(name) {
  if (!name) return 'preuve';
  const base = path.basename(String(name)).replace(/[\r\n"\\/]/g, '').trim();
  return base || 'preuve';
}

export async function createEvidence(data, file = null) {
  if (!data.entity_type) throw new AppError('entity_type requis', 400);
  if (!data.entity_id) throw new AppError('entity_id requis', 400);

  const fileData = file ? {
    file_path: file.path,
    file_name: file.originalname,
    file_type: file.mimetype,
    file_size: String(file.size),
  } : {
    file_path: data.file_path,
    file_name: data.file_name,
    file_type: data.file_type || null,
    file_size: data.file_size || null,
  };

  return db.evidence.create({
    ...data,
    ...fileData,
  });
}

export async function deleteEvidence(id) {
  const ev = await db.evidence.findById(id);
  if (!ev) throw new AppError('Preuve non trouvée', 404);

  // Meme garde-fou que le telechargement : un file_path forgé ne doit pas
  // permettre de supprimer un fichier hors du dossier d'upload.
  if (ev.file_path) {
    const absolute = path.resolve(ev.file_path);
    const inside = absolute === UPLOAD_DIR || absolute.startsWith(UPLOAD_DIR + path.sep);
    if (inside && fs.existsSync(absolute)) {
      fs.unlinkSync(absolute);
    }
  }

  return db.evidence.remove(id);
}

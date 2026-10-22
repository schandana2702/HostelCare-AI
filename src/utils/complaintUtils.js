/**
 * HostelCare AI - Complaint Reference & Formatting Utilities
 *
 * Provides stable, human-friendly ticket references across student,
 * warden, maintenance, and administrator views while preserving the
 * internal Firestore document ID for routing, authorization, and updates.
 */

/**
 * Returns a stable, human-friendly complaint reference (e.g. "HC-EIPQKG" or "HC-2026-001").
 *
 * Integrity rules:
 * 1. If the record already possesses a ticketId, referenceId, or complaintNumber, reuses it.
 * 2. If the ID is already prefixed with "HC-", preserves it.
 * 3. For raw 20-character Firestore auto-IDs (e.g. "eiPqKgLWCBuVEBExyvnu"),
 *    deterministically derives an uppercase reference "HC-" + first 6 alphanumeric chars.
 * 4. Pure and deterministic: identical input guarantees identical reference after refresh.
 * 5. Contains no private student PII.
 *
 * @param {string|object} complaintOrId - A complaint record or raw Firestore document ID string.
 * @returns {string} - Stable reference, e.g. "HC-EIPQKG".
 */
export function getFriendlyComplaintId(complaintOrId) {
  if (!complaintOrId) return 'HC-TICKET';

  if (typeof complaintOrId === 'object' && complaintOrId !== null) {
    if (typeof complaintOrId.ticketId === 'string' && complaintOrId.ticketId.trim()) {
      return complaintOrId.ticketId.trim().toUpperCase();
    }
    if (typeof complaintOrId.referenceId === 'string' && complaintOrId.referenceId.trim()) {
      return complaintOrId.referenceId.trim().toUpperCase();
    }
    if (typeof complaintOrId.complaintNumber === 'string' && complaintOrId.complaintNumber.trim()) {
      return complaintOrId.complaintNumber.trim().toUpperCase();
    }
    return getFriendlyComplaintId(complaintOrId.id);
  }

  const rawId = String(complaintOrId).trim();
  if (!rawId) return 'HC-TICKET';

  // Already human-friendly format (e.g. "HC-2026-001" or "HC-ABC123")
  if (/^HC-[\w-]+$/i.test(rawId)) {
    return rawId.toUpperCase();
  }

  // Deterministically format raw 20-char Firestore ID (e.g. "eiPqKgLWCBuVEBExyvnu" -> "HC-EIPQKG")
  const clean = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const prefix = clean.slice(0, 6).toUpperCase();
  return prefix ? `HC-${prefix}` : 'HC-TICKET';
}

import { isFirebaseConfigured, db, auth } from './firebase.js';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { uploadComplaintImage } from './storageService.js';
import { auditService } from './auditService.js';

export const complaintService = {
  /**
   * Fetch complaints from Cloud Firestore with optional server-side and
   * client-side filters.
   *
   * Server-side filter (uses Firestore index):
   *   studentId     — returns only the student's own complaints
   *   assignedToId  — returns only complaints assigned to the staff member
   *
   * Client-side filters (applied after fetch to avoid composite-index limits):
   *   status, priority, category, search
   *
   * NOTE: The query `where('studentId', ...) + orderBy('createdAt', 'desc')`
   * requires a composite index in Firestore.
   * Deploy it with: firebase deploy --only firestore:indexes
   * or create it manually in the Firebase Console.
   */
  async getComplaints(filter = {}) {
    if (!isFirebaseConfigured || !db) {
      throw new Error(
        'Firebase is not configured. Cannot load complaints.'
      );
    }

    let qRef;
    let snapshot;

    if (filter.studentId) {
      // Query Firestore strictly for the current student's complaints.
      // Filtering by studentId uses Firestore's automatic single-field index.
      qRef = query(collection(db, 'complaints'), where('studentId', '==', filter.studentId));
      snapshot = await getDocs(qRef);
    } else if (filter.assignedToId) {
      // Query Firestore strictly for complaints assigned to this staff member.
      qRef = query(collection(db, 'complaints'), where('assignedToId', '==', filter.assignedToId));
      snapshot = await getDocs(qRef);
    } else {
      // For admin/warden overview of all complaints: try with server-side orderBy,
      // but if documents lack createdAt or an index is missing, safely fall back
      // to collection(db, 'complaints'). In-memory sorting below ensures precise order.
      try {
        qRef = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
        snapshot = await getDocs(qRef);
      } catch {
        qRef = collection(db, 'complaints');
        snapshot = await getDocs(qRef);
      }
    }
    let list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Ensure newest-first sorting across all timestamp formats (Timestamp object, ISO string, etc.)
    list.sort((a, b) => {
      const getMs = (v) => {
        if (!v) return 0;
        if (typeof v.toMillis === 'function') return v.toMillis();
        if (typeof v.seconds === 'number') return v.seconds * 1000;
        const parsed = new Date(v).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };
      return getMs(b.createdAt) - getMs(a.createdAt);
    });

    // Client-side secondary filters
    if (filter.hostelBlock && filter.hostelBlock !== 'All Hostels') {
      list = list.filter((c) => c.hostelBlock === filter.hostelBlock);
    }
    if (filter.status && filter.status !== 'ALL') {
      list = list.filter((c) => c.status === filter.status);
    }
    if (filter.priority && filter.priority !== 'ALL') {
      list = list.filter((c) => c.priority === filter.priority);
    }
    if (filter.category && filter.category !== 'ALL') {
      list = list.filter((c) => c.category === filter.category);
    }
    if (filter.search) {
      const s = filter.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.id && String(c.id).toLowerCase().includes(s)) ||
          (c.title && String(c.title).toLowerCase().includes(s)) ||
          (c.roomNumber && String(c.roomNumber).toLowerCase().includes(s)) ||
          (c.studentName && String(c.studentName).toLowerCase().includes(s)) ||
          (c.hostelBlock && String(c.hostelBlock).toLowerCase().includes(s)) ||
          (c.category && String(c.category).toLowerCase().includes(s))
      );
    }
    return list;
  },

  /**
   * Fetch a single complaint document by its Firestore document ID.
   * Returns null if the document does not exist.
   */
  async getComplaintById(id) {
    if (!id) return null;
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot load complaint.');
    }
    const docRef = doc(db, 'complaints', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  },

  /**
   * Create a new complaint document in Firestore.
   * The studentId in complaintData MUST be the authenticated user's Firebase UID —
   * this is enforced by the Firestore security rule:
   *   allow create: if request.resource.data.studentId == request.auth.uid
   */
  async createComplaint(complaintData, actor = {}) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot create complaint.');
    }
    const docData = {
      ...complaintData,
      status: 'SUBMITTED',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      history: [
        {
          status: 'SUBMITTED',
          timestamp: new Date().toISOString(),
          actorName: actor.name || complaintData.studentName || 'Student',
          note: 'Complaint submitted via web portal.'
        }
      ]
    };
    const docRef = await addDoc(collection(db, 'complaints'), docData);
    return { id: docRef.id, ...docData };
  },

  // Warden acknowledges review of complaint: SUBMITTED -> PENDING
  // Warden acknowledges review of complaint: SUBMITTED → PENDING
  async acknowledgeComplaint(complaintId, notes, actor = {}) {
    if (actor.role && !['warden', 'admin', 'administrator'].includes(actor.role)) {
      throw new Error('Only a Warden or Administrator can review and acknowledge complaints.');
    }
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }

    const docRef = doc(db, 'complaints', complaintId);
    const snap = await getDoc(docRef);
    const current = snap.data() || {};
    const history = [...(current.history || [])];
    history.push({
      status: 'PENDING',
      timestamp: new Date().toISOString(),
      actorName: actor.name || 'Warden',
      note: notes || 'Acknowledged by Warden.'
    });
    const updates = {
      status: 'PENDING',
      statusNote: notes || 'Reviewed and acknowledged by Warden. Queued for staff assignment.',
      history,
      updatedAt: serverTimestamp()
    };
    await updateDoc(docRef, updates);
    return { id: complaintId, ...current, ...updates };
  },

  // Assign or reassign complaint to maintenance staff
  async assignComplaint(complaintId, staffUser, notes, newPriority, actor = {}, overrideReason = '') {
    if (actor.role && !['warden', 'admin', 'administrator'].includes(actor.role)) {
      throw new Error('Only a Warden or Administrator can assign complaints.');
    }
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }

    const docRef = doc(db, 'complaints', complaintId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Complaint #${complaintId} was not found.`);
    }
    const current = snap.data() || {};
    const history = [...(current.history || [])];

    // Detect if priority is being changed during assignment
    const isPriorityOverridden = Boolean(newPriority && current.priority && newPriority !== current.priority);
    let overrideRecord = current.wardenPriorityOverride || null;

    if (isPriorityOverridden) {
      const cleanReason = (overrideReason && overrideReason.trim()) || `Adjusted priority from ${current.priority} to ${newPriority} during staff assignment.`;
      overrideRecord = {
        previousPriority: current.priority,
        overriddenPriority: newPriority,
        reason: cleanReason,
        overriddenBy: actor.uid || auth?.currentUser?.uid || '',
        overriddenByName: actor.name || 'Warden',
        overriddenAt: new Date().toISOString()
      };
      history.push({
        status: 'ASSIGNED',
        timestamp: new Date().toISOString(),
        actorName: actor.name || 'Warden',
        note: `Assigned to ${staffUser.displayName}. Priority explicitly overridden: ${current.priority} → ${newPriority} ("${cleanReason}"). ${notes || ''}`
      });
    } else {
      history.push({
        status: 'ASSIGNED',
        timestamp: new Date().toISOString(),
        actorName: actor.name || 'Warden',
        note: `Assigned to ${staffUser.displayName}. ${notes || ''}`
      });
    }

    const updates = {
      status: 'ASSIGNED',
      assignedToId: staffUser.uid,
      assignedToName: staffUser.displayName,
      assignedAt: new Date().toISOString(),
      statusNote: notes || `Assigned to ${staffUser.displayName}`,
      history,
      updatedAt: serverTimestamp()
    };

    // Preserve initial submitted priority if not already recorded
    if (!current.initialPriority) {
      updates.initialPriority = current.priority || 'MEDIUM';
    }

    if (newPriority) {
      updates.priority = newPriority;
    }
    if (isPriorityOverridden) {
      updates.wardenPriorityOverride = overrideRecord;
    }

    await updateDoc(docRef, updates);
    return { id: complaintId, ...current, ...updates };
  },

  // Update complaint status (e.g. IN_PROGRESS, COMPLETED)
  async updateStatus(complaintId, newStatus, notes, actor = {}) {
    if (actor.role && !['maintenance', 'admin', 'administrator'].includes(actor.role)) {
      throw new Error('Only assigned maintenance technicians or administrators can update repair progress.');
    }
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }

    const docRef = doc(db, 'complaints', complaintId);
    const snap = await getDoc(docRef);
    const current = snap.data() || {};
    const history = [...(current.history || [])];
    history.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      actorName: actor.name || 'Staff',
      note: notes || `Status updated to ${newStatus}`
    });

    const updates = {
      status: newStatus,
      statusNote: notes,
      history,
      updatedAt: serverTimestamp()
    };
    if (notes) updates.workNotes = notes;

    await updateDoc(docRef, updates);
    return { id: complaintId, ...current, ...updates };
  },

  // Warden verification step
  // Warden verification step
  async verifyComplaint(complaintId, isApproved, comments, actor = {}) {
    if (actor.role && !['warden', 'admin', 'administrator'].includes(actor.role)) {
      throw new Error('Only a Warden or Administrator can verify maintenance work.');
    }
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }

    const newStatus = isApproved ? 'AWAITING_VERIFICATION' : 'IN_PROGRESS';
    const note = isApproved
      ? `Warden verified physical work. ${comments || 'Approved for student sign-off.'}`
      : `Warden rejected work quality: ${comments || 'Needs rework.'}`;

    const docRef = doc(db, 'complaints', complaintId);
    const snap = await getDoc(docRef);
    const current = snap.data() || {};
    const history = [...(current.history || [])];
    history.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      actorName: actor.name || 'Warden',
      note
    });

    const updates = {
      status: newStatus,
      verifiedByWarden: isApproved,
      wardenVerificationNotes: comments || '',
      verifiedAt: new Date().toISOString(),
      statusNote: note,
      history,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updates);
    return { id: complaintId, ...current, ...updates };
  },

  // Student resolution confirmation & rating feedback
  async submitFeedback(complaintId, rating, feedbackText = '', actor = {}) {
    if (actor.role && !['student', 'admin', 'administrator'].includes(actor.role)) {
      throw new Error('Only the student resident can submit resolution confirmation and rating.');
    }
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }

    const cleanRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    const cleanFeedback = typeof feedbackText === 'string' ? feedbackText.trim() : '';

    const docRef = doc(db, 'complaints', complaintId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Complaint #${complaintId} was not found.`);
    }
    const current = snap.data() || {};

    // 1. Guard against duplicate closure
    if (current.status === 'CLOSED') {
      throw new Error('This complaint has already been closed and verified.');
    }

    // 2. Validate permitted status transition: must be AWAITING_VERIFICATION
    const isPrivileged = ['admin', 'administrator'].includes(actor.role);
    if (!isPrivileged && current.status !== 'AWAITING_VERIFICATION') {
      throw new Error(
        'Complaint cannot be closed before physical inspection and verification by the hostel warden.'
      );
    }

    // 3. Validate student ownership
    const currentUid = actor.uid || auth?.currentUser?.uid;
    if (!isPrivileged && current.studentId && currentUid && current.studentId !== currentUid) {
      throw new Error('Permission denied: You can only close complaints submitted by your own account.');
    }

    const actorName = actor.name || current.studentName || 'Student';
    const closeNote = cleanFeedback
      ? `Student confirmed resolution with ${cleanRating}-star rating: "${cleanFeedback}"`
      : `Student confirmed resolution with ${cleanRating}-star rating.`;

    const history = [...(current.history || [])];
    history.push({
      status: 'CLOSED',
      timestamp: new Date().toISOString(),
      actorName,
      note: closeNote
    });

    const updates = {
      status: 'CLOSED',
      rating: cleanRating,
      feedback: cleanFeedback,
      closedBy: currentUid || current.studentId || '',
      resolvedAt: new Date().toISOString(),
      closedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      statusNote: closeNote,
      history
    };

    await updateDoc(docRef, updates);

    // Append to system audit trail
    try {
      await auditService.logAction(
        'COMPLAINT_CLOSED',
        {
          displayName: actorName,
          name: actorName,
          role: actor.role || 'student',
          uid: currentUid
        },
        complaintId,
        {
          rating: cleanRating,
          feedback: cleanFeedback,
          hostelBlock: current.hostelBlock || '',
          roomNumber: current.roomNumber || ''
        }
      );
    } catch (auditErr) {
      console.warn('Non-fatal: failed to create audit log on closure:', auditErr);
    }

    return { id: complaintId, ...current, ...updates };
  },

  // Warden manual priority override with transparent reason
  async updateComplaintPriority(complaintId, newPriority, reason, originalRecommendation = null, actor = {}) {
    if (actor.role && !['warden', 'admin', 'administrator'].includes(actor.role)) {
      throw new Error('Only a Warden or Administrator can override complaint priority.');
    }
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }
    if (!reason || !reason.trim()) {
      throw new Error('A documented reason is required when manually overriding complaint priority.');
    }

    const docRef = doc(db, 'complaints', complaintId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Complaint #${complaintId} was not found.`);
    }
    const current = snap.data() || {};
    const history = [...(current.history || [])];

    const overrideRecord = {
      previousPriority: current.priority,
      overriddenPriority: newPriority,
      reason: reason.trim(),
      overriddenBy: actor.uid || auth?.currentUser?.uid || '',
      overriddenByName: actor.name || 'Warden',
      overriddenAt: new Date().toISOString()
    };

    history.push({
      status: current.status,
      timestamp: new Date().toISOString(),
      actorName: actor.name || 'Warden',
      note: `Priority manually updated from ${current.priority} to ${newPriority}. Reason: "${reason.trim()}"`
    });

    const updates = {
      priority: newPriority,
      wardenPriorityOverride: overrideRecord,
      history,
      updatedAt: serverTimestamp()
    };

    if (originalRecommendation) {
      updates.originalPriorityRecommendation = originalRecommendation;
    }

    await updateDoc(docRef, updates);

    try {
      await auditService.logAction('PRIORITY_OVERRIDE', actor, complaintId, {
        from: current.priority,
        to: newPriority,
        reason: reason.trim()
      });
    } catch {
      /* non-fatal */
    }

    return { id: complaintId, ...current, ...updates };
  },

  // Warden confirm or dismiss recurring issue group
  async updateRecurrenceDecision(complaintId, decision, notes = '', actor = {}) {
    if (actor.role && !['warden', 'admin', 'administrator'].includes(actor.role)) {
      throw new Error('Only a Warden or Administrator can update recurrence decisions.');
    }
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }

    const docRef = doc(db, 'complaints', complaintId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error(`Complaint #${complaintId} was not found.`);
    }
    const current = snap.data() || {};
    const history = [...(current.history || [])];

    const decisionRecord = {
      status: decision, // 'confirmed' | 'dismissed'
      notes: notes.trim(),
      decidedBy: actor.uid || auth?.currentUser?.uid || '',
      decidedByName: actor.name || 'Warden',
      decidedAt: new Date().toISOString()
    };

    history.push({
      status: current.status,
      timestamp: new Date().toISOString(),
      actorName: actor.name || 'Warden',
      note: `Recurrence status marked as ${decision.toUpperCase()} by Warden.${notes ? ` Note: "${notes.trim()}"` : ''}`
    });

    const updates = {
      recurrenceDecision: decisionRecord,
      history,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, updates);

    try {
      await auditService.logAction('RECURRENCE_DECISION', actor, complaintId, {
        decision,
        notes: notes.trim()
      });
    } catch {
      /* non-fatal */
    }

    return { id: complaintId, ...current, ...updates };
  },

  // Escalate overdue complaint
  async escalateComplaint(complaintId, reason, actor = {}) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured.');
    }
    const updates = {
      isEscalated: true,
      escalationReason: reason,
      escalatedAt: new Date().toISOString(),
      statusNote: `ESCALATED: ${reason}`,
      updatedAt: serverTimestamp()
    };
    const docRef = doc(db, 'complaints', complaintId);
    await updateDoc(docRef, updates);
    return { id: complaintId, ...updates };
  },

  /**
   * Uploads a complaint image to Firebase Storage.
   *
   * Delegates to storageService.uploadComplaintImage which handles:
   *   - Client-side MIME type and size validation
   *   - uploadBytesResumable with optional progress callback
   *   - Typed Firebase Storage error handling
   *
   * @param {File}     file        - The image File object.
   * @param {string}   complaintId - The complaint ID (or 'pending' pre-creation).
   * @param {Function} [onProgress] - Optional progress callback (0–100).
   * @param {AbortSignal} [signal]  - Optional AbortSignal for cancellation.
   * @returns {Promise<string>}    - Firebase Storage download URL.
   */
  uploadImage(file, complaintId = 'pending', onProgress, signal) {
    return uploadComplaintImage(file, complaintId, onProgress, signal);
  }
};

/**
 * HostelCare AI — Maintenance Intelligence & Explainable Priority Engine
 *
 * Deterministic, transparent heuristic intelligence built strictly on actual
 * Firestore complaint records. No paid external AI services required.
 */

// Helper: Safely convert Firestore Timestamp, ISO string, or number to epoch ms
export function parseDateMs(v) {
  if (!v) return null;
  if (typeof v.toMillis === 'function') return v.toMillis();
  if (typeof v.seconds === 'number') return v.seconds * 1000;
  const parsed = new Date(v).getTime();
  return isNaN(parsed) ? null : parsed;
}

// Helper: Normalize string for deterministic matching
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Core keyword signatures for cross-complaint correlation
const ISSUE_SIGNATURES = [
  { key: 'water_leak', words: ['leak', 'leaking', 'tap', 'dripping', 'pipe leak'] },
  { key: 'drain_clog', words: ['clog', 'clogged', 'drain', 'choke', 'blocked', 'sink'] },
  { key: 'no_water', words: ['no water', 'water supply', 'dry tap', 'tank empty'] },
  { key: 'flush_issue', words: ['flush', 'cistern', 'commode', 'toilet flush'] },
  { key: 'geyser_issue', words: ['geyser', 'hot water', 'water heater'] },
  { key: 'fan_issue', words: ['fan', 'ceiling fan', 'regulator', 'fan noise', 'fan slow'] },
  { key: 'light_issue', words: ['light', 'bulb', 'tube', 'tubelight', 'flicker', 'led'] },
  { key: 'power_outage', words: ['power', 'electricity', 'blackout', 'short circuit', 'mcb', 'tripping', 'switch', 'socket'] },
  { key: 'wifi_issue', words: ['wifi', 'wi fi', 'internet', 'router', 'lan', 'no connection', 'slow speed'] },
  { key: 'door_lock', words: ['door', 'lock', 'latch', 'handle', 'hinge', 'key', 'padlock'] },
  { key: 'window_issue', words: ['window', 'glass', 'pane', 'grill', 'mesh'] },
  { key: 'ac_issue', words: ['ac', 'air conditioner', 'cooling', 'cooler'] },
  { key: 'pest_issue', words: ['cockroach', 'rat', 'mouse', 'bedbug', 'mosquito', 'bugs', 'termites'] },
  { key: 'cleaning_issue', words: ['dirty', 'garbage', 'trash', 'dust', 'cleaning', 'odor', 'smell', 'washroom dirty'] }
];

export function extractIssueSignatures(title = '', description = '') {
  const combined = normalizeText(`${title} ${description}`);
  if (!combined) return [];
  const matches = [];
  for (const sig of ISSUE_SIGNATURES) {
    if (sig.words.some((w) => combined.includes(w))) {
      matches.push(sig.key);
    }
  }
  return matches;
}

/**
 * Detect recurring complaints across a configurable time window.
 *
 * Rules:
 * 1. Scope: Same hostelBlock.
 * 2. Room-level recurrence: same hostelBlock + same roomNumber + same category/signature.
 * 3. Block-level recurrence: same hostelBlock + same category/signature across multiple rooms.
 * 4. Time Window: only complaints created within `timeWindowDays` are clustered.
 * 5. Closed complaints are included as historical evidence but marked as inactive.
 * 6. Clusters require >= 2 complaints, with at least 1 active (non-closed) complaint to be actionable.
 * 7. Missing fields (e.g. room number) are safely flagged and never hallucinated.
 */
export function detectRecurringIssues(complaints = [], options = {}) {
  const timeWindowDays = Number(options.timeWindowDays) || 30;
  const blockFilter = options.blockFilter || null;
  const now = options.referenceTimeMs || Date.now();
  const windowMs = timeWindowDays * 24 * 60 * 60 * 1000;
  const cutoffTime = now - windowMs;

  if (!Array.isArray(complaints) || complaints.length === 0) {
    return {
      timeWindowDays,
      clusters: [],
      totalEvaluated: 0,
      activeClustersCount: 0,
      insufficientDataReason: 'No complaints available in the dataset.'
    };
  }

  // Pre-filter complaints by block (if specified) and validate
  const validComplaints = [];
  let missingDateCount = 0;
  let missingRoomCount = 0;

  for (const c of complaints) {
    if (!c || typeof c !== 'object') continue;
    if (blockFilter && blockFilter !== 'All Hostels' && c.hostelBlock !== blockFilter) {
      continue;
    }

    const createdMs = parseDateMs(c.createdAt);
    if (!createdMs) {
      missingDateCount += 1;
    }

    // Keep complaints that have a valid date within window, or fallback to recent if missing
    const inWindow = createdMs !== null ? createdMs >= cutoffTime : true;
    if (!inWindow) continue;

    if (!c.roomNumber || !String(c.roomNumber).trim()) {
      missingRoomCount += 1;
    }

    const signatures = extractIssueSignatures(c.title, c.description);
    const category = (c.category || 'other').toLowerCase().trim();
    const isClosed = c.status === 'CLOSED';

    validComplaints.push({
      ...c,
      _createdMs: createdMs,
      _signatures: signatures,
      _normCategory: category,
      _isClosed: isClosed
    });
  }

  if (validComplaints.length < 2) {
    return {
      timeWindowDays,
      clusters: [],
      totalEvaluated: validComplaints.length,
      activeClustersCount: 0,
      missingDateCount,
      missingRoomCount,
      insufficientDataReason:
        validComplaints.length === 0
          ? 'No complaints found within the selected ' + timeWindowDays + '-day window.'
          : 'Only 1 complaint found in this window. At least 2 correlated complaints are required to detect recurrence.'
    };
  }

  // Bucket candidates by:
  // A) Room-level: block + roomNumber + (signature || category)
  // B) Block-level: block + signature (for widespread infrastructure issues)
  const roomGroups = new Map();
  const blockSigGroups = new Map();

  for (const item of validComplaints) {
    const block = item.hostelBlock || 'Unspecified Block';
    const room = item.roomNumber ? String(item.roomNumber).trim() : null;

    // 1. Room bucket
    if (room) {
      // Key with signatures if present, else category
      const sigKey = item._signatures.length > 0 ? item._signatures[0] : item._normCategory;
      const roomKey = `${block}:::${room}:::${sigKey}`;
      if (!roomGroups.has(roomKey)) roomGroups.set(roomKey, []);
      roomGroups.get(roomKey).push(item);
    }

    // 2. Block infrastructure bucket (only for distinct shared signatures like water/wifi/power)
    for (const sig of item._signatures) {
      const blockKey = `${block}:::${sig}`;
      if (!blockSigGroups.has(blockKey)) blockSigGroups.set(blockKey, []);
      blockSigGroups.get(blockKey).push(item);
    }
  }

  const clusters = [];
  const processedComplaintIdsInRoom = new Set();

  // Process Room-Level Clusters first (higher precision)
  for (const [key, items] of roomGroups.entries()) {
    if (items.length >= 2) {
      const [block, room, sig] = key.split(':::');
      const activeItems = items.filter((i) => !i._isClosed);
      const closedItems = items.filter((i) => i._isClosed);

      // Distinguish confirmed vs possible
      const hasWardenConfirmation = items.some(
        (i) => i.recurrenceDecision?.status === 'confirmed'
      );
      const isDismissed = items.every(
        (i) => i.recurrenceDecision?.status === 'dismissed'
      );

      const clusterStatus = isDismissed
        ? 'dismissed'
        : hasWardenConfirmation
        ? 'confirmed'
        : 'possible';

      // Sort newest first
      items.sort((a, b) => (b._createdMs || 0) - (a._createdMs || 0));

      const cluster = {
        id: `rec-room-${block}-${room}-${sig}`.replace(/\s+/g, '-').toLowerCase(),
        type: 'ROOM_SPECIFIC',
        level: 'Room-Level Repeated Failure',
        hostelBlock: block,
        roomNumber: room,
        category: items[0].category || sig,
        issueSignature: sig,
        status: clusterStatus,
        isActionable: activeItems.length > 0 && clusterStatus !== 'dismissed',
        activeCount: activeItems.length,
        historicalCount: closedItems.length,
        totalCount: items.length,
        timeWindowDays,
        justification: `Room ${room} in ${block} has logged ${items.length} correlated issues within the last ${timeWindowDays} days (${activeItems.length} active, ${closedItems.length} previously closed).`,
        complaints: items.map((i) => ({
          id: i.id,
          title: i.title,
          status: i.status,
          roomNumber: i.roomNumber,
          createdAt: i.createdAt,
          createdMs: i._createdMs,
          priority: i.priority,
          isClosed: i._isClosed
        }))
      };

      clusters.push(cluster);
      items.forEach((i) => processedComplaintIdsInRoom.add(i.id));
    }
  }

  // Process Block-Level Clusters (only for 3+ complaints across >= 2 different rooms)
  for (const [key, items] of blockSigGroups.entries()) {
    const [block, sig] = key.split(':::');
    // Unique rooms in this block signature
    const distinctRooms = new Set(
      items.map((i) => (i.roomNumber ? String(i.roomNumber).trim() : null)).filter(Boolean)
    );

    // Only flag as block-level if spread across at least 2 distinct rooms and 3+ complaints
    if (items.length >= 3 && distinctRooms.size >= 2) {
      // Exclude items already in a room-level cluster if they don't form a genuine cluster
      const activeItems = items.filter((i) => !i._isClosed);
      const closedItems = items.filter((i) => i._isClosed);

      const hasWardenConfirmation = items.some(
        (i) => i.recurrenceDecision?.status === 'confirmed'
      );
      const isDismissed = items.every(
        (i) => i.recurrenceDecision?.status === 'dismissed'
      );

      const clusterStatus = isDismissed
        ? 'dismissed'
        : hasWardenConfirmation
        ? 'confirmed'
        : 'possible';

      items.sort((a, b) => (b._createdMs || 0) - (a._createdMs || 0));

      const cluster = {
        id: `rec-block-${block}-${sig}`.replace(/\s+/g, '-').toLowerCase(),
        type: 'BLOCK_INFRASTRUCTURE',
        level: 'Block-Wide Recurring Pattern',
        hostelBlock: block,
        roomNumber: `Multiple Rooms (${Array.from(distinctRooms).join(', ')})`,
        category: items[0].category || sig,
        issueSignature: sig,
        status: clusterStatus,
        isActionable: activeItems.length > 0 && clusterStatus !== 'dismissed',
        activeCount: activeItems.length,
        historicalCount: closedItems.length,
        totalCount: items.length,
        timeWindowDays,
        justification: `${block} shows ${items.length} related reports matching "${sig.replace('_', ' ')}" across ${distinctRooms.size} rooms in the past ${timeWindowDays} days. Potential shared infrastructure root cause.`,
        complaints: items.map((i) => ({
          id: i.id,
          title: i.title,
          status: i.status,
          roomNumber: i.roomNumber,
          createdAt: i.createdAt,
          createdMs: i._createdMs,
          priority: i.priority,
          isClosed: i._isClosed
        }))
      };

      clusters.push(cluster);
    }
  }

  // Sort clusters: confirmed first, then actionable with highest count
  clusters.sort((a, b) => {
    if (a.status === 'confirmed' && b.status !== 'confirmed') return -1;
    if (b.status === 'confirmed' && a.status !== 'confirmed') return 1;
    if (a.isActionable && !b.isActionable) return -1;
    if (!a.isActionable && b.isActionable) return 1;
    return b.totalCount - a.totalCount;
  });

  return {
    timeWindowDays,
    clusters,
    totalEvaluated: validComplaints.length,
    activeClustersCount: clusters.filter((c) => c.isActionable).length,
    missingDateCount,
    missingRoomCount,
    insufficientDataReason:
      clusters.length === 0
        ? `No recurring patterns detected among ${validComplaints.length} complaints in the ${timeWindowDays}-day window.`
        : null
  };
}

/**
 * Calculate Explainable Priority Score for a single complaint.
 *
 * Provisional Weighting:
 *   1. Severity/Urgency: up to 40 pts
 *   2. Recurrence: up to 25 pts
 *   3. Age / SLA Overdue Status: up to 20 pts
 *   4. Documented Impact: up to 15 pts
 * Total: 0 - 100 points
 */
export function calculatePriorityRecommendation(complaint, allComplaints = [], options = {}) {
  if (!complaint || typeof complaint !== 'object') {
    return null;
  }

  const timeWindowDays = Number(options.timeWindowDays) || 30;
  const now = options.referenceTimeMs || Date.now();
  const uncertainties = [];

  // ─────────────────────────────────────────────
  // Factor 1: Severity Score (up to 40 pts)
  // Decoupled from warden operational overrides to prevent circular score feedback loops.
  // ─────────────────────────────────────────────
  let severityScore = 0;
  let severityDetail = '';

  const isOverridden = Boolean(complaint.wardenPriorityOverride);
  const overrideInfo = complaint.wardenPriorityOverride || null;

  // Determine intrinsic base priority:
  // If overridden by warden, use the recorded pre-override priority;
  // otherwise use initialPriority, aiTriage priority, or current priority.
  const basePriority = (
    (isOverridden ? overrideInfo?.previousPriority : null) ||
    complaint.initialPriority ||
    complaint.aiTriage?.priority ||
    complaint.aiRecommendation?.priority ||
    complaint.priority ||
    ''
  ).toUpperCase();

  // Check for physical safety hazards (highest precedence)
  const safetyList = Array.isArray(complaint.safetyIndicators)
    ? complaint.safetyIndicators
    : Array.isArray(complaint.aiTriage?.safetyIndicators)
    ? complaint.aiTriage.safetyIndicators
    : [];

  if (safetyList.length > 0) {
    severityScore = 40;
    severityDetail = `Emergency hazard detected: Physical safety hazard flagged (${safetyList.join(' • ')}).`;
  } else if (basePriority === 'EMERGENCY') {
    severityScore = 40;
    severityDetail = 'Emergency baseline: immediate hazard or severe physical impairment.';
  } else if (basePriority === 'HIGH') {
    severityScore = 28;
    severityDetail = 'High baseline: significant inconvenience or critical daily facility disruption.';
  } else if (basePriority === 'MEDIUM') {
    severityScore = 18;
    severityDetail = 'Medium baseline: routine maintenance issue with moderate disruption.';
  } else if (basePriority === 'LOW') {
    severityScore = 8;
    severityDetail = 'Low baseline: minor cosmetic or non-urgent repair.';
  } else {
    severityScore = 12;
    severityDetail = 'Priority not specified in record. Default moderate baseline assigned.';
    uncertainties.push('Priority field missing from complaint; default 12 pts used.');
  }

  if (isOverridden && overrideInfo) {
    severityDetail += ` (Warden operational override: ${overrideInfo.previousPriority} → ${overrideInfo.overriddenPriority} preserved separately).`;
  }

  // ─────────────────────────────────────────────
  // Factor 2: Recurrence Factor (up to 25 pts)
  // ─────────────────────────────────────────────
  let recurrenceScore = 0;
  let recurrenceDetail = '';
  const supportingComplaintIds = [];

  if (!complaint.hostelBlock) {
    recurrenceScore = 0;
    recurrenceDetail = 'Hostel block unspecified; recurrence matching impossible.';
    uncertainties.push('Missing hostelBlock prevents recurrence analysis.');
  } else {
    // Run recurrence detection in window
    const recurrenceReport = detectRecurringIssues(allComplaints, {
      timeWindowDays,
      blockFilter: complaint.hostelBlock,
      referenceTimeMs: now
    });

    // Check if this complaint belongs to any cluster
    const matchingCluster = recurrenceReport.clusters.find((cl) =>
      cl.complaints.some((c) => String(c.id) === String(complaint.id))
    );

    if (matchingCluster) {
      matchingCluster.complaints.forEach((c) => {
        if (String(c.id) !== String(complaint.id)) {
          supportingComplaintIds.push(c.id);
        }
      });

      if (matchingCluster.status === 'confirmed') {
        recurrenceScore = 25;
        recurrenceDetail = `Warden-confirmed recurring issue in ${matchingCluster.hostelBlock} (${matchingCluster.totalCount} incidents in ${timeWindowDays}d).`;
      } else if (matchingCluster.totalCount >= 3) {
        recurrenceScore = 20;
        recurrenceDetail = `Possible recurring pattern with ${matchingCluster.totalCount} related reports within ${timeWindowDays} days.`;
      } else {
        recurrenceScore = 12;
        recurrenceDetail = `Suspected recurrence: 1 related prior complaint logged within ${timeWindowDays} days.`;
      }
    } else {
      recurrenceScore = 0;
      recurrenceDetail = `No related recurring incidents identified in ${complaint.hostelBlock} within ${timeWindowDays} days.`;
    }
  }

  // ─────────────────────────────────────────────
  // Factor 3: Age & SLA Overdue Status (up to 20 pts)
  // ─────────────────────────────────────────────
  let ageScore = 0;
  let ageDetail = '';
  const createdMs = parseDateMs(complaint.createdAt);
  const slaHours = Number(complaint.slaHours) || 24;

  if (!createdMs) {
    ageScore = 5;
    ageDetail = 'Complaint creation timestamp missing. Minimal baseline score applied.';
    uncertainties.push('Missing createdAt timestamp; elapsed time and SLA deadline cannot be verified.');
  } else if (complaint.status === 'CLOSED') {
    ageScore = 0;
    ageDetail = 'Complaint is already closed; no SLA urgency applies.';
  } else {
    const elapsedHours = Math.max(0, (now - createdMs) / (1000 * 60 * 60));
    const isOverdue = elapsedHours > slaHours;
    const overdueHours = Math.round(elapsedHours - slaHours);

    if (isOverdue) {
      if (overdueHours > 24) {
        ageScore = 20;
        ageDetail = `Critical SLA breach: Overdue by ${overdueHours}h (target: ${slaHours}h).`;
      } else {
        ageScore = 15;
        ageDetail = `SLA breached: Overdue by ${overdueHours}h (target: ${slaHours}h).`;
      }
    } else {
      const percentElapsed = (elapsedHours / slaHours) * 100;
      if (percentElapsed >= 75) {
        ageScore = 10;
        ageDetail = `Approaching SLA deadline: ${Math.round(percentElapsed)}% of ${slaHours}h window elapsed.`;
      } else {
        ageScore = 4;
        ageDetail = `Within target SLA: ${Math.round(elapsedHours)}h elapsed of ${slaHours}h allowed.`;
      }
    }
  }

  // ─────────────────────────────────────────────
  // Factor 4: Documented Impact (up to 15 pts)
  // ─────────────────────────────────────────────
  let impactScore = 0;
  let impactDetail = '';
  const titleDesc = normalizeText(`${complaint.title || ''} ${complaint.description || ''}`);

  const commonFacilityKeywords = [
    'washroom', 'bathroom', 'toilet', 'corridor', 'wing', 'floor',
    'common', 'cooler', 'geyser', 'tank', 'main', 'hallway', 'staircase'
  ];
  const isCommonArea = commonFacilityKeywords.some((w) => titleDesc.includes(w));

  if (isCommonArea) {
    impactScore = 15;
    impactDetail = 'Shared facility or multi-resident impact indicated in complaint notes.';
  } else if (complaint.roomNumber && String(complaint.roomNumber).trim()) {
    impactScore = 8;
    impactDetail = `Resident room #${complaint.roomNumber} localized maintenance.`;
  } else {
    impactScore = 5;
    impactDetail = 'Room number missing from ticket; impact localized conservatively.';
    uncertainties.push('Room number missing; affected occupant count unverified.');
  }

  // ─────────────────────────────────────────────
  // Final Score & Priority Determination
  // Thresholds:
  //   0  - 24 pts: LOW (routine maintenance, ample SLA window)
  //   25 - 44 pts: MEDIUM (standard maintenance, localized disruption)
  //   45 - 64 pts: HIGH (significant disruption, SLA overdue, or recurring issue)
  //   65 - 100 pts: EMERGENCY (physical safety hazard or compounded risk)
  // ─────────────────────────────────────────────
  const totalScore = Math.min(100, Math.max(0, Math.round(severityScore + recurrenceScore + ageScore + impactScore)));

  let recommendedPriority = 'LOW';
  let scoreMeaning = '';

  if (totalScore >= 65 || safetyList.length > 0 || (basePriority === 'EMERGENCY' && totalScore >= 50)) {
    recommendedPriority = 'EMERGENCY';
    scoreMeaning = 'Critical urgency: Safety hazard or compounded multi-factor risk (recurrence/SLA breach/widespread impact). Immediate technician dispatch required.';
  } else if (totalScore >= 45 || (basePriority === 'HIGH' && totalScore >= 35)) {
    recommendedPriority = 'HIGH';
    scoreMeaning = 'High urgency: Significant resident inconvenience, overdue SLA, or recurring breakdown.';
  } else if (totalScore >= 25) {
    recommendedPriority = 'MEDIUM';
    scoreMeaning = 'Standard urgency: Normal maintenance timeline within permissible SLA.';
  } else {
    recommendedPriority = 'LOW';
    scoreMeaning = 'Low urgency: Routine maintenance with ample SLA window remaining.';
  }

  return {
    complaintId: complaint.id,
    totalScore,
    recommendedPriority,
    operationalPriority: complaint.priority || basePriority || 'UNSET',
    basePriority,
    currentPriority: complaint.priority || 'UNSET',
    scoreMeaning,
    isOverridden,
    overrideInfo,
    factors: {
      severity: {
        points: severityScore,
        max: 40,
        detail: severityDetail
      },
      recurrence: {
        points: recurrenceScore,
        max: 25,
        detail: recurrenceDetail,
        supportingComplaintIds
      },
      ageSla: {
        points: ageScore,
        max: 20,
        detail: ageDetail
      },
      impact: {
        points: impactScore,
        max: 15,
        detail: impactDetail
      }
    },
    uncertainties,
    disclaimer:
      'Provisional decision-support recommendation based on deterministic rules. The Hostel Warden retains final operational decision-making authority.'
  };
}

/**
 * Convenience function to score all complaints in a list.
 */
export function calculateAllPriorityRecommendations(complaints = [], options = {}) {
  if (!Array.isArray(complaints)) return [];
  return complaints.map((c) => calculatePriorityRecommendation(c, complaints, options));
}

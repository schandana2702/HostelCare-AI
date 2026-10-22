import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  detectRecurringIssues,
  calculatePriorityRecommendation,
  normalizeText,
  extractIssueSignatures
} from '../src/services/intelligenceService.js';

describe('HostelCare Maintenance Intelligence & Recurrence Engine', () => {
  const referenceTime = new Date('2026-10-18T12:00:00.000Z').getTime();

  it('1. Returns empty result with explanatory reason on empty dataset', () => {
    const report = detectRecurringIssues([], { referenceTimeMs: referenceTime });
    assert.equal(report.clusters.length, 0);
    assert.equal(report.totalEvaluated, 0);
    assert.equal(report.activeClustersCount, 0);
    assert.match(report.insufficientDataReason, /no complaints/i);
  });

  it('2. Returns insufficient data message when only 1 complaint exists', () => {
    const singleComplaint = [
      {
        id: 'c1',
        title: 'Leaking tap in bathroom',
        description: 'Water leaking under the sink',
        category: 'plumbing',
        hostelBlock: 'A Block',
        roomNumber: '204',
        status: 'SUBMITTED',
        createdAt: new Date('2026-10-17T10:00:00.000Z')
      }
    ];

    const report = detectRecurringIssues(singleComplaint, { referenceTimeMs: referenceTime });
    assert.equal(report.clusters.length, 0);
    assert.equal(report.totalEvaluated, 1);
    assert.match(report.insufficientDataReason, /at least 2/i);
  });

  it('3. Accurately detects Room-Level recurrence for same room and category in same block', () => {
    const complaints = [
      {
        id: 'c101',
        title: 'Bathroom tap leaking continuously',
        description: 'Dripping water from tap',
        category: 'plumbing',
        hostelBlock: 'B Block',
        roomNumber: '305',
        status: 'SUBMITTED',
        createdAt: new Date('2026-10-16T08:00:00.000Z')
      },
      {
        id: 'c102',
        title: 'Pipe leak under basin',
        description: 'Water pooling on floor',
        category: 'plumbing',
        hostelBlock: 'B Block',
        roomNumber: '305',
        status: 'CLOSED', // historical record supporting recurrence
        createdAt: new Date('2026-10-10T09:00:00.000Z')
      }
    ];

    const report = detectRecurringIssues(complaints, { timeWindowDays: 30, referenceTimeMs: referenceTime });
    assert.equal(report.clusters.length, 1);
    const cluster = report.clusters[0];
    assert.equal(cluster.type, 'ROOM_SPECIFIC');
    assert.equal(cluster.hostelBlock, 'B Block');
    assert.equal(cluster.roomNumber, '305');
    assert.equal(cluster.totalCount, 2);
    assert.equal(cluster.activeCount, 1);
    assert.equal(cluster.historicalCount, 1);
    assert.equal(cluster.status, 'possible');
    assert.equal(cluster.isActionable, true);
  });

  it('4. MUST NOT cross-match complaints across different hostel blocks even with identical room and issue', () => {
    const complaints = [
      {
        id: 'c201',
        title: 'Ceiling fan making rattling noise',
        description: 'Fan speed regulator broken',
        category: 'electrical',
        hostelBlock: 'A Block',
        roomNumber: '101',
        status: 'SUBMITTED',
        createdAt: new Date('2026-10-15T08:00:00.000Z')
      },
      {
        id: 'c202',
        title: 'Ceiling fan regulator broken',
        description: 'Fan making loud sound',
        category: 'electrical',
        hostelBlock: 'D1 Block', // DIFFERENT BLOCK!
        roomNumber: '101',
        status: 'SUBMITTED',
        createdAt: new Date('2026-10-15T09:00:00.000Z')
      }
    ];

    const report = detectRecurringIssues(complaints, { referenceTimeMs: referenceTime });
    assert.equal(report.clusters.length, 0); // Must NOT group across different blocks
  });

  it('5. Enforces time window boundaries strictly (ignores records outside lookback window)', () => {
    const complaints = [
      {
        id: 'c301',
        title: 'Slow internet and wifi drops',
        description: 'Router blinking red',
        category: 'wifi',
        hostelBlock: 'C Block',
        roomNumber: '402',
        status: 'SUBMITTED',
        createdAt: new Date('2026-10-17T08:00:00.000Z') // 1 day ago
      },
      {
        id: 'c302',
        title: 'No wifi connection',
        description: 'Disconnected from router',
        category: 'wifi',
        hostelBlock: 'C Block',
        roomNumber: '402',
        status: 'CLOSED',
        createdAt: new Date('2026-08-01T08:00:00.000Z') // > 75 days ago (outside 30-day window)
      }
    ];

    const report30 = detectRecurringIssues(complaints, { timeWindowDays: 30, referenceTimeMs: referenceTime });
    assert.equal(report30.clusters.length, 0); // Older ticket is outside 30-day window

    const report90 = detectRecurringIssues(complaints, { timeWindowDays: 90, referenceTimeMs: referenceTime });
    assert.equal(report90.clusters.length, 1); // Found when expanding window to 90 days
  });

  it('6. Does not falsely match unrelated complaints sharing incidental words', () => {
    const complaints = [
      {
        id: 'c401',
        title: 'Study chair leg is wobbly',
        description: 'Wood screw came loose from chair',
        category: 'carpentry',
        hostelBlock: 'E Block',
        roomNumber: '210',
        status: 'SUBMITTED',
        createdAt: new Date('2026-10-16T10:00:00.000Z')
      },
      {
        id: 'c402',
        title: 'Room door lock latch stuck',
        description: 'Cannot turn the key in the padlock',
        category: 'security',
        hostelBlock: 'E Block',
        roomNumber: '210',
        status: 'SUBMITTED',
        createdAt: new Date('2026-10-16T11:00:00.000Z')
      }
    ];

    const report = detectRecurringIssues(complaints, { referenceTimeMs: referenceTime });
    // Chair leg loose vs Door lock stuck in security: should NOT be grouped
    assert.equal(report.clusters.length, 0);
  });

  it('7. Handles missing room numbers and missing timestamps safely without throwing', () => {
    const complaints = [
      {
        id: 'c501',
        title: 'Main corridor water cooler not cooling',
        description: 'Warm water from cooler in 2nd floor corridor',
        category: 'appliance',
        hostelBlock: 'A Block',
        roomNumber: '', // Missing room number
        status: 'SUBMITTED',
        createdAt: null // Missing timestamp
      },
      {
        id: 'c502',
        title: 'Water cooler warm',
        description: 'No cooling in floor cooler',
        category: 'appliance',
        hostelBlock: 'A Block',
        roomNumber: null, // Null room number
        status: 'SUBMITTED',
        createdAt: 'invalid-date-string'
      }
    ];

    // Should run safely without error
    const report = detectRecurringIssues(complaints, { referenceTimeMs: referenceTime });
    assert.ok(report);
    assert.ok(report.missingRoomCount >= 2);
    assert.ok(report.missingDateCount >= 2);
  });

  it('8. Distinguishes warden-confirmed recurring issues from unconfirmed possible ones', () => {
    const complaints = [
      {
        id: 'c601',
        title: 'Bathroom geyser not heating water',
        description: 'Water stays cold',
        category: 'appliance',
        hostelBlock: 'F Block',
        roomNumber: '112',
        status: 'SUBMITTED',
        createdAt: new Date('2026-10-17T08:00:00.000Z'),
        recurrenceDecision: { status: 'confirmed', decidedBy: 'warden-01' }
      },
      {
        id: 'c602',
        title: 'Geyser tripping MCB switch',
        description: 'Hot water heater causes blackout',
        category: 'appliance',
        hostelBlock: 'F Block',
        roomNumber: '112',
        status: 'IN_PROGRESS',
        createdAt: new Date('2026-10-15T08:00:00.000Z')
      }
    ];

    const report = detectRecurringIssues(complaints, { referenceTimeMs: referenceTime });
    assert.equal(report.clusters.length, 1);
    assert.equal(report.clusters[0].status, 'confirmed');
  });
});

describe('HostelCare Explainable Priority Recommendation Engine', () => {
  const referenceTime = new Date('2026-10-18T12:00:00.000Z').getTime();

  it('1. Accurately scores Emergency priority with full breakdown (max 40 pts severity)', () => {
    const emergencyComplaint = {
      id: 'em-1',
      title: 'Sparking wire in switchboard with burning smell',
      description: 'Major electrical hazard sparking in room',
      priority: 'EMERGENCY',
      category: 'electrical',
      hostelBlock: 'A Block',
      roomNumber: '302',
      status: 'SUBMITTED',
      slaHours: 4,
      createdAt: new Date('2026-10-18T11:00:00.000Z') // 1 hour old (within 4h SLA)
    };

    const rec = calculatePriorityRecommendation(emergencyComplaint, [emergencyComplaint], {
      referenceTimeMs: referenceTime
    });

    assert.ok(rec);
    assert.equal(rec.recommendedPriority, 'EMERGENCY');
    assert.equal(rec.factors.severity.points, 40);
    assert.equal(rec.factors.severity.max, 40);
    assert.ok(rec.totalScore >= 50);
    assert.match(rec.disclaimer, /final operational decision-making authority/i);
  });

  it('2. Compounds priority score when recurrence is detected (up to 25 pts)', () => {
    const allTickets = [
      {
        id: 'rec-1',
        title: 'Tap leaking heavily',
        description: 'Continuous water leak',
        priority: 'MEDIUM',
        category: 'plumbing',
        hostelBlock: 'B Block',
        roomNumber: '204',
        status: 'SUBMITTED',
        createdAt: new Date('2026-10-17T12:00:00.000Z')
      },
      {
        id: 'rec-2',
        title: 'Pipe leak in bathroom',
        description: 'Water leak',
        priority: 'MEDIUM',
        category: 'plumbing',
        hostelBlock: 'B Block',
        roomNumber: '204',
        status: 'CLOSED',
        createdAt: new Date('2026-10-10T12:00:00.000Z')
      }
    ];

    const rec = calculatePriorityRecommendation(allTickets[0], allTickets, {
      referenceTimeMs: referenceTime
    });

    assert.ok(rec);
    assert.ok(rec.factors.recurrence.points >= 12, 'Recurrence points must be awarded for repeated room failure');
    assert.equal(rec.factors.recurrence.supportingComplaintIds.length, 1);
    assert.equal(rec.factors.recurrence.supportingComplaintIds[0], 'rec-2');
  });

  it('3. Compounds priority score when SLA is breached (up to 20 pts)', () => {
    const overdueTicket = {
      id: 'sla-1',
      title: 'Broken window latch',
      description: 'Window cannot latch securely',
      priority: 'LOW',
      category: 'carpentry',
      hostelBlock: 'C Block',
      roomNumber: '105',
      status: 'SUBMITTED',
      slaHours: 24,
      createdAt: new Date('2026-10-15T12:00:00.000Z') // 72 hours ago (> 24h overdue)
    };

    const rec = calculatePriorityRecommendation(overdueTicket, [overdueTicket], {
      referenceTimeMs: referenceTime
    });

    assert.ok(rec);
    assert.equal(rec.factors.ageSla.points, 20, 'Critical SLA breach should award 20 pts');
    assert.match(rec.factors.ageSla.detail, /critical sla breach/i);
  });

  it('4. Explicitly flags missing fields as uncertainties rather than fabricating data', () => {
    const brokenDataTicket = {
      id: 'broken-1',
      title: 'Some issue',
      description: 'Need help',
      priority: null, // missing priority
      hostelBlock: null, // missing block
      roomNumber: null, // missing room
      createdAt: null // missing date
    };

    const rec = calculatePriorityRecommendation(brokenDataTicket, [brokenDataTicket], {
      referenceTimeMs: referenceTime
    });

    assert.ok(rec);
    assert.ok(rec.uncertainties.length >= 3, 'Must report uncertainties for missing fields');
    assert.ok(rec.uncertainties.some((u) => u.includes('Priority')));
    assert.ok(rec.uncertainties.some((u) => u.includes('createdAt')));
    assert.ok(rec.uncertainties.some((u) => u.includes('hostelBlock')));
  });

  it('5. Preserves and highlights warden manual priority override without silent overwrite', () => {
    const overriddenTicket = {
      id: 'over-1',
      title: 'Routine study table wobble',
      description: 'Minor screw loose',
      priority: 'HIGH', // Overridden to HIGH
      category: 'carpentry',
      hostelBlock: 'A Block',
      roomNumber: '401',
      status: 'SUBMITTED',
      createdAt: new Date('2026-10-18T10:00:00.000Z'),
      wardenPriorityOverride: {
        previousPriority: 'LOW',
        overriddenPriority: 'HIGH',
        reason: 'Student has exams starting tomorrow and cannot use study desk.',
        overriddenByName: 'Warden Ramesh',
        overriddenAt: '2026-10-18T11:00:00.000Z'
      }
    };

    const rec = calculatePriorityRecommendation(overriddenTicket, [overriddenTicket], {
      referenceTimeMs: referenceTime
    });

    assert.ok(rec);
    assert.equal(rec.isOverridden, true);
    assert.equal(rec.overrideInfo.previousPriority, 'LOW');
    assert.equal(rec.overrideInfo.overriddenPriority, 'HIGH');
    assert.equal(rec.operationalPriority, 'HIGH');
    assert.equal(rec.basePriority, 'LOW');
    assert.equal(rec.factors.severity.points, 8, 'Severity score must decouple and stay at base LOW (8 pts)');
    assert.match(rec.overrideInfo.reason, /exams starting tomorrow/i);
  });

  it('6. Solves the 20 -> 30 score jump: score stays stable at 20 when Warden assigns staff and selects Medium', () => {
    // Original complaint submitted with LOW priority
    const originalComplaint = {
      id: 'comp-low-1',
      title: 'Curtain rod slightly tilted',
      description: 'Curtain rod in room 204 needs adjustment',
      priority: 'LOW',
      category: 'carpentry',
      hostelBlock: 'A Block',
      roomNumber: '204',
      status: 'SUBMITTED',
      createdAt: new Date('2026-10-18T11:00:00.000Z'), // 1 hour ago
      slaHours: 24
    };

    // Initial scoring before assignment:
    // Factor 1 (severity): 8 pts
    // Factor 2 (recurrence): 0 pts
    // Factor 3 (SLA 1h/24h): 4 pts
    // Factor 4 (room 204 localized): 8 pts
    // Total score = 20 pts (recommended priority: LOW)
    const initialRec = calculatePriorityRecommendation(originalComplaint, [originalComplaint], {
      referenceTimeMs: referenceTime
    });
    assert.equal(initialRec.totalScore, 20);
    assert.equal(initialRec.recommendedPriority, 'LOW');
    assert.equal(initialRec.factors.severity.points, 8);
    assert.equal(initialRec.isOverridden, false);

    // Warden opens AssignModal and assigns staff, changing operational priority to MEDIUM:
    const assignedComplaint = {
      ...originalComplaint,
      status: 'ASSIGNED',
      assignedToId: 'tech-101',
      assignedToName: 'Suresh Electrician',
      priority: 'MEDIUM', // Operational priority updated
      wardenPriorityOverride: {
        previousPriority: 'LOW',
        overriddenPriority: 'MEDIUM',
        reason: 'Adjusted priority during staff assignment.',
        overriddenBy: 'warden-uid-1',
        overriddenByName: 'Chief Warden',
        overriddenAt: new Date('2026-10-18T11:30:00.000Z').toISOString()
      }
    };

    // Score recalculation after assignment:
    const postAssignmentRec = calculatePriorityRecommendation(assignedComplaint, [assignedComplaint], {
      referenceTimeMs: referenceTime
    });

    // Score MUST remain 20 points! (MUST NOT jump to 30)
    assert.equal(postAssignmentRec.totalScore, 20, 'Score must stay decoupled at 20 points');
    assert.equal(postAssignmentRec.factors.severity.points, 8, 'Severity points must not jump from 8 to 18');
    assert.equal(postAssignmentRec.recommendedPriority, 'LOW', 'Suggested priority remains objectively LOW');
    assert.equal(postAssignmentRec.operationalPriority, 'MEDIUM', 'Operational priority reflects warden choice');
    assert.equal(postAssignmentRec.isOverridden, true, 'Warden override must be recorded');
  });

  it('7. Recalculates score legitimately when documented factors change (e.g. SLA elapsed time advances)', () => {
    const complaint = {
      id: 'sla-test-1',
      title: 'Cupboard door hinge squeak',
      description: 'Minor hinge sound',
      priority: 'LOW',
      category: 'carpentry',
      hostelBlock: 'B Block',
      roomNumber: '102',
      status: 'SUBMITTED',
      createdAt: new Date('2026-10-18T11:00:00.000Z'),
      slaHours: 24
    };

    // At submission (1h elapsed): score = 20 pts (ageSla = 4 pts)
    const recT0 = calculatePriorityRecommendation(complaint, [complaint], {
      referenceTimeMs: referenceTime
    });
    assert.equal(recT0.totalScore, 20);
    assert.equal(recT0.factors.ageSla.points, 4);

    // Fast-forward 48 hours later (overdue by 25h): ageSla increases to 20 pts
    const futureTime = referenceTime + (48 * 60 * 60 * 1000);
    const recT48 = calculatePriorityRecommendation(complaint, [complaint], {
      referenceTimeMs: futureTime
    });

    // Total score increases legitimately from 20 to 36 pts due to SLA breach
    assert.equal(recT48.totalScore, 36);
    assert.equal(recT48.factors.ageSla.points, 20);
    assert.match(recT48.factors.ageSla.detail, /critical sla breach/i);
    assert.equal(recT48.recommendedPriority, 'MEDIUM', 'Score 36 crosses into MEDIUM threshold (>= 25)');
  });

  it('8. Physical safety indicators immediately award max severity (40 pts) and force Emergency recommendation', () => {
    const hazardComplaint = {
      id: 'hazard-1',
      title: 'Water filter issue',
      description: 'Water leaking near power cord and sparking',
      priority: 'LOW', // User might have submitted low
      category: 'appliance',
      hostelBlock: 'A Block',
      roomNumber: 'Mess Hall',
      status: 'SUBMITTED',
      createdAt: new Date('2026-10-18T11:00:00.000Z'),
      safetyIndicators: ['Possible electrical fire/spark hazard detected']
    };

    const rec = calculatePriorityRecommendation(hazardComplaint, [hazardComplaint], {
      referenceTimeMs: referenceTime
    });

    assert.equal(rec.factors.severity.points, 40, 'Safety indicators must trigger maximum severity (40 pts)');
    assert.equal(rec.recommendedPriority, 'EMERGENCY');
    assert.match(rec.factors.severity.detail, /physical safety hazard flagged/i);
  });
});


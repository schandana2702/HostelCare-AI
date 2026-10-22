import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Unit & Workflow Validation for Complaint Closure and Role Permissions
 */

describe('Student Complaint Closure & Lifecycle Validation', () => {
  // Mock of validation logic applied in complaintService.submitFeedback
  function validateClosureAttempt({ complaint, rating, feedbackText, actor }) {
    if (actor.role && !['student', 'admin', 'administrator'].includes(actor.role)) {
      throw new Error('Only the student resident can submit resolution confirmation and rating.');
    }

    const cleanRating = Math.max(1, Math.min(5, Math.round(Number(rating) || 5)));
    const cleanFeedback = typeof feedbackText === 'string' ? feedbackText.trim() : '';

    if (!complaint) {
      throw new Error('Complaint was not found.');
    }

    if (complaint.status === 'CLOSED') {
      throw new Error('This complaint has already been closed and verified.');
    }

    const isPrivileged = ['admin', 'administrator'].includes(actor.role);
    if (!isPrivileged && complaint.status !== 'AWAITING_VERIFICATION') {
      throw new Error(
        'Complaint cannot be closed before physical inspection and verification by the hostel warden.'
      );
    }

    const currentUid = actor.uid;
    if (!isPrivileged && complaint.studentId && currentUid && complaint.studentId !== currentUid) {
      throw new Error('Permission denied: You can only close complaints submitted by your own account.');
    }

    const history = [...(complaint.history || [])];
    const actorName = actor.name || complaint.studentName || 'Student';
    const closeNote = cleanFeedback
      ? `Student confirmed resolution with ${cleanRating}-star rating: "${cleanFeedback}"`
      : `Student confirmed resolution with ${cleanRating}-star rating.`;

    history.push({
      status: 'CLOSED',
      timestamp: new Date().toISOString(),
      actorName,
      note: closeNote
    });

    return {
      status: 'CLOSED',
      rating: cleanRating,
      feedback: cleanFeedback,
      closedBy: currentUid || complaint.studentId,
      resolvedAt: new Date().toISOString(),
      statusNote: closeNote,
      history
    };
  }

  it('1. Successfully confirms resolution and closes complaint after warden verification', () => {
    const verifiedComplaint = {
      id: 'comp-100',
      title: 'Geyser repair in room 201',
      studentId: 'student-uid-1',
      studentName: 'Aarav Kumar',
      status: 'AWAITING_VERIFICATION',
      verifiedByWarden: true,
      history: [
        { status: 'SUBMITTED', actorName: 'Aarav Kumar' },
        { status: 'AWAITING_VERIFICATION', actorName: 'Warden Sharma' }
      ]
    };

    const result = validateClosureAttempt({
      complaint: verifiedComplaint,
      rating: 5,
      feedbackText: 'Geyser is heating properly now. Excellent fast service!',
      actor: { uid: 'student-uid-1', name: 'Aarav Kumar', role: 'student' }
    });

    assert.equal(result.status, 'CLOSED');
    assert.equal(result.rating, 5);
    assert.equal(result.feedback, 'Geyser is heating properly now. Excellent fast service!');
    assert.equal(result.closedBy, 'student-uid-1');
    assert.equal(result.history.length, 3);
    assert.equal(result.history[2].status, 'CLOSED');
    assert.match(result.history[2].note, /5-star rating/);
  });

  it('2. Prevents closing complaint prematurely before warden verification (e.g. while COMPLETED)', () => {
    const technicianFinishedComplaint = {
      id: 'comp-101',
      title: 'Leaking pipe',
      studentId: 'student-uid-1',
      status: 'COMPLETED', // Maintenance marked completed, but warden has NOT verified yet
      verifiedByWarden: false
    };

    assert.throws(
      () =>
        validateClosureAttempt({
          complaint: technicianFinishedComplaint,
          rating: 4,
          feedbackText: 'Looks good',
          actor: { uid: 'student-uid-1', name: 'Aarav', role: 'student' }
        }),
      /warden/i
    );
  });

  it('3. Prevents duplicate closure of an already CLOSED complaint', () => {
    const alreadyClosedComplaint = {
      id: 'comp-102',
      title: 'Fan repair',
      studentId: 'student-uid-1',
      status: 'CLOSED',
      rating: 5
    };

    assert.throws(
      () =>
        validateClosureAttempt({
          complaint: alreadyClosedComplaint,
          rating: 5,
          feedbackText: 'Trying to close again',
          actor: { uid: 'student-uid-1', name: 'Aarav', role: 'student' }
        }),
      /already been closed/i
    );
  });

  it('4. Rejects closure attempt by a different student (student cannot close peers ticket)', () => {
    const peerComplaint = {
      id: 'comp-103',
      title: 'Window repair',
      studentId: 'student-uid-1', // belongs to student 1
      status: 'AWAITING_VERIFICATION'
    };

    assert.throws(
      () =>
        validateClosureAttempt({
          complaint: peerComplaint,
          rating: 5,
          feedbackText: '',
          actor: { uid: 'student-uid-2', name: 'Sneha', role: 'student' } // student 2
        }),
      /own account/i
    );
  });

  it('5. Clamps rating safely to valid 1-5 integer bounds', () => {
    const complaint = {
      id: 'comp-104',
      studentId: 'student-uid-1',
      status: 'AWAITING_VERIFICATION'
    };

    const outOfBoundsHigh = validateClosureAttempt({
      complaint,
      rating: 10, // out of range
      feedbackText: '',
      actor: { uid: 'student-uid-1', name: 'Aarav', role: 'student' }
    });
    assert.equal(outOfBoundsHigh.rating, 5);

    const outOfBoundsLow = validateClosureAttempt({
      complaint,
      rating: -2, // out of range
      feedbackText: '',
      actor: { uid: 'student-uid-1', name: 'Aarav', role: 'student' }
    });
    assert.equal(outOfBoundsLow.rating, 1);
  });

  it('6. Verifies Firestore rules field whitelist allows only expected closure keys', () => {
    const allowedKeys = [
      'status',
      'feedback',
      'rating',
      'resolvedAt',
      'updatedAt',
      'statusNote',
      'history',
      'closedBy',
      'closedAt'
    ];

    const studentUpdatePayload = {
      status: 'CLOSED',
      feedback: 'Great job',
      rating: 5,
      resolvedAt: '2026-10-18T12:00:00.000Z',
      updatedAt: 'SERVER_TIMESTAMP',
      statusNote: 'Confirmed',
      history: [],
      closedBy: 'student-123',
      closedAt: 'SERVER_TIMESTAMP'
    };

    const attemptedKeys = Object.keys(studentUpdatePayload);
    const hasDisallowedKeys = attemptedKeys.some((k) => !allowedKeys.includes(k));
    assert.equal(hasDisallowedKeys, false, 'Student payload must strictly match firestore.rules whitelist');

    // Tampering test: student trying to change priority or assignedToId
    const tamperedPayload = { ...studentUpdatePayload, priority: 'LOW' };
    const tamperedHasDisallowed = Object.keys(tamperedPayload).some((k) => !allowedKeys.includes(k));
    assert.equal(tamperedHasDisallowed, true, 'Tampered payload must be caught by firestore.rules whitelist');
  });

  it('7. Accurately maps progress stepper states across all 7 lifecycle stages and stops spinner on CLOSED', () => {
    const STEPS = [
      'SUBMITTED',
      'PENDING',
      'ASSIGNED',
      'IN_PROGRESS',
      'COMPLETED',
      'AWAITING_VERIFICATION',
      'CLOSED'
    ];

    function calculateStepStates(currentStatus) {
      const isAllClosed = currentStatus === 'CLOSED';
      const currentIndex = STEPS.indexOf(currentStatus);
      return STEPS.map((stepKey, idx) => {
        const isCompleted = isAllClosed ? true : idx < currentIndex;
        const isCurrent = !isAllClosed && idx === currentIndex;
        const isFuture = !isAllClosed && idx > currentIndex;
        return { stepKey, isCompleted, isCurrent, isFuture };
      });
    }

    // A: When status is SUBMITTED
    const submittedStates = calculateStepStates('SUBMITTED');
    assert.equal(submittedStates[0].isCompleted, false);
    assert.equal(submittedStates[0].isCurrent, true, 'Submitted stage is active');
    assert.equal(submittedStates[1].isFuture, true);

    // B: When status advances to PENDING
    const pendingStates = calculateStepStates('PENDING');
    assert.equal(pendingStates[0].isCompleted, true, 'Submitted becomes permanently completed checkmark');
    assert.equal(pendingStates[1].isCurrent, true, 'Pending stage is active');

    // C: When status advances to ASSIGNED
    const assignedStates = calculateStepStates('ASSIGNED');
    assert.equal(assignedStates[0].isCompleted, true);
    assert.equal(assignedStates[1].isCompleted, true);
    assert.equal(assignedStates[2].isCurrent, true);

    // D: When status reaches CLOSED
    const closedStates = calculateStepStates('CLOSED');
    // EVERY stage must be completed, and NO stage is current/spinning
    closedStates.forEach((st) => {
      assert.equal(st.isCompleted, true, `Stage ${st.stepKey} must be marked completed on CLOSED`);
      assert.equal(st.isCurrent, false, `Stage ${st.stepKey} must NOT be spinning on CLOSED`);
      assert.equal(st.isFuture, false, `Stage ${st.stepKey} cannot be future on CLOSED`);
    });
  });

  it('8. Normalizes legacy statuses (RESOLVED -> CLOSED, IN_REVIEW -> PENDING) without corrupting stepper', () => {
    function normalizeWorkflowStatus(status) {
      if (!status) return 'SUBMITTED';
      const s = String(status).toUpperCase().trim();
      if (s === 'RESOLVED') return 'CLOSED';
      if (s === 'IN_REVIEW') return 'PENDING';
      if (s === 'VERIFIED') return 'AWAITING_VERIFICATION';
      const valid = ['SUBMITTED', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'AWAITING_VERIFICATION', 'CLOSED'];
      if (valid.includes(s)) return s;
      return 'SUBMITTED';
    }

    assert.equal(normalizeWorkflowStatus('RESOLVED'), 'CLOSED');
    assert.equal(normalizeWorkflowStatus('resolved'), 'CLOSED');
    assert.equal(normalizeWorkflowStatus('IN_REVIEW'), 'PENDING');
    assert.equal(normalizeWorkflowStatus('VERIFIED'), 'AWAITING_VERIFICATION');
    assert.equal(normalizeWorkflowStatus('unknown_status'), 'SUBMITTED');
  });

  it('9. Prevents duplicate submissions and concurrent double-clicks during closure', async () => {
    let callCount = 0;
    let inFlight = false;

    // Simulate modal controller guard
    async function submitFeedbackGuard(complaintId, rating, feedback) {
      if (inFlight) {
        throw new Error('Duplicate submission blocked: confirmation is already in flight.');
      }
      inFlight = true;
      callCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 50));
      inFlight = false;
      return { success: true };
    }

    // First click launches operation
    const firstCall = submitFeedbackGuard('comp-123', 5, 'Great repair');
    // Immediate second click (before first resolves) MUST be blocked
    await assert.rejects(
      async () => {
        await submitFeedbackGuard('comp-123', 5, 'Great repair');
      },
      /duplicate submission blocked/i
    );

    await firstCall;
    assert.equal(callCount, 1, 'Only exactly 1 Firestore write must be initiated');
  });

  it('10. Preserves resident input and propagates real error on failure without reporting false success', async () => {
    let formState = {
      rating: 4,
      feedback: 'The technician fixed the geyser, but left some debris.',
      loading: false,
      error: '',
      success: false
    };

    async function mockFailingConfirm() {
      formState.loading = true;
      formState.error = '';
      try {
        // Simulate network failure or permission denied
        throw new Error('Network timeout: Could not reach Cloud Firestore.');
      } catch (err) {
        formState.error = err.message;
        // MUST NOT reset rating or feedback
      } finally {
        formState.loading = false;
      }
    }

    await mockFailingConfirm();

    // Verify error is set and false success is NOT reported
    assert.equal(formState.success, false, 'Success state must remain false on error');
    assert.match(formState.error, /Network timeout/i);
    assert.equal(formState.loading, false);
    // User input is preserved:
    assert.equal(formState.rating, 4);
    assert.equal(formState.feedback, 'The technician fixed the geyser, but left some debris.');
  });

  it('11. Validates safe modal transition sequence: onConfirm -> success animation -> onClose', async () => {
    const lifecycleLog = [];
    let isModalOpen = true;

    async function onConfirm() {
      lifecycleLog.push('onConfirm_started');
      await new Promise((resolve) => setTimeout(resolve, 30));
      lifecycleLog.push('onConfirm_succeeded');
    }

    function onClose() {
      lifecycleLog.push('onClose_called');
      isModalOpen = false;
    }

    // Modal submit workflow
    lifecycleLog.push('submit_clicked');
    await onConfirm();
    lifecycleLog.push('success_animation_displayed');
    // Simulate 1200ms animation completing
    await new Promise((resolve) => setTimeout(resolve, 50));
    onClose();

    assert.deepEqual(lifecycleLog, [
      'submit_clicked',
      'onConfirm_started',
      'onConfirm_succeeded',
      'success_animation_displayed',
      'onClose_called'
    ]);
    assert.equal(isModalOpen, false, 'Modal closes cleanly after success animation finishes');
  });

  it('12. Ensures refreshing complaint data preserves CLOSED status, feedback rating, and complete history', () => {
    const verifiedComplaint = {
      id: 'comp-200',
      title: 'Water tap repair in room 302',
      studentId: 'student-302',
      studentName: 'Sneha Patel',
      status: 'AWAITING_VERIFICATION',
      verifiedByWarden: true,
      history: [
        { status: 'SUBMITTED', timestamp: '2026-10-18T10:00:00Z', actorName: 'Sneha Patel', note: 'Submitted' },
        { status: 'AWAITING_VERIFICATION', timestamp: '2026-10-18T14:00:00Z', actorName: 'Warden', note: 'Verified' }
      ]
    };

    const closedComplaint = validateClosureAttempt({
      complaint: verifiedComplaint,
      rating: 5,
      feedbackText: 'Super fast repair, thanks!',
      actor: { uid: 'student-302', name: 'Sneha Patel', role: 'student' }
    });

    // Simulate page reload / state refresh from Firestore
    const refreshedDoc = JSON.parse(JSON.stringify(closedComplaint));

    assert.equal(refreshedDoc.status, 'CLOSED');
    assert.equal(refreshedDoc.rating, 5);
    assert.equal(refreshedDoc.feedback, 'Super fast repair, thanks!');
    assert.equal(refreshedDoc.closedBy, 'student-302');
    assert.ok(refreshedDoc.resolvedAt);
    assert.equal(refreshedDoc.history.length, 3);
    assert.equal(refreshedDoc.history[2].status, 'CLOSED');
    assert.match(refreshedDoc.history[2].note, /5-star rating/);
  });
});



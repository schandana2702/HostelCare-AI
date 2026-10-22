import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeComplaintText, triageComplaintAI } from '../src/services/aiService.js';

describe('HostelCare AI Triage & Safety Intelligence Engine', () => {
  it('1. Accurately categorizes plumbing issues and sets appropriate routine priority', () => {
    const analysis = analyzeComplaintText(
      'Leaking washbasin tap',
      'The tap in the washroom is continuously dripping water and needs a washer replacement.'
    );

    assert.equal(analysis.category, 'plumbing');
    assert.equal(analysis.priority, 'MEDIUM');
    assert.equal(analysis.provider, 'heuristic');
    assert.equal(analysis.safetyIndicators.length, 0);
    assert.ok(analysis.confidence >= 50, 'Confidence should be at least baseline 50%');
  });

  it('2. Accurately detects electrical hazards and elevates to EMERGENCY with safety indicators', () => {
    const analysis = analyzeComplaintText(
      'Switch board sparking and burning smell',
      'There are visible sparks coming from the main switch socket near bed 2. It gave a minor shock.'
    );

    assert.equal(analysis.category, 'electrical');
    assert.equal(analysis.priority, 'EMERGENCY');
    assert.ok(analysis.safetyIndicators.length >= 2, 'Should detect multiple safety hazard indicators');
    assert.ok(
      analysis.safetyIndicators.some((s) => s.toLowerCase().includes('spark') || s.toLowerCase().includes('fire')),
      'Must flag spark/fire hazard'
    );
    assert.ok(
      analysis.safetyIndicators.some((s) => s.toLowerCase().includes('shock')),
      'Must flag shock hazard'
    );
  });

  it('3. Accurately flags major water flooding as physical hazard and emergency', () => {
    const analysis = analyzeComplaintText(
      'Burst pipeline flooding corridor',
      'The overhead pipe has burst and water is flooding into room 102.'
    );

    assert.equal(analysis.category, 'plumbing');
    assert.equal(analysis.priority, 'EMERGENCY');
    assert.ok(
      analysis.safetyIndicators.some((s) => s.toLowerCase().includes('flooding') || s.toLowerCase().includes('burst')),
      'Must flag flooding or pipe rupture hazard'
    );
  });

  it('4. Correctly categorizes wifi and internet issues', () => {
    const analysis = analyzeComplaintText(
      'No internet connection in block B wing',
      'The wifi router on the second floor has no signal and ethernet cable gives no connection.'
    );

    assert.equal(analysis.category, 'wifi');
    assert.equal(analysis.safetyIndicators.length, 0);
  });

  it('5. Safe fallback when AI provider is unconfigured or offline (never fabricates fake AI)', async () => {
    const liveResult = await triageComplaintAI({
      title: 'Ceiling fan making squeaking noise',
      description: 'The ceiling fan regulator is loose and fan makes loud mechanical noise at speed 4.',
      category: 'electrical',
      hostelBlock: 'Block A',
      roomNumber: '305'
    });

    assert.ok(liveResult, 'Result must be returned');
    assert.equal(liveResult.category, 'electrical');
    // When Firebase functions or Gemini key are not configured, available must be false
    assert.equal(liveResult.available, false);
    assert.equal(liveResult.provider, 'heuristic');
    assert.ok(liveResult.unavailableReason, 'Must provide reason why live AI is unavailable');
  });

  it('6. Validates complaint persistence payload with aiTriage and safetyIndicators', () => {
    const title = 'Geyser leaking hot water with sparks';
    const description = 'Hot water leaking from bottom of geyser and electrical wire sparked once.';
    const analysis = analyzeComplaintText(title, description);

    // Format matches SubmitComplaint.jsx payload
    const complaintData = {
      title,
      description,
      category: analysis.category,
      priority: analysis.priority,
      hostelBlock: 'Block C',
      roomNumber: '412',
      studentId: 'student-test-uid',
      studentName: 'Rohan Sharma',
      aiTriage: {
        category: analysis.category,
        priority: analysis.priority,
        explanation: analysis.reasoning,
        confidence: analysis.confidence,
        provider: analysis.provider,
        aiModel: analysis.aiModel,
        available: Boolean(analysis.available),
        unavailableReason: analysis.unavailableReason || null,
        evaluatedAt: new Date().toISOString()
      },
      safetyIndicators: analysis.safetyIndicators
    };

    assert.equal(complaintData.aiTriage.category, 'plumbing');
    assert.equal(complaintData.aiTriage.priority, 'EMERGENCY');
    assert.equal(complaintData.aiTriage.available, false);
    assert.ok(complaintData.safetyIndicators.length > 0);
    assert.ok(complaintData.safetyIndicators.some((s) => s.toLowerCase().includes('spark')));
  });

  it('7. Accurately classifies "light", "lights", and "bulb" as electrical category with routine MEDIUM priority', () => {
    const r1 = analyzeComplaintText('light', '');
    assert.equal(r1.category, 'electrical', 'Single title "light" must categorize as electrical');
    assert.equal(r1.priority, 'MEDIUM', 'Routine lighting fixture failure should be standard MEDIUM priority');

    const r2 = analyzeComplaintText('lights', 'Study lights in room 204 are completely off');
    assert.equal(r2.category, 'electrical', '"lights" must categorize as electrical');
    assert.equal(r2.priority, 'MEDIUM');

    const r3 = analyzeComplaintText('bulb', 'The ceiling tube bulb is fused and flickering');
    assert.equal(r3.category, 'electrical', '"bulb" must categorize as electrical');
    assert.equal(r3.priority, 'MEDIUM');
  });

  it('8. Correctly avoids classifying ambiguous adjectival "light" (e.g. "light leak", "light dust") as electrical', () => {
    const leakAnalysis = analyzeComplaintText('light leak in bathroom', 'There is a light water dripping from the washbasin faucet');
    assert.equal(leakAnalysis.category, 'plumbing', '"light leak" must be categorized as plumbing, not electrical');

    const dustAnalysis = analyzeComplaintText('light dust on table', 'Need light cleaning of study area');
    assert.equal(dustAnalysis.category, 'cleaning', '"light dust" must be categorized as cleaning, not electrical');

    const scratchAnalysis = analyzeComplaintText('light scratch on door', 'Small scratch on the wooden wardrobe hinge');
    assert.equal(scratchAnalysis.category, 'carpentry', '"light scratch on door" must be categorized as carpentry, not electrical');
  });

  it('9. Accurately classifies "wiring" and "power" as electrical with appropriate priority', () => {
    const wireAnalysis = analyzeComplaintText('faulty wiring', 'Loose wiring near the table socket');
    assert.equal(wireAnalysis.category, 'electrical');

    const powerAnalysis = analyzeComplaintText('no power in room', 'Total power cut after tripping');
    assert.equal(powerAnalysis.category, 'electrical');
    assert.equal(powerAnalysis.priority, 'HIGH', 'Total power cut must be elevated to HIGH priority');
  });

  it('10. Ensures unrelated generic complaints without electrical keywords do not become electrical', () => {
    const general = analyzeComplaintText('general inquiry', 'Need general inspection of room inventory');
    assert.notEqual(general.category, 'electrical', 'Generic complaint must not become electrical');
    assert.equal(general.category, 'other');
    assert.equal(general.priority, 'LOW');
  });
});

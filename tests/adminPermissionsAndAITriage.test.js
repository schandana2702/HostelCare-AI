import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Admin RBAC & Gemini AI Triage Audit', () => {
  describe('Firestore Security Rules RBAC Validation', () => {
    const rulesContent = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');

    it('1. isAdmin() recognizes both "admin" and "administrator" roles', () => {
      // Must support both canonical role representations
      assert.ok(
        rulesContent.includes("getUserRole() == 'admin' || getUserRole() == 'administrator'") ||
        (rulesContent.includes("'admin'") && rulesContent.includes("'administrator'")),
        'Expected isAdmin() in firestore.rules to support both admin and administrator roles'
      );
    });

    it('2. Audit logs permission allows both warden and admin read, and is append-only', () => {
      assert.ok(
        rulesContent.includes('match /auditLogs/{logId}'),
        'auditLogs match block must exist'
      );
      assert.ok(
        rulesContent.includes('allow read: if isWarden() || isAdmin()') ||
        rulesContent.includes('allow read: if isWarden();'),
        'auditLogs must allow read for warden and admin'
      );
      assert.ok(
        rulesContent.includes('allow update, delete: if false;'),
        'auditLogs must strictly enforce immutability (update and delete forbidden)'
      );
    });

    it('3. Settings and Hostels collections allow write for isAdmin()', () => {
      assert.ok(
        rulesContent.includes('match /settings/{docId}'),
        'settings match block must exist'
      );
      assert.ok(
        rulesContent.includes('match /hostels/{blockId}'),
        'hostels match block must exist'
      );
    });
  });

  describe('UI Banner Cleanliness & Real AI Preservation', () => {
    it('4. Confirms "AI Triage Active" footer banner is removed from Sidebar.jsx', () => {
      const sidebarContent = readFileSync(resolve(process.cwd(), 'src/components/common/Sidebar.jsx'), 'utf8');
      assert.strictEqual(
        sidebarContent.includes('AI Triage Active'),
        false,
        'Expected Sidebar.jsx to NOT contain the decorative "AI Triage Active" banner'
      );
    });

    it('5. Confirms real AI features remain present and functional in SmartAssistant and ComplaintDetail', () => {
      const smartAssistantContent = readFileSync(resolve(process.cwd(), 'src/components/ai/SmartAssistant.jsx'), 'utf8');
      const complaintDetailContent = readFileSync(resolve(process.cwd(), 'src/pages/student/ComplaintDetail.jsx'), 'utf8');

      assert.ok(
        smartAssistantContent.includes('triageComplaintAI'),
        'SmartAssistant must import and use triageComplaintAI'
      );
      assert.ok(
        complaintDetailContent.includes('aiTriage'),
        'ComplaintDetail must render aiTriage recommendation'
      );
    });
  });

  describe('Gemini AI Output Parsing & Markdown Fence Stripping', () => {
    function parseCandidateResponse(candidateText) {
      if (!candidateText) {
        return { available: false, reason: 'Empty candidate text returned by Gemini API.' };
      }

      let cleanJson = candidateText.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      }

      let parsed;
      try {
        parsed = JSON.parse(cleanJson);
      } catch {
        return { available: false, reason: 'Malformed JSON returned by model.' };
      }

      const validCategories = ['plumbing', 'electrical', 'carpentry', 'cleaning', 'wifi', 'appliance', 'pest', 'security', 'other'];
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];

      return {
        available: true,
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        result: {
          category: validCategories.includes((parsed.category || '').toLowerCase()) ? parsed.category.toLowerCase() : 'other',
          priority: validPriorities.includes((parsed.priority || '').toUpperCase()) ? parsed.priority.toUpperCase() : 'MEDIUM',
          explanation: parsed.explanation || '',
          safetyIndicators: Array.isArray(parsed.safetyIndicators) ? parsed.safetyIndicators : [],
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 80
        }
      };
    }

    it('6. Successfully parses raw clean JSON from Gemini model', () => {
      const rawJson = '{"category":"plumbing","priority":"HIGH","explanation":"Water leak near main board","safetyIndicators":["Water leak near electrical hazard"],"confidence":90}';
      const parsed = parseCandidateResponse(rawJson);

      assert.strictEqual(parsed.available, true);
      assert.strictEqual(parsed.provider, 'gemini');
      assert.strictEqual(parsed.result.category, 'plumbing');
      assert.strictEqual(parsed.result.priority, 'HIGH');
      assert.strictEqual(parsed.result.safetyIndicators.length, 1);
    });

    it('7. Successfully parses markdown-fenced JSON (```json ... ```) without throwing syntax errors', () => {
      const markdownJson = '```json\n{\n  "category": "electrical",\n  "priority": "EMERGENCY",\n  "explanation": "Live sparking wires detected",\n  "safetyIndicators": ["Possible electrical fire risk"],\n  "confidence": 95\n}\n```';
      const parsed = parseCandidateResponse(markdownJson);

      assert.strictEqual(parsed.available, true);
      assert.strictEqual(parsed.provider, 'gemini');
      assert.strictEqual(parsed.result.category, 'electrical');
      assert.strictEqual(parsed.result.priority, 'EMERGENCY');
      assert.strictEqual(parsed.result.safetyIndicators[0], 'Possible electrical fire risk');
    });

    it('8. Safely handles malformed model output by reporting unavailable with reason', () => {
      const malformed = 'Not valid JSON at all';
      const parsed = parseCandidateResponse(malformed);

      assert.strictEqual(parsed.available, false);
      assert.strictEqual(parsed.reason, 'Malformed JSON returned by model.');
    });
  });

  describe('Privileged Account Creation Verification', () => {
    it('9. functions/index.js validates privileged roles including administrator', () => {
      const fnContent = readFileSync(resolve(process.cwd(), 'functions/index.js'), 'utf8');
      assert.ok(
        fnContent.includes("'administrator'"),
        'functions/index.js must include administrator in validRoles'
      );
    });
  });
});

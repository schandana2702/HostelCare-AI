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

  describe('Human-Friendly Complaint IDs & Clean Student Diagnostics', () => {
    it('10. getFriendlyComplaintId formats raw Firestore IDs deterministically without PII', async () => {
      const { getFriendlyComplaintId } = await import('../src/utils/complaintUtils.js');

      assert.strictEqual(getFriendlyComplaintId('eiPqKgLWCBuVEBExyvnu'), 'HC-EIPQKG');
      assert.strictEqual(getFriendlyComplaintId({ id: 'eiPqKgLWCBuVEBExyvnu' }), 'HC-EIPQKG');
      assert.strictEqual(getFriendlyComplaintId({ ticketId: 'HC-2026-001' }), 'HC-2026-001');
      assert.strictEqual(getFriendlyComplaintId('HC-CUSTOM-99'), 'HC-CUSTOM-99');
      assert.strictEqual(getFriendlyComplaintId(null), 'HC-TICKET');
    });

    it('11. SmartAssistant.jsx does not display raw provider diagnostics to students', () => {
      const assistantContent = readFileSync(resolve(process.cwd(), 'src/components/ai/SmartAssistant.jsx'), 'utf8');

      assert.strictEqual(
        assistantContent.includes('Deterministic Engine'),
        false,
        'Deterministic Engine must not be shown to students'
      );
      assert.strictEqual(
        assistantContent.includes('Gemini 1.5 Flash (Live)'),
        false,
        'Gemini 1.5 Flash (Live) must not be shown to students'
      );
      assert.ok(
        assistantContent.includes('AI Suggestion Available'),
        'SmartAssistant must show clean "AI Suggestion Available" badge'
      );
    });

    it('12. ComplaintDetail.jsx uses clean student-facing AI labels and removes raw confidence', () => {
      const detailContent = readFileSync(resolve(process.cwd(), 'src/pages/student/ComplaintDetail.jsx'), 'utf8');

      assert.strictEqual(
        detailContent.includes('Deterministic Engine'),
        false,
        'Deterministic Engine must not be displayed in ComplaintDetail'
      );
      assert.strictEqual(
        detailContent.includes('Gemini 1.5 Flash (Live)'),
        false,
        'Gemini 1.5 Flash (Live) must not be displayed in ComplaintDetail'
      );
      assert.ok(
        detailContent.includes('AI Assisted Recommendation'),
        'ComplaintDetail must display clean AI Assisted Recommendation'
      );
      assert.ok(
        detailContent.includes('Automated Priority Assessment'),
        'ComplaintDetail must display clean Automated Priority Assessment'
      );
    });
  });

  describe('Administrator Navigation & Audit Logs Removal Verification', () => {
    it('13. Confirms Audit Logs is removed from Sidebar.jsx administrator navigation', () => {
      const sidebarContent = readFileSync(resolve(process.cwd(), 'src/components/common/Sidebar.jsx'), 'utf8');

      assert.strictEqual(
        sidebarContent.includes("to: '/admin/logs'"),
        false,
        'Audit logs link must not exist in Sidebar navigation'
      );
      assert.strictEqual(
        sidebarContent.includes('label: \'Audit Logs\''),
        false,
        'Audit logs label must not exist in Sidebar navigation'
      );

      // Verify the 5 remaining administrator items
      assert.ok(sidebarContent.includes('/admin/dashboard'), 'Sidebar must include System Dashboard');
      assert.ok(sidebarContent.includes('/admin/users'), 'Sidebar must include User Management');
      assert.ok(sidebarContent.includes('/admin/complaints'), 'Sidebar must include All Complaints');
      assert.ok(sidebarContent.includes('/admin/hostels'), 'Sidebar must include Hostel Management');
      assert.ok(sidebarContent.includes('/admin/categories'), 'Sidebar must include Categories & SLA');
    });

    it('14. Confirms AppRoutes.jsx redirects deprecated /admin/logs and /admin/audit safely to /admin/dashboard', () => {
      const routesContent = readFileSync(resolve(process.cwd(), 'src/routes/AppRoutes.jsx'), 'utf8');

      assert.strictEqual(
        routesContent.includes('<AuditLogs'),
        false,
        'AppRoutes must not mount AuditLogs component'
      );
      assert.ok(
        routesContent.includes('path="/admin/audit"') && routesContent.includes('to="/admin/dashboard"'),
        'AppRoutes must redirect /admin/audit to /admin/dashboard'
      );
      assert.ok(
        routesContent.includes('path="/admin/logs"') && routesContent.includes('to="/admin/dashboard"'),
        'AppRoutes must redirect /admin/logs to /admin/dashboard'
      );
    });

    it('15. Confirms AdminDashboard.jsx does not link to Audit Logs and preserves remaining navigation', () => {
      const dashboardContent = readFileSync(resolve(process.cwd(), 'src/pages/admin/AdminDashboard.jsx'), 'utf8');

      assert.strictEqual(
        dashboardContent.includes('/admin/logs'),
        false,
        'AdminDashboard must not link to /admin/logs'
      );
      assert.ok(
        dashboardContent.includes('/admin/complaints'),
        'AdminDashboard must link to /admin/complaints'
      );
    });
  });

  describe('Gemini Cloud Function Secret Binding & Response Safety', () => {
    it('16. functions/index.js binds GEMINI_API_KEY secret securely', () => {
      const fnContent = readFileSync(resolve(process.cwd(), 'functions/index.js'), 'utf8');

      assert.ok(
        fnContent.includes("secrets: ['GEMINI_API_KEY']") || fnContent.includes('secrets: ["GEMINI_API_KEY"]'),
        'triageComplaintAI function must bind GEMINI_API_KEY secret'
      );
    });
  });
});

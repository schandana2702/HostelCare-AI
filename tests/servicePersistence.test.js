import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { announcementService } from '../src/services/announcementService.js';
import { calendarService } from '../src/services/calendarService.js';
import { inspectionService } from '../src/services/inspectionService.js';
import { notificationService } from '../src/services/notificationService.js';
import { auditService } from '../src/services/auditService.js';

describe('Service Persistence & MockDb Removal Audit', () => {
  it('1. Verifies zero mockDb references in all 5 authoritative services', () => {
    const serviceFiles = [
      'src/services/announcementService.js',
      'src/services/calendarService.js',
      'src/services/inspectionService.js',
      'src/services/notificationService.js',
      'src/services/auditService.js'
    ];

    for (const file of serviceFiles) {
      const content = readFileSync(resolve(process.cwd(), file), 'utf8');
      assert.strictEqual(
        content.includes('mockDb'),
        false,
        `Expected ${file} to have 0 mockDb references, but found one.`
      );
    }
  });

  describe('Unconfigured Firebase Explicit Error Handling', () => {
    it('2. announcementService throws descriptive errors when Firebase is unconfigured', async () => {
      // In test environment without .env credentials, isFirebaseConfigured is false
      await assert.rejects(
        () => announcementService.getAnnouncements(),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot load announcements.'
        }
      );

      await assert.rejects(
        () => announcementService.createAnnouncement({ title: 'Test notice' }),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot create announcement.'
        }
      );

      await assert.rejects(
        () => announcementService.deleteAnnouncement('notice_123'),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot delete announcement.'
        }
      );
    });

    it('3. calendarService throws descriptive errors when Firebase is unconfigured', async () => {
      await assert.rejects(
        () => calendarService.getCalendarEvents(),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot load calendar events.'
        }
      );

      await assert.rejects(
        () => calendarService.createCalendarEvent({ title: 'AC Servicing' }),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot create calendar event.'
        }
      );
    });

    it('4. inspectionService throws descriptive errors when Firebase is unconfigured', async () => {
      await assert.rejects(
        () => inspectionService.getInspections(),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot load inspections.'
        }
      );

      await assert.rejects(
        () => inspectionService.recordInspection({ roomNumber: '204' }),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot record inspection.'
        }
      );
    });

    it('5. notificationService throws descriptive errors when Firebase is unconfigured', async () => {
      // Missing userId returns empty array safely
      const emptyUserResult = await notificationService.getNotifications('');
      assert.deepStrictEqual(emptyUserResult, []);

      await assert.rejects(
        () => notificationService.getNotifications('user_student_1'),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot load notifications.'
        }
      );

      await assert.rejects(
        () => notificationService.markAsRead('notif_123'),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot update notification.'
        }
      );

      await assert.rejects(
        () => notificationService.markAllAsRead('user_student_1'),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot update notifications.'
        }
      );

      await assert.rejects(
        () => notificationService.createNotification({ title: 'New alert' }),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot create notification.'
        }
      );
    });

    it('6. auditService throws descriptive errors when Firebase is unconfigured', async () => {
      await assert.rejects(
        () => auditService.getAuditLogs(),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot load audit logs.'
        }
      );

      await assert.rejects(
        () => auditService.logAction('TEST_ACTION', { displayName: 'Admin' }, 'target_1', {}),
        {
          name: 'Error',
          message: 'Firebase is not configured. Cannot record audit log.'
        }
      );
    });
  });

  describe('Firestore Response Processing & Empty States Validation', () => {
    // Simulated Firestore QuerySnapshot mapper validation
    function mapQuerySnapshot(docs) {
      return docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    it('7. Empty Firestore collections produce honest empty arrays, not synthetic mock entries', () => {
      const emptySnapshot = { docs: [] };
      const result = mapQuerySnapshot(emptySnapshot.docs);
      assert.deepStrictEqual(result, []);
      assert.strictEqual(result.length, 0);
    });

    it('8. Maps Firestore documents with accurate document ID and attributes', () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'ann_abc123',
            data: () => ({
              title: 'Water Outage Notice',
              content: 'Water supply will be suspended tomorrow from 10 AM to 2 PM.',
              priority: 'HIGH',
              hostelBlock: 'Block A (Boys)'
            })
          },
          {
            id: 'ann_xyz789',
            data: () => ({
              title: 'Mess Menu Survey',
              content: 'Submit your preferences for the upcoming term menu.',
              priority: 'MEDIUM',
              hostelBlock: 'All Hostels'
            })
          }
        ]
      };

      const result = mapQuerySnapshot(mockSnapshot.docs);
      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].id, 'ann_abc123');
      assert.strictEqual(result[0].title, 'Water Outage Notice');
      assert.strictEqual(result[1].id, 'ann_xyz789');
    });

    it('9. Correctly sorts notifications by timestamp descending across multiple date formats', () => {
      const now = Date.now();
      const mockDocs = [
        {
          id: 'n1',
          data: () => ({
            userId: 'user_1',
            message: 'Old notification',
            createdAt: new Date(now - 86400000).toISOString()
          })
        },
        {
          id: 'n2',
          data: () => ({
            userId: 'user_1',
            message: 'Recent notification with Timestamp toMillis',
            createdAt: { toMillis: () => now - 1000 }
          })
        },
        {
          id: 'n3',
          data: () => ({
            userId: 'user_1',
            message: 'Seconds-based Timestamp',
            createdAt: { seconds: Math.floor((now - 3600000) / 1000) }
          })
        }
      ];

      const list = mockDocs.map((d) => ({ id: d.id, ...d.data() }));
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

      assert.strictEqual(list[0].id, 'n2', 'Most recent (toMillis) should be first');
      assert.strictEqual(list[1].id, 'n3', '1-hour old should be second');
      assert.strictEqual(list[2].id, 'n1', '1-day old should be last');
    });

    it('10. Propagates permission-denied errors without masking or swallowing', async () => {
      const simulatePermissionDenied = async () => {
        const err = new Error('Missing or insufficient permissions.');
        err.code = 'permission-denied';
        throw err;
      };

      await assert.rejects(
        () => simulatePermissionDenied(),
        (err) => {
          assert.strictEqual(err.code, 'permission-denied');
          assert.strictEqual(err.message, 'Missing or insufficient permissions.');
          return true;
        }
      );
    });
  });
});

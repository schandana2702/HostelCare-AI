import { isFirebaseConfigured, db } from './firebase';
import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { HOSTEL_BLOCKS } from '../utils/constants';

// Canonical structural defaults for all seven hostel blocks.
// Preserves B Block's 15-floor structural specification.
// Initial room and occupancy counts start at 0 until configured by the Administrator.
export const DEFAULT_HOSTEL_DATA = {
  'A Block':  { block: 'A Block',  total: 0, occupied: 0, floors: 1 },
  'B Block':  { block: 'B Block',  total: 0, occupied: 0, floors: 15 },
  'C Block':  { block: 'C Block',  total: 0, occupied: 0, floors: 1 },
  'D1 Block': { block: 'D1 Block', total: 0, occupied: 0, floors: 1 },
  'D2 Block': { block: 'D2 Block', total: 0, occupied: 0, floors: 1 },
  'E Block':  { block: 'E Block',  total: 0, occupied: 0, floors: 1 },
  'F Block':  { block: 'F Block',  total: 0, occupied: 0, floors: 1 }
};

function sanitizeBlockId(blockName) {
  return blockName.replace(/\s+/g, '_');
}

export const hostelService = {
  /**
   * Fetch all hostel blocks and configuration from Cloud Firestore.
   * If any block is not yet recorded in Firestore, falls back gracefully to
   * the canonical defaults and saves them to Firestore.
   */
  async getHostels() {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot load hostel data.');
    }

    const snap = await getDocs(collection(db, 'hostels'));
    const firestoreData = {};

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const blockName = data.block || docSnap.id.replace(/_/g, ' ');
      firestoreData[blockName] = {
        total: Number(data.total) || 0,
        occupied: Number(data.occupied) || 0,
        floors: Number(data.floors) || (blockName === 'B Block' ? 15 : 1)
      };
    });

    // Merge with canonical blocks to ensure all 7 blocks are always present
    const result = {};
    for (const block of HOSTEL_BLOCKS) {
      if (firestoreData[block]) {
        result[block] = firestoreData[block];
      } else {
        result[block] = { ...DEFAULT_HOSTEL_DATA[block] };
      }
    }

    return result;
  },

  /**
   * Update a specific hostel block's configuration in Cloud Firestore.
   * Only authenticated Administrators have write permission via Firestore security rules.
   */
  async updateBlock(blockName, { total, occupied, floors }) {
    if (!isFirebaseConfigured || !db) {
      throw new Error('Firebase is not configured. Cannot update hostel data.');
    }

    const docId = sanitizeBlockId(blockName);
    const docRef = doc(db, 'hostels', docId);

    const dataToSave = {
      block: blockName,
      total: Math.max(0, parseInt(total, 10) || 0),
      occupied: Math.max(0, parseInt(occupied, 10) || 0),
      floors: Math.max(1, parseInt(floors, 10) || (blockName === 'B Block' ? 15 : 1)),
      updatedAt: serverTimestamp()
    };

    await setDoc(docRef, dataToSave, { merge: true });
    return dataToSave;
  }
};

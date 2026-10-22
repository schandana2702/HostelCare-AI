import { isFirebaseConfigured } from './firebase';

export const seedService = {
  async seedFirestore() {
    throw new Error(
      'Firestore automated seeding is prohibited. Please use the Administrator portal to create accounts and manage hostel blocks directly.'
    );
  }
};


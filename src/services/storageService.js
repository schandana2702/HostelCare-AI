import { storage } from './firebase';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

/** Allowed MIME types for complaint attachments */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif'
];

/** Maximum upload size: 5 MB */
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Validates a file before upload.
 * Throws a descriptive Error if validation fails.
 *
 * @param {File} file
 */
export function validateImageFile(file) {
  if (!file) throw new Error('No file selected.');

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type "${file.type}". ` +
      'Only JPEG, PNG, WebP, GIF, or HEIC images are accepted.'
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `File is too large (${mb} MB). Maximum allowed size is 5 MB.`
    );
  }
}

/**
 * Uploads a complaint image to Firebase Storage with progress tracking.
 *
 * Storage path: complaints/{complaintId}/{timestamp}_{random}.{ext}
 *
 * The file is kept private — Storage security rules require authentication
 * and enforce the 5 MB / image-only content-type constraints server-side.
 *
 * @param {File}     file         The image File object from the file input.
 * @param {string}   complaintId  The Firestore complaint document ID (or 'pending').
 * @param {Function} [onProgress] Optional callback receiving upload percentage (0-100).
 * @param {AbortSignal} [signal]  Optional AbortSignal to cancel the upload.
 * @returns {Promise<string>}     Resolves to the Firebase Storage download URL.
 */
export function uploadComplaintImage(file, complaintId = 'pending', onProgress, signal) {
  // Client-side validation before touching the network
  validateImageFile(file);

  if (!storage) {
    throw new Error(
      'Firebase Storage is not initialised. Check your environment configuration.'
    );
  }

  // Build a collision-free filename: <timestamp>_<random6chars>.<ext>
  const ext = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'jpg';
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const storagePath = `complaints/${complaintId}/${uniqueName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type
    });

    // Allow the caller to cancel via an AbortSignal
    if (signal) {
      if (signal.aborted) {
        uploadTask.cancel();
        reject(new Error('Upload was cancelled before it started.'));
        return;
      }
      signal.addEventListener('abort', () => {
        uploadTask.cancel();
        reject(new Error('Upload cancelled.'));
      });
    }

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (typeof onProgress === 'function') {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress(pct);
        }
      },
      (error) => {
        if (error.code === 'storage/canceled') {
          reject(new Error('Upload cancelled.'));
        } else if (error.code === 'storage/unauthorized') {
          reject(
            new Error(
              'Upload permission denied. Make sure you are signed in and have a valid account.'
            )
          );
        } else if (error.code === 'storage/quota-exceeded') {
          reject(new Error('Storage quota exceeded. Please contact the administrator.'));
        } else {
          reject(new Error(`Upload failed: ${error.message || error.code}`));
        }
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(new Error(`Failed to retrieve download URL: ${err.message}`));
        }
      }
    );
  });
}

/**
 * Deletes a file from Firebase Storage by its full download URL.
 * Silently ignores "object-not-found" errors (already deleted).
 *
 * @param {string} downloadUrl  The Firebase Storage download URL.
 * @returns {Promise<void>}
 */
export async function deleteStorageFile(downloadUrl) {
  if (!storage || !downloadUrl) return;
  try {
    const fileRef = ref(storage, downloadUrl);
    await deleteObject(fileRef);
  } catch (err) {
    if (err.code !== 'storage/object-not-found') {
      console.warn('storageService.deleteStorageFile:', err.message);
    }
  }
}

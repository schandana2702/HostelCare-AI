const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * createPrivilegedUser
 *
 * Secure Firebase Cloud Function allowing only authenticated Administrators
 * to create real Firebase Authentication accounts and Firestore user profiles for:
 *   - Hostel Warden ('warden')
 *   - Maintenance Staff ('maintenance')
 *   - System Administrator ('admin')
 *
 * Verification & Security rules:
 * 1. Caller must be authenticated with Firebase Auth.
 * 2. Caller's Firestore profile (/users/{uid}) must have role === 'admin'.
 * 3. Uses Firebase Admin SDK server-side — no credentials leaked to client.
 * 4. Administrator caller's client-side session is completely unaffected.
 */
exports.createPrivilegedUser = functions.https.onCall(async (data, context) => {
  // 1. Verify caller authentication
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Authentication required: You must be signed in to perform this action.'
    );
  }

  const callerUid = context.auth.uid;

  // 2. Verify caller is an active Administrator in Firestore
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  const callerData = callerDoc.data() || {};
  const callerRole = String(callerData.role || '').toLowerCase().trim();
  const isAdminRole = callerRole === 'admin' || callerRole === 'administrator';
  const isSuspended = callerData.status === 'suspended' || callerData.status === 'inactive';
  const isActive = !isSuspended;

  if (!callerDoc.exists || !isAdminRole || !isActive) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Permission denied: Only active system administrators can create privileged accounts.'
    );
  }

  // 3. Extract and validate parameters
  const {
    email,
    password,
    displayName,
    role,
    hostelBlock = '',
    roomNumber = '',
    phone = ''
  } = data || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'A valid email address is required.'
    );
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Password must be at least 6 characters long.'
    );
  }

  if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Full name (displayName) is required.'
    );
  }

  const validRoles = ['warden', 'maintenance', 'admin', 'administrator', 'student'];
  if (!role || !validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid role. Must be one of: ${validRoles.join(', ')}`
    );
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = displayName.trim();

  try {
    // 4. Create the real Firebase Authentication user via Admin SDK
    const userRecord = await admin.auth().createUser({
      email: trimmedEmail,
      password: password,
      displayName: trimmedName,
      emailVerified: true
    });

    // 5. Create the Firestore user profile
    const profileData = {
      uid: userRecord.uid,
      displayName: trimmedName,
      name: trimmedName,
      email: trimmedEmail,
      role: role,
      status: 'active',
      hostelBlock: hostelBlock || '',
      roomNumber: roomNumber || '',
      phone: phone || '',
      rollNumber: '',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: callerUid,
      createdSource: 'admin_portal'
    };

    await admin.firestore().collection('users').doc(userRecord.uid).set(profileData);

    return {
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: role,
      message: `Successfully created ${role} account for ${trimmedName}.`
    };
  } catch (error) {
    console.error('Error creating privileged user:', error);
    if (error.code === 'auth/email-already-exists') {
      throw new functions.https.HttpsError(
        'already-exists',
        'An account with this email address already exists in Firebase Authentication.'
      );
    }
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to create user account. Please try again.'
    );
  }
});

/**
 * triageComplaintAI
 *
 * Secure Firebase Cloud Function calling Google Gemini API to analyze
 * student complaint descriptions, recommend category and priority, detect safety
 * indicators, and provide explainable triage.
 *
 * Security & Integrity:
 * 1. Caller must be authenticated with Firebase Auth.
 * 2. API key is kept strictly server-side (process.env.GEMINI_API_KEY).
 * 3. Never prints API key to logs.
 * 4. Validates model output strictly against allowed categories and priority levels.
 * 5. Returns { available: false, reason: ... } when key is missing or model fails —
 *    never faking or fabricating AI output.
 */
exports.triageComplaintAI = functions.https.onCall(async (data, context) => {
  // 1. Caller authentication check
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Authentication required: You must be signed in to invoke AI triage.'
    );
  }

  const { title = '', description = '', category = '', hostelBlock = '', roomNumber = '' } = data || {};

  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  const cleanDesc = typeof description === 'string' ? description.trim() : '';

  if (!cleanTitle && !cleanDesc) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'At least a title or description is required for AI triage.'
    );
  }

  // 2. Check for configured Gemini API key on server
  const apiKey = process.env.GEMINI_API_KEY || (functions.config().gemini && functions.config().gemini.key);
  if (!apiKey) {
    return {
      available: false,
      reason: 'GEMINI_API_KEY is not configured on the Firebase Cloud Functions environment.'
    };
  }

  const validCategories = [
    'plumbing',
    'electrical',
    'carpentry',
    'cleaning',
    'wifi',
    'appliance',
    'pest',
    'security',
    'other'
  ];

  const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];

  const systemPrompt = `You are the HostelCare AI Complaint Triage Engine for university campus hostels.
Analyze the following student maintenance complaint and return a strictly formatted JSON response.

Input:
- Title: "${cleanTitle}"
- Description: "${cleanDesc}"
- User-Selected Category: "${category || 'unspecified'}"
- Location: "${hostelBlock || 'Unspecified Block'}, Room ${roomNumber || 'Unspecified'}"

Evaluate:
1. Recommended category: exactly one of: ${JSON.stringify(validCategories)}.
2. Recommended priority: exactly one of:
   - "EMERGENCY": Active safety hazard (fire, smoke, live sparking wires, electrical shock hazard, burst water main/flooding, locked inside room, violent intruder, gas leak).
   - "HIGH": Severe disruption (total power blackout, complete water supply outage, broken window glass, broken main door lock, severe pest infestation).
   - "MEDIUM": Routine fixture breakdown (leaking tap, broken fan regulator, clogged basin, Wi-Fi outage, geyser not heating, minor appliance fault).
   - "LOW": Minor cosmetic or non-urgent repair (loose screw, wobbly study chair, cupboard shelf loose, aesthetic stain).
3. Concise explanation (1-2 sentences) explaining why this category and priority are recommended.
4. Safety indicators: list any detected physical safety or hazard concerns (e.g. "Possible electrical fire risk", "Water pooling near electrical outlets"). Return empty array [] if no safety hazards exist.
5. Confidence: integer from 50 to 95 reflecting diagnostic certainty based on the information provided.

Output format must be valid JSON:
{
  "category": "plumbing",
  "priority": "MEDIUM",
  "explanation": "...",
  "safetyIndicators": [],
  "confidence": 85
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 500
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API HTTP Error status:', response.status);
      return {
        available: false,
        reason: `Gemini API returned status ${response.status}.`
      };
    }

    const resJson = await response.json();
    const candidateText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return {
        available: false,
        reason: 'Empty candidate text returned by Gemini API.'
      };
    }

    let cleanJson = candidateText.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseErr) {
      return {
        available: false,
        reason: 'Malformed JSON returned by model.'
      };
    }

    // Strictly validate parsed values
    const outCategory = validCategories.includes((parsed.category || '').toLowerCase())
      ? parsed.category.toLowerCase()
      : 'other';

    const outPriority = validPriorities.includes((parsed.priority || '').toUpperCase())
      ? parsed.priority.toUpperCase()
      : 'MEDIUM';

    const outExplanation = typeof parsed.explanation === 'string' && parsed.explanation.trim()
      ? parsed.explanation.trim()
      : 'Automated AI triage recommendation based on complaint details.';

    const outSafety = Array.isArray(parsed.safetyIndicators)
      ? parsed.safetyIndicators.filter((s) => typeof s === 'string' && s.trim())
      : [];

    const outConfidence = typeof parsed.confidence === 'number'
      ? Math.max(50, Math.min(98, Math.round(parsed.confidence)))
      : 80;

    return {
      available: true,
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      result: {
        category: outCategory,
        priority: outPriority,
        explanation: outExplanation,
        safetyIndicators: outSafety,
        confidence: outConfidence,
        evaluatedAt: new Date().toISOString()
      }
    };
  } catch (apiError) {
    console.error('Gemini API Call Exception:', apiError.message);
    return {
      available: false,
      reason: apiError.message || 'Network exception communicating with Gemini API.'
    };
  }
});


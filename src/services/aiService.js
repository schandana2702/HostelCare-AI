import { isFirebaseConfigured, functions } from './firebase.js';
import { httpsCallable } from 'firebase/functions';

/**
 * HostelCare AI - Intelligent Complaint Classification & Prioritization Engine
 * Supports live Google Gemini API via secure Firebase Cloud Function,
 * with deterministic explainable heuristic fallback when AI is unconfigured or offline.
 */

// Context pattern for ambiguous adjectival uses of "light" (e.g. "light leak", "light dust", "light scratch")
// When matching, "light" should NOT count as an electrical lighting fixture.
const NON_ELECTRICAL_LIGHT_REGEX = /\blight\s+(?:water\s+)?(?:leak|leaking|leakage|seep|seepage|drip|dripping|drips|overflow|dust|dusty|dirt|stain|stains|smell|odor|cleaning|scratch|scratches|crack|cracks|dent|creak|damage|infestation|bugs?|ants?|cockroach|pests?)/i;

const CATEGORY_RULES = [
  {
    category: 'plumbing',
    keywords: [
      'leak', 'leaking', 'leakage', 'tap', 'taps', 'pipe', 'pipes', 'flush', 'water',
      'drain', 'drainage', 'basin', 'geyser leak', 'shower', 'clogged', 'clog', 'sink',
      'sewage', 'overflow', 'dripping', 'drip', 'seepage', 'faucet'
    ],
    weight: 1.5
  },
  {
    category: 'electrical',
    keywords: [
      'fan', 'fans', 'regulator', 'light', 'lights', 'lighting', 'tube', 'tubelight',
      'bulb', 'bulbs', 'lamp', 'led', 'cfl', 'switch', 'switches', 'switchboard',
      'socket', 'sockets', 'plug', 'plugs', 'outlet', 'outlets', 'wire', 'wires',
      'wiring', 'cord', 'spark', 'sparking', 'short circuit', 'current', 'electric shock',
      'shock', 'power', 'power cut', 'mcb', 'tripping', 'blackout', 'fuse', 'voltage'
    ],
    weight: 1.6
  },
  {
    category: 'carpentry',
    keywords: [
      'door', 'doors', 'window', 'windows', 'cupboard', 'almirah', 'wardrobe', 'bed',
      'cot', 'chair', 'table', 'desk', 'hinge', 'hinges', 'handle', 'wood', 'wooden',
      'latch', 'latches', 'drawer', 'scratch', 'scratches'
    ],
    weight: 1.3
  },
  {
    category: 'cleaning',
    keywords: [
      'clean', 'cleaning', 'dirty', 'garbage', 'dust', 'dusty', 'sweep', 'mop',
      'trash', 'washroom dirty', 'smell', 'odor', 'stain', 'stains', 'litter'
    ],
    weight: 1.2
  },
  {
    category: 'wifi',
    keywords: [
      'wifi', 'wi-fi', 'internet', 'router', 'network', 'lan', 'connection',
      'slow speed', 'disconnect', 'ethernet', 'no signal', 'broadband'
    ],
    weight: 1.4
  },
  {
    category: 'pest',
    keywords: [
      'cockroach', 'cockroaches', 'rat', 'rats', 'mouse', 'mice', 'bedbug', 'bedbugs',
      'bug', 'bugs', 'ant', 'ants', 'insect', 'insects', 'mosquito', 'mosquitoes',
      'lizard', 'termite', 'termites'
    ],
    weight: 1.4
  },
  {
    category: 'security',
    keywords: [
      'lock', 'padlock', 'broken lock', 'stolen', 'theft', 'intruder',
      'main door', 'grill', 'balcony lock', 'key lost'
    ],
    weight: 1.7
  },
  {
    category: 'appliance',
    keywords: [
      'ac', 'air conditioner', 'cooler', 'geyser', 'refrigerator', 'fridge',
      'water cooler', 'water heater', 'purifier', 'iron'
    ],
    weight: 1.3
  }
];

const EMERGENCY_KEYWORDS = [
  { word: 'spark', safety: 'Possible electrical fire/spark hazard detected' },
  { word: 'fire', safety: 'Active smoke or fire hazard reported' },
  { word: 'smoke', safety: 'Active smoke or fire hazard reported' },
  { word: 'shock', safety: 'Electric shock hazard present' },
  { word: 'flood', safety: 'Major water flooding or leakage hazard' },
  { word: 'burst', safety: 'Burst water pipe or equipment rupture' },
  { word: 'theft', safety: 'Security breach or theft reported' },
  { word: 'locked inside', safety: 'Physical entrapment hazard' },
  { word: 'bleeding', safety: 'Personal injury hazard' },
  { word: 'danger', safety: 'High-risk danger indicated by resident' },
  { word: 'hazard', safety: 'Physical safety hazard flagged' }
];

const HIGH_KEYWORDS = ['overflow', 'no water', 'total power', 'exam', 'broken glass', 'blackout', 'stuck', 'urgent', 'immediately'];

/**
 * Deterministic heuristic triage (always available, offline capable).
 */
export function analyzeComplaintText(title = '', description = '') {
  const text = `${title} ${description}`.toLowerCase();
  const isAmbiguousLight = NON_ELECTRICAL_LIGHT_REGEX.test(text);
  
  // 1. Determine Category
  const scores = {};
  for (const rule of CATEGORY_RULES) {
    let matchCount = 0;
    for (const kw of rule.keywords) {
      // Disambiguate "light", "lights", "lighting" when modifying non-electrical issues (e.g. "light leak", "light dust")
      if (rule.category === 'electrical' && isAmbiguousLight && (kw === 'light' || kw === 'lights' || kw === 'lighting')) {
        continue;
      }

      // Word boundary matching for short words (<= 4 chars) to avoid false partial substring matches
      if (kw.length <= 4) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(text)) {
          matchCount += 1;
        }
      } else if (text.includes(kw)) {
        matchCount += 1;
      }
    }
    scores[rule.category] = matchCount * rule.weight;
  }

  let predictedCategory = 'other';
  let maxScore = 0;
  for (const [cat, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      predictedCategory = cat;
    }
  }

  // 2. Identify Safety Indicators
  const safetyIndicators = [];
  let isEmergency = false;
  for (const item of EMERGENCY_KEYWORDS) {
    if (text.includes(item.word)) {
      isEmergency = true;
      if (!safetyIndicators.includes(item.safety)) {
        safetyIndicators.push(item.safety);
      }
    }
  }

  let isHigh = false;
  if (!isEmergency) {
    for (const kw of HIGH_KEYWORDS) {
      if (text.includes(kw)) {
        isHigh = true;
        break;
      }
    }
  }

  let predictedPriority = 'MEDIUM';
  let urgencyScore = 45;
  let reason = 'Standard maintenance ticket.';

  if (isEmergency) {
    predictedPriority = 'EMERGENCY';
    urgencyScore = 95;
    reason = 'Safety risk or active physical hazard detected in complaint keywords.';
  } else if (isHigh) {
    predictedPriority = 'HIGH';
    urgencyScore = 75;
    reason = 'Significant inconvenience or critical daily facility disruption.';
  } else if (maxScore > 0 && predictedCategory !== 'other') {
    predictedPriority = 'MEDIUM';
    urgencyScore = Math.min(70, Math.max(50, Math.round(45 + (maxScore * 10))));
    reason = `Clear symptoms of ${predictedCategory} maintenance required.`;
  } else {
    predictedPriority = 'LOW';
    urgencyScore = 30;
    reason = 'Routine inspection or minor maintenance.';
  }

  const confidence = Math.min(95, Math.max(50, Math.round(50 + (maxScore * 12))));

  return {
    category: predictedCategory,
    priority: predictedPriority,
    urgencyScore,
    confidence: maxScore > 0 ? confidence : 45,
    reasoning: reason,
    safetyIndicators,
    available: false,
    provider: 'heuristic',
    aiModel: 'HostelCare Deterministic Triage Engine v1.0',
    unavailableReason: 'Deterministic baseline (live LLM optional)'
  };
}

/**
 * Triage complaint using real Gemini API via Cloud Functions when available,
 * falling back transparently and safely to deterministic rules if unconfigured.
 */
export async function triageComplaintAI({ title = '', description = '', category = '', hostelBlock = '', roomNumber = '' }) {
  const fallback = analyzeComplaintText(title, description);

  // Attempt live Gemini Cloud Function call if Firebase is configured
  if (isFirebaseConfigured && functions) {
    try {
      const triageFn = httpsCallable(functions, 'triageComplaintAI');
      const response = await triageFn({
        title,
        description,
        category,
        hostelBlock,
        roomNumber
      });

      if (response?.data?.available && response?.data?.result) {
        const res = response.data.result;
        return {
          category: res.category,
          priority: res.priority,
          reasoning: res.explanation,
          safetyIndicators: res.safetyIndicators || [],
          confidence: res.confidence || 85,
          available: true,
          provider: 'gemini',
          aiModel: 'gemini-1.5-flash',
          evaluatedAt: res.evaluatedAt || new Date().toISOString()
        };
      } else if (response?.data?.reason) {
        return {
          ...fallback,
          available: false,
          provider: 'heuristic',
          unavailableReason: response.data.reason
        };
      }
    } catch (err) {
      // Safely fall through to deterministic baseline on network or function error
      return {
        ...fallback,
        available: false,
        provider: 'heuristic',
        unavailableReason: err?.message || 'Server-side AI triage unavailable'
      };
    }
  }

  return fallback;
}


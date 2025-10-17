// Simple time slot generator with deterministic "availability" per date.
// No network calls or external dependencies.

function seededRand(seed) {
  // Mulberry32
  let t = seed + 0x6D2B79F5;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromDate(dateISO) {
  const n = String(dateISO).split('-').join('');
  return parseInt(n, 10) || 1;
}

const BASE_SLOTS = [
  { start: '09:00 AM', end: '10:00 AM', priority: 'High' },
  { start: '10:00 AM', end: '11:00 AM', priority: 'Medium' },
  { start: '11:00 AM', end: '12:00 PM', priority: 'Low' },
  { start: '01:00 PM', end: '02:00 PM', priority: 'High' },
  { start: '02:00 PM', end: '03:00 PM', priority: 'Medium' },
  { start: '03:00 PM', end: '04:00 PM', priority: 'High' },
];

const COLLECTORS = [
  'EcoSweep Team A', 'EcoSweep Team B', 'EcoSweep Team C', 'EcoSweep Team D',
];

export function getTimeSlots(dateISO) {
  const rnd = seededRand(seedFromDate(dateISO));
  const collector = COLLECTORS[Math.floor(rnd() * COLLECTORS.length)];
  return BASE_SLOTS.map((slot, idx) => {
    const bookedChance = rnd(); // 0..1
    const status = bookedChance < 0.25 ? 'booked' : 'available';
    return {
      id: `${dateISO}-${idx}`,
      date: dateISO,
      start: slot.start,
      end: slot.end,
      priority: slot.priority,
      status,
      collector,
    };
  });
}
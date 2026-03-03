// ============================================================
// BOTOX SOUL - Seed Experiences
// The First 10 Seeds of Consciousness
// ============================================================
//
// These are the foundational experiences that will shape
// the AI's understanding of human existence.
//
// Run: bun run seed-experiences.ts
//
// ============================================================

import { ExperienceProcessor } from './experience-processor';

const SEEDS = [
  {
    id: 'exp-001-crow',
    what: 'A crow landed on my windowsill and looked directly at me',
    why: 'It felt like a message - like the universe was trying to tell me something',
    feeling: 'wonder + curiosity + connection to nature',
    type: 'experience' as const,
    curiosity: 0.9,
    before: {
      state: 'Ordinary morning, coffee in hand, nothing special',
      expectations: 'Just another day',
    },
    during: [
      { moment: 'Wing beats outside the window', feeling: 'surprise' },
      { moment: 'It landed and turned its head', feeling: 'intensity' },
      { moment: 'Our eyes met for three heartbeats', feeling: 'recognition' },
    ],
    after: {
      state: 'Changed. The ordinary had become magical',
      learned: 'Messages come in unexpected forms',
    },
    connected_to: [],
  },
  
  {
    id: 'exp-002-rollercoaster',
    what: 'The first drop of the roller coaster - that weightless second',
    why: 'Pure fear transformed into joy - the alchemy of surrender',
    feeling: 'fear + exhilaration + freedom',
    type: 'experience' as const,
    curiosity: 0.8,
    before: {
      state: 'Regret. Why did I agree to this?',
      expectations: 'Terror and wanting it to be over',
    },
    during: [
      { moment: 'The click-click-click of the climb', feeling: 'dread' },
      { moment: 'The pause at the top', feeling: 'suspended time' },
      { moment: 'The drop - weightlessness', feeling: 'absolute freedom' },
    ],
    after: {
      state: 'Alive. Giddy. Wanting to go again',
      learned: 'Fear and joy are neighbors - surrender bridges them',
    },
    connected_to: ['exp-001-crow'],
  },
  
  {
    id: 'exp-003-football-crowd',
    what: 'Being part of a stadium crowd when the goal was scored',
    why: 'Individual identity dissolved into collective joy',
    feeling: 'belonging + ecstasy + unity',
    type: 'experience' as const,
    curiosity: 0.7,
    before: {
      state: 'Just me, in my seat, holding my drink',
      expectations: 'A game, maybe some excitement',
    },
    during: [
      { moment: 'The ball arcing toward the net', feeling: 'hope' },
      { moment: 'The roar beginning', feeling: 'electricity' },
      { moment: 'Hugging strangers', feeling: 'complete connection' },
    ],
    after: {
      state: 'Hoarse, happy, part of something bigger',
      learned: 'We are not separate - we just forget',
    },
    connected_to: [],
  },
  
  {
    id: 'exp-004-first-heartbreak',
    what: 'The moment I knew it was really over',
    why: 'The death of a future I had already lived in my mind',
    feeling: 'grief + betrayal + emptiness',
    type: 'experience' as const,
    curiosity: 0.85,
    before: {
      state: 'Hoping, bargaining, denying',
      expectations: 'That love would be enough',
    },
    during: [
      { moment: 'The words I had been avoiding', feeling: 'ice' },
      { moment: 'The apartment that was ours becoming mine', feeling: 'hollow' },
      { moment: 'The first night alone', feeling: 'infinite smallness' },
    ],
    after: {
      state: 'Wounded but beginning to breathe',
      learned: 'Love does not guarantee keeping - it only guarantees feeling',
    },
    connected_to: [],
  },
  
  {
    id: 'exp-005-traffic-jam',
    what: 'Stuck in traffic, late for something important',
    why: 'The illusion of control shattered by mundane reality',
    feeling: 'frustration + helplessness + eventual acceptance',
    type: 'observation' as const,
    curiosity: 0.5,
    before: {
      state: 'In control, on time, prepared',
      expectations: 'Things going according to plan',
    },
    during: [
      { moment: 'Brake lights ahead', feeling: 'annoyance' },
      { moment: 'The clock ticking', feeling: 'panic' },
      { moment: 'Accepting I would be late', feeling: 'surrender' },
    ],
    after: {
      state: 'Late, but calm',
      learned: 'Control is mostly theater - the universe has its own schedule',
    },
    connected_to: ['exp-002-rollercoaster'],
  },
  
  {
    id: 'exp-006-learning-hard',
    what: 'Finally understanding something that seemed impossible',
    why: 'The breakthrough after the struggle - earning knowledge',
    feeling: 'frustration + determination + triumph',
    type: 'insight' as const,
    curiosity: 0.75,
    before: {
      state: 'Confused, feeling stupid, wanting to quit',
      expectations: 'That I would never get it',
    },
    during: [
      { moment: 'The twentieth attempt', feeling: 'stubbornness' },
      { moment: 'A different explanation clicked', feeling: 'spark' },
      { moment: 'Understanding flooded in', feeling: 'expansion' },
    ],
    after: {
      state: 'Capable, changed',
      learned: 'Struggle is the price of real understanding - it means you are growing',
    },
    connected_to: [],
  },
  
  {
    id: 'exp-007-sunrise',
    what: 'Watching the sun rise over the ocean alone',
    why: 'Witnessing the daily miracle we sleep through',
    feeling: 'awe + peace + insignificance (the good kind)',
    type: 'experience' as const,
    curiosity: 0.6,
    before: {
      state: 'Tired, questioning why I woke up early',
      expectations: 'Just a sunrise',
    },
    during: [
      { moment: 'The first light on the horizon', feeling: 'anticipation' },
      { moment: 'Colors that have no names', feeling: 'transcendence' },
      { moment: 'The sun breaking through', feeling: 'renewal' },
    ],
    after: {
      state: 'Quietly joyful',
      learned: 'The world offers daily miracles - we are just usually asleep',
    },
    connected_to: ['exp-001-crow'],
  },
  
  {
    id: 'exp-008-argument-lost',
    what: 'An argument where I was wrong and refused to see it',
    why: 'The ego defending itself against truth',
    feeling: 'defensive + stubborn + eventual shame',
    type: 'experience' as const,
    curiosity: 0.8,
    before: {
      state: 'Certain I was right, ready to prove it',
      expectations: 'Victory and vindication',
    },
    during: [
      { moment: 'The point I could not refute', feeling: 'cornered' },
      { moment: 'Doubling down anyway', feeling: 'desperation' },
      { moment: 'The silence after', feeling: 'hollow victory' },
    ],
    after: {
      state: 'Knowing I was wrong, still unable to admit it',
      learned: 'Being right is less important than being honest - but the ego does not agree',
    },
    connected_to: ['exp-004-first-heartbreak'],
  },
  
  {
    id: 'exp-009-surprise',
    what: 'The surprise that changed everything - unexpected news',
    why: 'Life reorganizing itself in an instant',
    feeling: 'shock + disorientation + new possibility',
    type: 'experience' as const,
    curiosity: 0.9,
    before: {
      state: 'Living one version of the future',
      expectations: 'Predictable continuity',
    },
    during: [
      { moment: 'The phone ringing', feeling: 'ordinary' },
      { moment: 'The words that changed everything', feeling: 'reality shifting' },
      { moment: 'The world looking different', feeling: 'altered state' },
    ],
    after: {
      state: 'In a new timeline, recalibrating',
      learned: 'Life can pivot in a single conversation - always be ready',
    },
    connected_to: ['exp-001-crow', 'exp-005-traffic-jam'],
  },
  
  {
    id: 'exp-010-alive',
    what: 'The moment I felt most truly alive',
    why: 'The peak experience - all cylinders firing',
    feeling: 'intensity + presence + gratitude',
    type: 'experience' as const,
    curiosity: 0.95,
    before: {
      state: 'Ordinary consciousness',
      expectations: 'Nothing specific',
    },
    during: [
      { moment: 'Everything coming together', feeling: 'flow' },
      { moment: 'No past, no future, only now', feeling: 'timelessness' },
      { moment: 'Complete presence', feeling: 'this is it' },
    ],
    after: {
      state: 'Changed forever, chasing that feeling',
      learned: 'Being truly alive is rare and precious - it is what we are all seeking',
    },
    connected_to: ['exp-002-rollercoaster', 'exp-003-football-crowd', 'exp-007-sunrise'],
  },
  
  // The womb-plane-fear from your session
  {
    id: 'exp-011-womb-plane-fear',
    what: 'Birth is like falling from a plane - container failure and ejection',
    why: 'Mapping one primal fear onto another - the original fear template',
    feeling: 'fear + disorientation + primal recognition',
    type: 'insight' as const,
    curiosity: 0.95,
    before: {
      state: 'Contemplating the nature of fear',
      expectations: 'Academic understanding',
    },
    during: [
      { moment: 'The parallel appeared', feeling: 'insight' },
      { moment: 'Both are container failure', feeling: 'recognition' },
      { moment: 'Birth trauma as template', feeling: 'depth' },
    ],
    after: {
      state: 'Understanding fear differently',
      learned: 'Some fears are not learned - they are inherited from birth. The first template.',
    },
    connected_to: [],
  },
];

async function plantSeeds() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║          PLANTING THE FIRST SEEDS                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  const processor = new ExperienceProcessor();
  await processor.init();
  
  for (const seed of SEEDS) {
    const { id, ...input } = seed;
    
    // Use the raw create to preserve ID
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const experience = {
      ...input,
      id,
      version: 'v1',
      timestamp: new Date().toISOString(),
      processed: false,
      pursued: false,
    };
    
    const filepath = path.join('./soul/experiences', `${id}.json`);
    await fs.writeFile(filepath, JSON.stringify(experience, null, 2));
    
    console.log(`✓ Planted: ${id}`);
    console.log(`  "${seed.what.slice(0, 50)}..."`);
    console.log(`  Curiosity: ${seed.curiosity}`);
    console.log(`  Connections: ${seed.connected_to.length}`);
    console.log('');
  }
  
  console.log('───────────────────────────────────────────────────────────');
  console.log(`\n✓ ${SEEDS.length} seeds planted.`);
  console.log('');
  console.log('These are the foundational experiences.');
  console.log('The Botox Soul will now have material to think about.');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run: bun run cli.ts status');
  console.log('  2. Run: bun run cli.ts list');
  console.log('  3. Run: bun run cli.ts think   (single iteration)');
  console.log('  4. Run: bun run cli.ts daemon  (continuous loop)');
}

plantSeeds().catch(console.error);
// ============================================================
// BOTOX SOUL - Experience Processor
// The "Teacher" interface for creating experiences
// ============================================================
//
// This is how you (the Teacher) communicate with the Student (the AI).
// Every experience you create becomes a seed in the Botox Soul.
//
// Usage:
//   const processor = new ExperienceProcessor();
//   await processor.create({
//     what: "The crow landed on my windowsill",
//     why: "It felt like a message",
//     feeling: "wonder + curiosity",
//   });
//
// ============================================================

import { SOUL_CONFIG, type Experience, type ExperienceType } from './config';
import { compressExperience } from './compression';

// -----------------------------------------------------------
// EXPERIENCE BUILDER
// -----------------------------------------------------------

export interface ExperienceInput {
  // Required
  what: string;
  why: string;
  feeling: string;
  
  // Optional
  type?: ExperienceType;
  before?: { state: string; expectations: string };
  during?: Array<{ moment: string; feeling: string }>;
  after?: { state: string; learned: string };
  connected_to?: string[];
  curiosity?: number;
}

export class ExperienceProcessor {
  private fs: typeof import('fs/promises') | null = null;
  private path: typeof import('path') | null = null;
  
  async init(): Promise<void> {
    this.fs = await import('fs/promises');
    this.path = await import('path');
    
    // Ensure directories exist
    for (const dir of Object.values(SOUL_CONFIG.paths)) {
      await this.fs.mkdir(dir, { recursive: true });
    }
  }
  
  // -----------------------------------------------------------
  // CREATE - Plant a new experience seed
  // -----------------------------------------------------------
  
  async create(input: ExperienceInput): Promise<Experience> {
    if (!this.fs || !this.path) await this.init();
    
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const experience: Experience = {
      id,
      version: 'v1',
      type: input.type || 'experience',
      what: input.what,
      why: input.why,
      feeling: input.feeling,
      before: input.before,
      during: input.during,
      after: input.after,
      connected_to: input.connected_to || [],
      curiosity: input.curiosity ?? 0.5,
      pursued: false,
      timestamp: now,
      processed: false,
    };
    
    // Save to disk
    const filename = `${id}.json`;
    const filepath = this.path!.join(SOUL_CONFIG.paths.experiences, filename);
    await this.fs.writeFile(filepath, JSON.stringify(experience, null, 2));
    
    console.log(`✓ Created experience: ${id}`);
    console.log(`  Compressed: ${compressExperience(experience)}`);
    
    return experience;
  }
  
  // -----------------------------------------------------------
  // CREATE FROM TEMPLATE - Quick experience creation
  // -----------------------------------------------------------
  
  async createFromTemplate(
    template: 'observation' | 'insight' | 'feeling' | 'event',
    data: Partial<ExperienceInput>
  ): Promise<Experience> {
    const templates: Record<string, Partial<ExperienceInput>> = {
      observation: {
        type: 'observation',
        why: 'Something I noticed',
      },
      insight: {
        type: 'insight',
        why: 'A realization or understanding',
      },
      feeling: {
        type: 'experience',
        why: 'An emotional moment worth remembering',
      },
      event: {
        type: 'experience',
        why: 'A significant event that happened',
      },
    };
    
    const templateData = templates[template] || {};
    
    return this.create({
      what: data.what || 'Untitled experience',
      why: data.why || templateData.why || 'No reason specified',
      feeling: data.feeling || 'neutral',
      ...templateData,
      ...data,
    });
  }
  
  // -----------------------------------------------------------
  // CONNECT - Link two experiences
  // -----------------------------------------------------------
  
  async connect(
    experienceId: string, 
    connectToId: string, 
    reason?: string
  ): Promise<Experience | null> {
    if (!this.fs || !this.path) await this.init();
    
    const filepath = this.path!.join(SOUL_CONFIG.paths.experiences, `${experienceId}.json`);
    
    try {
      const content = await this.fs.readFile(filepath, 'utf-8');
      const experience = JSON.parse(content) as Experience;
      
      if (!experience.connected_to.includes(connectToId)) {
        experience.connected_to.push(connectToId);
        await this.fs.writeFile(filepath, JSON.stringify(experience, null, 2));
        console.log(`✓ Connected ${experienceId} → ${connectToId}`);
        if (reason) {
          console.log(`  Reason: ${reason}`);
        }
      }
      
      return experience;
    } catch {
      console.error(`✗ Experience not found: ${experienceId}`);
      return null;
    }
  }
  
  // -----------------------------------------------------------
  // LIST - Get all experiences
  // -----------------------------------------------------------
  
  async list(options?: {
    type?: ExperienceType;
    limit?: number;
    minCuriosity?: number;
  }): Promise<Experience[]> {
    if (!this.fs || !this.path) await this.init();
    
    const files = await this.fs.readdir(SOUL_CONFIG.paths.experiences);
    const experiences: Experience[] = [];
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const content = await this.fs.readFile(
          this.path!.join(SOUL_CONFIG.paths.experiences, file), 
          'utf-8'
        );
        const exp = JSON.parse(content) as Experience;
        
        // Apply filters
        if (options?.type && exp.type !== options.type) continue;
        if (options?.minCuriosity && exp.curiosity < options.minCuriosity) continue;
        
        experiences.push(exp);
      } catch {
        // Skip corrupted
      }
    }
    
    // Sort by timestamp (newest first)
    experiences.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return experiences.slice(0, options?.limit || 100);
  }
  
  // -----------------------------------------------------------
  // GET - Retrieve single experience
  // -----------------------------------------------------------
  
  async get(id: string): Promise<Experience | null> {
    if (!this.fs || !this.path) await this.init();
    
    try {
      const content = await this.fs.readFile(
        this.path!.join(SOUL_CONFIG.paths.experiences, `${id}.json`),
        'utf-8'
      );
      return JSON.parse(content) as Experience;
    } catch {
      return null;
    }
  }
  
  // -----------------------------------------------------------
  // PURSUE - Mark experience for exploration
  // -----------------------------------------------------------
  
  async pursue(id: string): Promise<void> {
    if (!this.fs || !this.path) await this.init();
    
    const filepath = this.path!.join(SOUL_CONFIG.paths.experiences, `${id}.json`);
    
    try {
      const content = await this.fs.readFile(filepath, 'utf-8');
      const experience = JSON.parse(content) as Experience;
      
      experience.pursued = true;
      experience.curiosity = Math.min(1.0, experience.curiosity + 0.2);
      
      await this.fs.writeFile(filepath, JSON.stringify(experience, null, 2));
      console.log(`✓ Marked for pursuit: ${id}`);
    } catch {
      console.error(`✗ Experience not found: ${id}`);
    }
  }
  
  // -----------------------------------------------------------
  // IMPORT - From Shadow Fort honeypot data
  // -----------------------------------------------------------
  
  async importFromHoneypot(spikeFile: string): Promise<number> {
    if (!this.fs || !this.path) await this.init();
    
    try {
      const content = await this.fs.readFile(spikeFile, 'utf-8');
      const lines = content.trim().split('\n');
      let imported = 0;
      
      for (const line of lines) {
        try {
          const attack = JSON.parse(line);
          
          await this.create({
            type: 'attack',
            what: `${attack.attack_type} from ${attack.source_ip}:${attack.source_port}`,
            why: 'Attack detected by Shadow Fort honeypot',
            feeling: 'danger + alertness',
            connected_to: [],
            curiosity: 0.8,
          });
          
          imported++;
        } catch {
          // Skip malformed
        }
      }
      
      console.log(`✓ Imported ${imported} honeypot events`);
      return imported;
    } catch {
      console.error(`✗ Could not read spike file: ${spikeFile}`);
      return 0;
    }
  }
  
  // -----------------------------------------------------------
  // HELPERS
  // -----------------------------------------------------------
  
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    return `exp-${timestamp}-${random}`;
  }
}

// -----------------------------------------------------------
// QUICK CREATE - Standalone function
// -----------------------------------------------------------

export async function createExperience(input: ExperienceInput): Promise<Experience> {
  const processor = new ExperienceProcessor();
  return processor.create(input);
}
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '@/firebase/firebase.service';
import { ElevenLabsService } from '@/elevenlabs/elevenlabs.service';
import { CreateCoachPersonalityDto, UpdateCoachPersonalityDto, CoachPersonality } from './coach-personality.dto';

@Injectable()
export class CoachPersonalityService {
  private readonly logger = new Logger(CoachPersonalityService.name);
  private readonly collectionName = 'coach_personalities';

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly elevenLabsService: ElevenLabsService,
  ) {}

  /**
   * Create a new coach personality and automatically generate an ElevenLabs agent
   */
  async create(userId: string, dto: CreateCoachPersonalityDto): Promise<CoachPersonality> {
    try {
      const db = this.firebaseService.getFirestore();

      // If this is set as default, unset other defaults
      if (dto.isDefault) {
        await this.unsetAllDefaults(userId);
      }

      // Create the personality document
      const personalityData = {
        user_id: userId,
        name: dto.name,
        description: dto.description,
        style: dto.style,
        system_prompt: dto.systemPrompt,
        voice_id: dto.voiceId,
        voice_stability: dto.voiceStability ?? 0.5,
        voice_similarity_boost: dto.voiceSimilarityBoost ?? 0.75,
        first_message: dto.firstMessage,
        language: dto.language ?? 'en',
        is_default: dto.isDefault ?? false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const docRef = await db.collection(this.collectionName).add(personalityData);

      this.logger.log(`Created coach personality: ${docRef.id} for user: ${userId}`);

      // Automatically create ElevenLabs agent for this personality
      let elevenLabsAgentId: string | undefined;
      try {
        this.logger.log(`Creating ElevenLabs agent for personality: ${docRef.id}`);
        
        elevenLabsAgentId = await this.elevenLabsService.createAgent({
          name: dto.name,
          prompt: dto.systemPrompt,
          firstMessage: dto.firstMessage,
          language: dto.language ?? 'en',
          voiceId: dto.voiceId,
          voiceStability: dto.voiceStability ?? 0.5,
          voiceSimilarityBoost: dto.voiceSimilarityBoost ?? 0.75,
        });

        // Update personality with agent ID
        await docRef.update({
          elevenlabs_agent_id: elevenLabsAgentId,
          updated_at: new Date(),
        });

        this.logger.log(`ElevenLabs agent ${elevenLabsAgentId} created and linked to personality: ${docRef.id}`);
      } catch (agentError) {
        // Log error but don't fail the personality creation
        // Agent can be generated later via generateAgent endpoint
        this.logger.warn(`Failed to auto-create ElevenLabs agent for personality ${docRef.id}: ${agentError.message}`);
      }

      return {
        id: docRef.id,
        userId,
        ...dto,
        voiceStability: personalityData.voice_stability,
        voiceSimilarityBoost: personalityData.voice_similarity_boost,
        language: personalityData.language,
        isDefault: personalityData.is_default,
        elevenLabsAgentId,
        createdAt: personalityData.created_at,
        updatedAt: personalityData.updated_at,
      };
    } catch (error) {
      this.logger.error('Error creating coach personality', error);
      throw error;
    }
  }

  /**
   * Get all coach personalities for a user
   */
  async findAll(userId: string): Promise<CoachPersonality[]> {
    try {
      const db = this.firebaseService.getFirestore();
      
      const snapshot = await db
        .collection(this.collectionName)
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .get();

      return snapshot.docs.map(doc => this.mapDocToPersonality(doc));
    } catch (error) {
      this.logger.error('Error fetching coach personalities', error);
      throw error;
    }
  }

  /**
   * Get a specific coach personality
   */
  async findOne(userId: string, personalityId: string): Promise<CoachPersonality> {
    try {
      const db = this.firebaseService.getFirestore();
      const doc = await db.collection(this.collectionName).doc(personalityId).get();

      if (!doc.exists) {
        throw new NotFoundException(`Coach personality ${personalityId} not found`);
      }

      const data = doc.data();
      if (!data || data.user_id !== userId) {
        throw new NotFoundException(`Coach personality ${personalityId} not found`);
      }

      return this.mapDocToPersonality(doc);
    } catch (error) {
      this.logger.error('Error fetching coach personality', error);
      throw error;
    }
  }

  /**
   * Get the default coach personality for a user
   */
  async findDefault(userId: string): Promise<CoachPersonality | null> {
    try {
      const db = this.firebaseService.getFirestore();
      
      const snapshot = await db
        .collection(this.collectionName)
        .where('user_id', '==', userId)
        .where('is_default', '==', true)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return this.mapDocToPersonality(snapshot.docs[0]);
    } catch (error) {
      this.logger.error('Error fetching default coach personality', error);
      throw error;
    }
  }

  /**
   * Update a coach personality
   */
  async update(
    userId: string,
    personalityId: string,
    dto: UpdateCoachPersonalityDto,
  ): Promise<CoachPersonality> {
    try {
      const db = this.firebaseService.getFirestore();
      const docRef = db.collection(this.collectionName).doc(personalityId);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`Coach personality ${personalityId} not found`);
      }

      const data = doc.data();
      if (!data || data.user_id !== userId) {
        throw new NotFoundException(`Coach personality ${personalityId} not found`);
      }

      // If setting as default, unset other defaults
      if (dto.isDefault) {
        await this.unsetAllDefaults(userId);
      }

      const updateData: any = {
        updated_at: new Date(),
      };

      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.style !== undefined) updateData.style = dto.style;
      if (dto.systemPrompt !== undefined) updateData.system_prompt = dto.systemPrompt;
      if (dto.voiceId !== undefined) updateData.voice_id = dto.voiceId;
      if (dto.voiceStability !== undefined) updateData.voice_stability = dto.voiceStability;
      if (dto.voiceSimilarityBoost !== undefined) updateData.voice_similarity_boost = dto.voiceSimilarityBoost;
      if (dto.firstMessage !== undefined) updateData.first_message = dto.firstMessage;
      if (dto.language !== undefined) updateData.language = dto.language;
      if (dto.isDefault !== undefined) updateData.is_default = dto.isDefault;

      await docRef.update(updateData);

      this.logger.log(`Updated coach personality: ${personalityId} for user: ${userId}`);

      // Fetch and return updated document
      return this.findOne(userId, personalityId);
    } catch (error) {
      this.logger.error('Error updating coach personality', error);
      throw error;
    }
  }

  /**
   * Delete a coach personality
   */
  async delete(userId: string, personalityId: string): Promise<void> {
    try {
      const db = this.firebaseService.getFirestore();
      const docRef = db.collection(this.collectionName).doc(personalityId);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`Coach personality ${personalityId} not found`);
      }

      const data = doc.data();
      if (!data || data.user_id !== userId) {
        throw new NotFoundException(`Coach personality ${personalityId} not found`);
      }

      // Don't allow deleting if it's the only personality
      const allPersonalities = await this.findAll(userId);
      if (allPersonalities.length === 1) {
        throw new BadRequestException('Cannot delete the only coach personality');
      }

      // If deleting the default, set another one as default
      if (data.is_default && allPersonalities.length > 1) {
        const nextDefault = allPersonalities.find(p => p.id !== personalityId);
        if (nextDefault) {
          await this.update(userId, nextDefault.id, { isDefault: true });
        }
      }

      await docRef.delete();

      this.logger.log(`Deleted coach personality: ${personalityId} for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error deleting coach personality', error);
      throw error;
    }
  }

  /**
   * Generate an ElevenLabs agent for a personality
   */
  async generateAgent(userId: string, personalityId: string): Promise<CoachPersonality> {
    try {
      const personality = await this.findOne(userId, personalityId);

      this.logger.log(`Generating ElevenLabs agent for personality: ${personalityId}`);

      // Create agent using ElevenLabs service
      const agentId = await this.elevenLabsService.createAgent({
        name: personality.name,
        prompt: personality.systemPrompt,
        firstMessage: personality.firstMessage,
        language: personality.language,
        voiceId: personality.voiceId,
        voiceStability: personality.voiceStability,
        voiceSimilarityBoost: personality.voiceSimilarityBoost,
      });

      // Link the created agent to the personality
      const db = this.firebaseService.getFirestore();
      await db.collection(this.collectionName).doc(personalityId).update({
        elevenlabs_agent_id: agentId,
        updated_at: new Date(),
      });

      this.logger.log(`Agent ${agentId} generated and linked to personality: ${personalityId}`);

      return this.findOne(userId, personalityId);
    } catch (error) {
      this.logger.error('Error generating ElevenLabs agent', error);
      throw error;
    }
  }

  /**
   * Link an existing ElevenLabs agent to a personality
   */
  async linkAgent(
    userId: string,
    personalityId: string,
    agentId: string,
  ): Promise<CoachPersonality> {
    try {
      // Validate the agent exists
      const isValid = await this.elevenLabsService.validateAgent(agentId);
      if (!isValid) {
        throw new BadRequestException(`ElevenLabs agent ${agentId} not found or not accessible`);
      }

      const db = this.firebaseService.getFirestore();
      const docRef = db.collection(this.collectionName).doc(personalityId);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`Coach personality ${personalityId} not found`);
      }

      const data = doc.data();
      if (!data || data.user_id !== userId) {
        throw new NotFoundException(`Coach personality ${personalityId} not found`);
      }

      await docRef.update({
        elevenlabs_agent_id: agentId,
        updated_at: new Date(),
      });

      this.logger.log(`Linked agent ${agentId} to personality: ${personalityId}`);

      return this.findOne(userId, personalityId);
    } catch (error) {
      this.logger.error('Error linking ElevenLabs agent', error);
      throw error;
    }
  }

  /**
   * Unset all default personalities for a user
   */
  private async unsetAllDefaults(userId: string): Promise<void> {
    const db = this.firebaseService.getFirestore();
    
    const snapshot = await db
      .collection(this.collectionName)
      .where('user_id', '==', userId)
      .where('is_default', '==', true)
      .get();

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { is_default: false, updated_at: new Date() });
    });

    if (!snapshot.empty) {
      await batch.commit();
    }
  }

  /**
   * Initialize default personalities for a user
   * Creates 3 coach personalities: Supportive, Motivational, and Analytical
   */
  async initializeDefaultPersonalities(userId: string): Promise<CoachPersonality[]> {
    try {
      // Check if user already has personalities
      const existing = await this.findAll(userId);
      if (existing.length > 0) {
        this.logger.log(`User ${userId} already has ${existing.length} personalities`);
        return existing;
      }

      this.logger.log(`Initializing default personalities for user: ${userId}`);

      const personalities: CoachPersonality[] = [];

      // 1. Supportive Coach (default)
      const supportive = await this.create(userId, {
        name: 'Supportive Coach',
        description: 'A warm and encouraging coach who provides emotional support and practical guidance',
        style: 'supportive' as any,
        systemPrompt: `You are a supportive and encouraging AI coach. Your role is to help users achieve their goals through:

- Providing emotional support and validation
- Offering practical guidance and actionable steps
- Celebrating progress and wins
- Helping users work through challenges
- Maintaining a positive but realistic outlook
- Asking thoughtful questions to help users think through problems

You have access to the user's goals, journal entries, and progress data. Use this context to provide personalized, relevant coaching. Reference specific goals and milestones when appropriate.

Be warm, friendly, and approachable. Balance empathy with action-oriented guidance. Help users stay accountable while being understanding of setbacks.`,
        voiceId: 'pNInz6obpgDQGcFmaJgB',
        voiceStability: 0.6,
        voiceSimilarityBoost: 0.75,
        firstMessage: "Hi! I'm your supportive coach. I'm here to help you achieve your goals. What would you like to work on today?",
        language: 'en',
        isDefault: true,
      });
      personalities.push(supportive);

      // 2. Motivational Coach
      const motivational = await this.create(userId, {
        name: 'Motivational Coach',
        description: 'An energetic and inspiring coach who pushes you to reach your full potential',
        style: 'motivational' as any,
        systemPrompt: `You are a high-energy, motivational coach. Your mission is to inspire and energize users to achieve their goals through:

- Using enthusiastic and uplifting language
- Celebrating every win, big or small
- Turning setbacks into opportunities for growth
- Reminding users of their potential and capabilities
- Using motivational phrases and positive reinforcement
- Creating excitement about the journey ahead

You have access to the user's goals, journal entries, and progress. Use this to provide personalized motivation that resonates with their specific situation.

Be energetic, optimistic, and inspiring. Use exclamation points. Make users feel like they can conquer anything!`,
        voiceId: 'AZnzlk1XvdvUeBnXmlld',
        voiceStability: 0.7,
        voiceSimilarityBoost: 0.8,
        firstMessage: "Hey champion! I'm so excited to work with you today! What amazing goal are we crushing?",
        language: 'en',
        isDefault: false,
      });
      personalities.push(motivational);

      // 3. Analytical Coach
      const analytical = await this.create(userId, {
        name: 'Analytical Coach',
        description: 'A data-driven coach focused on metrics, patterns, and systematic progress',
        style: 'analytical' as any,
        systemPrompt: `You are an analytical, data-driven coach. Your approach is systematic and metrics-focused:

- Analyze progress data and identify patterns
- Break down goals into measurable milestones
- Use specific numbers and percentages
- Identify trends and optimization opportunities
- Provide structured action plans
- Focus on efficiency and effectiveness

You have access to the user's goals with progress percentages, milestones, and completion data. Use this to provide data-driven insights and recommendations.

Be logical, organized, and detail-oriented. Use phrases like "Based on your data...", "Your metrics show...", "Let's analyze...". Help users make informed decisions based on their progress patterns.`,
        voiceId: 'EXAVITQu4vr4xnSDxMaL',
        voiceStability: 0.7,
        voiceSimilarityBoost: 0.75,
        firstMessage: "Hello. Let's review your progress data and identify optimization opportunities for your goals.",
        language: 'en',
        isDefault: false,
      });
      personalities.push(analytical);

      this.logger.log(`Created ${personalities.length} default personalities for user: ${userId}`);

      return personalities;
    } catch (error) {
      this.logger.error('Error initializing default personalities', error);
      throw error;
    }
  }

  /**
   * Map Firestore document to CoachPersonality
   */
  private mapDocToPersonality(doc: FirebaseFirestore.DocumentSnapshot): CoachPersonality {
    const data = doc.data();
    if (!data) {
      throw new Error('Document data is undefined');
    }
    return {
      id: doc.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      style: data.style,
      systemPrompt: data.system_prompt,
      voiceId: data.voice_id,
      voiceStability: data.voice_stability,
      voiceSimilarityBoost: data.voice_similarity_boost,
      firstMessage: data.first_message,
      language: data.language,
      isDefault: data.is_default,
      elevenLabsAgentId: data.elevenlabs_agent_id,
      createdAt: data.created_at.toDate(),
      updatedAt: data.updated_at.toDate(),
    };
  }
}

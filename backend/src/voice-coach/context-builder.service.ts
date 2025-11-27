import { Injectable, Logger } from '@nestjs/common';
import { GoalService } from '@/goal/goal.service';
import { RagService } from '@/rag/rag.service';
import { JournalService } from '@/journal/journal.service';
import { MetricsService, ErrorType } from './metrics.service';

/**
 * Context interfaces for ElevenLabs prompts
 */
export interface UserContext {
  goals: GoalContext[];
  recentJournals: JournalContext[];
  relevantJournals?: JournalContext[]; // From RAG query
  stats: UserStats;
  preferences?: UserPreferences;
}

export interface GoalContext {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  progress: number;
  targetDate: string;
  daysRemaining: number;
  milestones: MilestoneContext[];
  recentProgress: ProgressContext[];
}

export interface MilestoneContext {
  title: string;
  completed: boolean;
  dueDate: string | null;
}

export interface ProgressContext {
  content: string;
  date: string;
}

export interface JournalContext {
  id: string;
  content: string;
  mood?: string;
  date: string;
  tags?: string[];
  relevanceScore?: number; // For RAG results
}

export interface UserStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overdueGoals: number;
  totalJournalEntries: number;
  currentStreak: number;
}

export interface UserPreferences {
  coachingStyle?: string;
  focusAreas?: string[];
}

/**
 * Service responsible for building comprehensive user context for AI coaching
 */
@Injectable()
export class ContextBuilderService {
  private readonly logger = new Logger(ContextBuilderService.name);
  private readonly MAX_RECENT_JOURNALS = 5;
  private readonly MAX_RAG_RESULTS = 5;

  constructor(
    private readonly goalService: GoalService,
    private readonly ragService: RagService,
    private readonly journalService: JournalService,
    private readonly metricsService: MetricsService,
  ) {}

  /**
   * Build complete user context for conversation
   * @param userId - User ID
   * @param query - Optional query for RAG search
   * @returns Promise<UserContext>
   */
  async buildUserContext(userId: string, query?: string): Promise<UserContext> {
    if (query) {
      return this.buildDynamicContext(userId, query);
    }
    return this.buildInitialContext(userId);
  }

  /**
   * Build initial context (no query) - fetches active goals and recent activity
   * @param userId - User ID
   * @returns Promise<UserContext>
   */
  async buildInitialContext(userId: string): Promise<UserContext> {
    const buildId = this.metricsService.logContextBuildStart(userId);
    const startTime = Date.now();
    
    try {
      this.logger.log(`Building initial context for user: ${userId}`);

      // Fetch data in parallel for better performance
      const [goals, recentJournals, goalCounts] = await Promise.all([
        this.fetchActiveGoals(userId),
        this.fetchRecentJournals(userId),
        this.goalService.getGoalCounts(userId),
      ]);

      // Build user stats
      const stats: UserStats = {
        totalGoals: goalCounts.total,
        activeGoals: goalCounts.active,
        completedGoals: goalCounts.completed,
        overdueGoals: goalCounts.overdue,
        totalJournalEntries: 0, // Will be calculated from journals
        currentStreak: 0, // Placeholder for future implementation
      };

      const context: UserContext = {
        goals,
        recentJournals,
        stats,
      };

      const duration = Date.now() - startTime;
      
      // Log metrics
      this.metricsService.logContextBuildComplete(userId, buildId, duration, {
        goalsCount: goals.length,
        journalsCount: recentJournals.length,
        type: 'initial',
      });

      this.logger.log({
        action: 'initial_context_built',
        userId,
        goalsCount: goals.length,
        journalsCount: recentJournals.length,
        duration,
      });

      return context;
    } catch (error) {
      this.logger.error('Error building initial context', {
        error: error.message,
        stack: error.stack,
        userId,
      });
      
      // Log error metrics
      this.metricsService.logError(
        ErrorType.CONTEXT_BUILD_ERROR,
        error.message || 'Failed to build initial context',
        userId,
        undefined,
        undefined,
        error,
        { buildId },
      );
      
      // Return minimal context on error (graceful degradation)
      return {
        goals: [],
        recentJournals: [],
        stats: {
          totalGoals: 0,
          activeGoals: 0,
          completedGoals: 0,
          overdueGoals: 0,
          totalJournalEntries: 0,
          currentStreak: 0,
        },
      };
    }
  }

  /**
   * Build dynamic context based on conversation query
   * @param userId - User ID
   * @param query - Query text for RAG search
   * @returns Promise<UserContext>
   */
  async buildDynamicContext(userId: string, query: string): Promise<UserContext> {
    const buildId = this.metricsService.logContextBuildStart(userId, undefined, { type: 'dynamic' });
    const startTime = Date.now();
    
    try {
      this.logger.log(`Building dynamic context for user: ${userId} with query`);

      // Start with initial context
      const initialContext = await this.buildInitialContext(userId);

      // Perform RAG search for relevant journal entries
      const relevantJournals = await this.fetchRelevantJournals(userId, query);

      // Merge contexts
      const context: UserContext = {
        ...initialContext,
        relevantJournals,
      };

      const duration = Date.now() - startTime;
      
      // Log metrics
      this.metricsService.logContextBuildComplete(userId, buildId, duration, {
        queryLength: query.length,
        relevantJournalsCount: relevantJournals.length,
        type: 'dynamic',
      });

      this.logger.log({
        action: 'dynamic_context_built',
        userId,
        queryLength: query.length,
        relevantJournalsCount: relevantJournals.length,
        duration,
      });

      return context;
    } catch (error) {
      this.logger.error('Error building dynamic context', {
        error: error.message,
        stack: error.stack,
        userId,
        queryLength: query?.length,
      });
      
      // Log error metrics
      this.metricsService.logError(
        ErrorType.CONTEXT_BUILD_ERROR,
        error.message || 'Failed to build dynamic context',
        userId,
        undefined,
        undefined,
        error,
        { buildId, queryLength: query?.length },
      );
      
      // Fallback to initial context on error
      return this.buildInitialContext(userId);
    }
  }

  /**
   * Fetch active goals with milestones and progress
   * @param userId - User ID
   * @returns Promise<GoalContext[]>
   */
  private async fetchActiveGoals(userId: string): Promise<GoalContext[]> {
    try {
      // Get active goals (in_progress and not_started)
      const [inProgressGoals, notStartedGoals] = await Promise.all([
        this.goalService.getAllGoals(userId, { status: 'in_progress' }),
        this.goalService.getAllGoals(userId, { status: 'not_started' }),
      ]);

      const allActiveGoals = [...inProgressGoals, ...notStartedGoals];

      // Fetch details for each goal
      const goalsWithDetails = await Promise.all(
        allActiveGoals.map(async (goal) => {
          const [milestones, progressUpdates] = await Promise.all([
            this.goalService.getMilestones(userId, goal.id),
            this.goalService.getProgressUpdates(userId, goal.id),
          ]);

          // Get only the 3 most recent progress updates
          const recentProgress = progressUpdates.slice(0, 3);

          const now = new Date();
          const daysRemaining = Math.ceil(
            (goal.target_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const goalContext: GoalContext = {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            category: (typeof goal.category == 'string')?goal.category: goal.category.name,
            status: goal.status,
            progress: goal.progress_percentage || 0,
            targetDate: goal.target_date.toISOString().split('T')[0],
            daysRemaining,
            milestones: milestones.map((m) => ({
              title: m.title,
              completed: m.completed,
              dueDate: m.due_date ? m.due_date.toISOString().split('T')[0] : null,
            })),
            recentProgress: recentProgress.map((p) => ({
              content: p.content,
              date: p.created_at.toISOString().split('T')[0],
            })),
          };

          return goalContext;
        })
      );

      return goalsWithDetails;
    } catch (error) {
      this.logger.error('Error fetching active goals', {
        error: error.message,
        userId,
      });
      return [];
    }
  }

  /**
   * Fetch recent journal entries
   * @param userId - User ID
   * @returns Promise<JournalContext[]>
   */
  private async fetchRecentJournals(userId: string): Promise<JournalContext[]> {
    try {
      const recentEntries = await this.journalService.getRecent(
        userId,
        this.MAX_RECENT_JOURNALS
      );

      return recentEntries.map((entry) => ({
        id: entry.id,
        content: entry.content,
        mood: entry.mood,
        date: entry.created_at.toISOString().split('T')[0],
        tags: entry.tags,
      }));
    } catch (error) {
      this.logger.error('Error fetching recent journals', {
        error: error.message,
        userId,
      });
      return [];
    }
  }

  /**
   * Fetch relevant journal entries using RAG
   * @param userId - User ID
   * @param query - Query text
   * @returns Promise<JournalContext[]>
   */
  private async fetchRelevantJournals(
    userId: string,
    query: string
  ): Promise<JournalContext[]> {
    try {
      // Use RAG service to retrieve semantically relevant journal entries
      const retrievedContext = await this.ragService.retrieveContext(
        query,
        {
          userId,
          contentTypes: ['journal'],
          limit: this.MAX_RAG_RESULTS,
          includeRecent: true,
          recentDays: 90, // Focus on last 3 months
        },
        true // Skip rate limit for system operations
      );

      // Convert retrieved documents to JournalContext format
      const relevantJournals: JournalContext[] = retrievedContext.documents.map((doc) => ({
        id: doc.id,
        content: doc.content,
        mood: doc.metadata?.mood,
        date: doc.createdAt.toISOString().split('T')[0],
        tags: doc.metadata?.tags,
        relevanceScore: doc.similarity,
      }));

      this.logger.log({
        action: 'rag_journals_retrieved',
        userId,
        queryLength: query.length,
        resultsCount: relevantJournals.length,
      });

      return relevantJournals;
    } catch (error) {
      this.logger.error('Error fetching relevant journals via RAG', {
        error: error.message,
        userId,
        queryLength: query?.length,
      });
      
      // Return empty array on error (graceful degradation)
      return [];
    }
  }

  /**
   * Format context for ElevenLabs prompt
   * Structures user context data into a readable format for the AI coach
   * @param context - User context
   * @returns string - Formatted context text
   */
  formatContextForPrompt(context: UserContext): string {
    try {
      const sections: string[] = [];

      // Add header
      sections.push('=== USER CONTEXT FOR AI COACHING ===');
      sections.push('');

      // User Statistics Section
      sections.push('--- USER STATISTICS ---');
      sections.push(`Total Goals: ${context.stats.totalGoals}`);
      sections.push(`Active Goals: ${context.stats.activeGoals}`);
      sections.push(`Completed Goals: ${context.stats.completedGoals}`);
      sections.push(`Overdue Goals: ${context.stats.overdueGoals}`);
      sections.push(`Total Journal Entries: ${context.stats.totalJournalEntries}`);
      if (context.stats.currentStreak > 0) {
        sections.push(`Current Streak: ${context.stats.currentStreak} days`);
      }
      sections.push('');

      // Active Goals Section
      if (context.goals.length > 0) {
        sections.push('--- ACTIVE GOALS ---');
        context.goals.forEach((goal, index) => {
          sections.push(`${index + 1}. ${goal.title}`);
          sections.push(`   Category: ${goal.category}`);
          sections.push(`   Status: ${goal.status}`);
          sections.push(`   Progress: ${goal.progress}%`);
          sections.push(`   Target Date: ${goal.targetDate} (${goal.daysRemaining} days remaining)`);
          
          if (goal.description) {
            sections.push(`   Description: ${goal.description}`);
          }

          // Add milestones
          if (goal.milestones.length > 0) {
            sections.push(`   Milestones:`);
            goal.milestones.forEach((milestone) => {
              const status = milestone.completed ? '✓' : '○';
              const dueDate = milestone.dueDate ? ` (Due: ${milestone.dueDate})` : '';
              sections.push(`     ${status} ${milestone.title}${dueDate}`);
            });
          }

          // Add recent progress
          if (goal.recentProgress.length > 0) {
            sections.push(`   Recent Progress:`);
            goal.recentProgress.forEach((progress) => {
              sections.push(`     [${progress.date}] ${progress.content}`);
            });
          }

          sections.push('');
        });
      } else {
        sections.push('--- ACTIVE GOALS ---');
        sections.push('No active goals at the moment.');
        sections.push('');
      }

      // Recent Journal Entries Section
      if (context.recentJournals.length > 0) {
        sections.push('--- RECENT JOURNAL ENTRIES ---');
        context.recentJournals.forEach((journal, index) => {
          sections.push(`${index + 1}. [${journal.date}]`);
          if (journal.mood) {
            sections.push(`   Mood: ${journal.mood}`);
          }
          if (journal.tags && journal.tags.length > 0) {
            sections.push(`   Tags: ${journal.tags.join(', ')}`);
          }
          sections.push(`   Content: ${journal.content.substring(0, 300)}${journal.content.length > 300 ? '...' : ''}`);
          sections.push('');
        });
      }

      // Relevant Journal Entries (from RAG) Section
      if (context.relevantJournals && context.relevantJournals.length > 0) {
        sections.push('--- RELEVANT JOURNAL ENTRIES (Based on Conversation) ---');
        context.relevantJournals.forEach((journal, index) => {
          const relevance = journal.relevanceScore 
            ? ` [Relevance: ${(journal.relevanceScore * 100).toFixed(0)}%]`
            : '';
          sections.push(`${index + 1}. [${journal.date}]${relevance}`);
          if (journal.mood) {
            sections.push(`   Mood: ${journal.mood}`);
          }
          if (journal.tags && journal.tags.length > 0) {
            sections.push(`   Tags: ${journal.tags.join(', ')}`);
          }
          sections.push(`   Content: ${journal.content.substring(0, 300)}${journal.content.length > 300 ? '...' : ''}`);
          sections.push('');
        });
      }

      // User Preferences Section (if available)
      if (context.preferences) {
        sections.push('--- USER PREFERENCES ---');
        if (context.preferences.coachingStyle) {
          sections.push(`Coaching Style: ${context.preferences.coachingStyle}`);
        }
        if (context.preferences.focusAreas && context.preferences.focusAreas.length > 0) {
          sections.push(`Focus Areas: ${context.preferences.focusAreas.join(', ')}`);
        }
        sections.push('');
      }

      // Footer with coaching instructions
      sections.push('=== COACHING INSTRUCTIONS ===');
      sections.push('Use the above context to provide personalized, empathetic, and actionable coaching.');
      sections.push('Reference specific goals, milestones, and journal entries when relevant.');
      sections.push('Be encouraging and supportive while helping the user stay accountable.');
      sections.push('Ask clarifying questions to better understand their needs and challenges.');
      sections.push('Celebrate progress and help identify patterns in their journey.');
      sections.push('');

      const formattedContext = sections.join('\n');

      this.logger.log({
        action: 'context_formatted',
        contextLength: formattedContext.length,
        goalsCount: context.goals.length,
        journalsCount: context.recentJournals.length,
        relevantJournalsCount: context.relevantJournals?.length || 0,
      });

      return formattedContext;
    } catch (error) {
      this.logger.error('Error formatting context for prompt', {
        error: error.message,
        stack: error.stack,
      });
      
      // Return minimal context on error
      return '=== USER CONTEXT ===\nUnable to load user context. Please provide general coaching support.\n';
    }
  }
}

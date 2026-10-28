import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm'
import { UserEntity } from '../users/user.entity'
import type { SessionType, IntensityZone, WorkoutStructure } from '@athleteos/types'

@Entity('daily_recommendations')
export class DailyRecommendationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  @Index()
  user_id: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ nullable: true, type: 'uuid' })
  weekly_plan_id: string | null

  @Column({ type: 'date' })
  date: string

  @Column({ length: 20 })
  type: SessionType

  @Column({ nullable: true, length: 20 })
  sport: string | null

  @Column({ nullable: true, length: 255 })
  title: string | null

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'integer', nullable: true })
  duration_target_minutes: number | null

  @Column({ nullable: true, length: 5 })
  intensity_target: IntensityZone | null

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  load_target: number | null

  @Column({ type: 'jsonb', nullable: true })
  workout_structure: WorkoutStructure | null

  @Column({ default: 'pending', length: 20 })
  status: 'pending' | 'done' | 'skipped' | 'modified'

  @Column({ nullable: true, type: 'uuid' })
  actual_session_id: string | null

  @Column({ type: 'text', nullable: true })
  reason: string | null

  @Column({ type: 'decimal', precision: 4, scale: 3, nullable: true })
  confidence: number | null

  @Column({ type: 'text', array: true, default: [] })
  rule_ids: string[]

  @CreateDateColumn()
  created_at: Date
}

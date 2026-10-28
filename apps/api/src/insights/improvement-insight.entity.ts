import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm'
import { UserEntity } from '../users/user.entity'
import type { InsightType, InsightSeverity } from '@athleteos/types'

@Entity('improvement_insights')
export class ImprovementInsightEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  @Index()
  user_id: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  generated_at: Date

  @Column({ nullable: true, length: 30 })
  insight_type: InsightType | null

  @Column({ nullable: true, length: 50 })
  metric: string | null

  @Column({ nullable: true, length: 255 })
  title: string | null

  @Column({ type: 'text', nullable: true })
  body: string | null

  @Column({ default: 'info', length: 10 })
  severity: InsightSeverity

  @Column({ type: 'text', nullable: true })
  action_suggested: string | null

  @Column({ type: 'jsonb', nullable: true })
  data_points: Record<string, unknown> | null

  @Column({ default: false })
  is_read: boolean

  @CreateDateColumn()
  created_at: Date
}

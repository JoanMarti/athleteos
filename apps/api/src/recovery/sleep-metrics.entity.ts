import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Index,
} from 'typeorm'
import { UserEntity } from '../users/user.entity'

@Entity('sleep_metrics')
export class SleepMetricsEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  @Index()
  user_id: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ nullable: true, type: 'uuid' })
  recovery_session_id: string | null

  @Column({ type: 'date' })
  date: string

  @Column({ type: 'integer', nullable: true })
  total_duration_minutes: number | null

  @Column({ type: 'integer', nullable: true })
  light_sleep_minutes: number | null

  @Column({ type: 'integer', nullable: true })
  deep_sleep_minutes: number | null

  @Column({ type: 'integer', nullable: true })
  rem_sleep_minutes: number | null

  @Column({ type: 'integer', nullable: true })
  awake_minutes: number | null

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  sleep_efficiency: number | null

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sleep_score: number | null

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sleep_consistency: number | null

  @Column({ nullable: true, length: 20 })
  source: string | null

  @CreateDateColumn()
  created_at: Date
}

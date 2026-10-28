import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm'
import { UserEntity } from '../users/user.entity'
import type { SportType, ZoneDistribution } from '@athleteos/types'

@Entity('training_sessions')
@Index(['user_id', 'started_at'])
export class TrainingSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  @Index()
  user_id: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ length: 20 })
  source: string

  @Column({ nullable: true, length: 100 })
  external_id: string | null

  @Column({ length: 30 })
  sport_type: SportType

  @Column({ nullable: true, length: 255 })
  title: string | null

  @Column({ type: 'timestamptz' })
  started_at: Date

  @Column({ type: 'integer' })
  duration_seconds: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distance_meters: number | null

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  elevation_gain_meters: number | null

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  training_load: number | null

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  intensity_factor: number | null

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  normalized_power_watts: number | null

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  average_power_watts: number | null

  @Column({ type: 'integer', nullable: true })
  average_hr_bpm: number | null

  @Column({ type: 'integer', nullable: true })
  max_hr_bpm: number | null

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  average_pace_sec_km: number | null

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  average_cadence_rpm: number | null

  @Column({ type: 'integer', nullable: true })
  calories_estimated: number | null

  @Column({ type: 'jsonb', nullable: true })
  hr_zone_distribution: ZoneDistribution | null

  @Column({ type: 'jsonb', nullable: true })
  power_zone_distribution: ZoneDistribution | null

  @CreateDateColumn()
  created_at: Date
}

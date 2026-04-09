import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne,
  JoinColumn, UpdateDateColumn, Index,
} from 'typeorm'
import { UserEntity } from './user.entity'
import type { HRZones, PowerZones, SportType, ExperienceLevel } from '@athleteos/types'

@Entity('athlete_profiles')
export class AthleteProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  @Index({ unique: true })
  user_id: string

  @OneToOne(() => UserEntity, (u) => u.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ nullable: true, length: 100 })
  display_name: string | null

  @Column({ type: 'date', nullable: true })
  birth_date: string | null

  @Column({ nullable: true, length: 20 })
  gender: string | null

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight_kg: number | null

  @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
  height_cm: number | null

  @Column({ default: 'cycling', length: 30 })
  primary_sport: SportType

  @Column({ type: 'text', array: true, default: [] })
  secondary_sports: SportType[]

  @Column({ default: 'intermediate', length: 20 })
  experience_level: ExperienceLevel

  @Column({ type: 'decimal', precision: 4, scale: 1, default: 8 })
  weekly_training_hours_target: number

  @Column({ type: 'integer', nullable: true })
  ftp_watts: number | null

  @Column({ type: 'integer', nullable: true })
  lthr_bpm: number | null

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  vo2max_estimate: number | null

  @Column({ type: 'integer', nullable: true })
  max_hr: number | null

  @Column({ type: 'jsonb', nullable: true })
  hr_zones: HRZones | null

  @Column({ type: 'jsonb', nullable: true })
  power_zones: PowerZones | null

  @UpdateDateColumn()
  updated_at: Date
}

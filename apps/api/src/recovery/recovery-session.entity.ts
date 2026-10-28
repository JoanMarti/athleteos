// ─── recovery-session.entity.ts ──────────────────────────────────────────────
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Index, OneToOne,
} from 'typeorm'
import { UserEntity } from '../users/user.entity'

@Entity('recovery_sessions')
export class RecoverySessionEntity {
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

  @Column({ type: 'date' })
  date: string

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  recovery_score: number | null

  @Column({ type: 'decimal', precision: 7, scale: 3, nullable: true })
  hrv_ms: number | null

  @Column({ type: 'integer', nullable: true })
  resting_hr_bpm: number | null

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  respiratory_rate: number | null

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  body_battery: number | null

  @CreateDateColumn()
  created_at: Date
}

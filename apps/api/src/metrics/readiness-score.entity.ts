import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Index,
} from 'typeorm'
import { UserEntity } from '../users/user.entity'

@Entity('readiness_scores')
export class ReadinessScoreEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  @Index()
  user_id: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ type: 'date' })
  date: string

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  hrv_component: number | null

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sleep_component: number | null

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  load_component: number | null

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  recovery_trend_component: number | null

  @Column({ nullable: true, length: 20 })
  label: string | null

  @Column({ type: 'decimal', precision: 4, scale: 3, nullable: true })
  confidence: number | null

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  training_load_7d: number | null

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  training_load_28d: number | null

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  atl: number | null

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  ctl: number | null

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  tsb: number | null

  @CreateDateColumn()
  created_at: Date
}

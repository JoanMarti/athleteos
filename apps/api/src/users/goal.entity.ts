import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, Index,
} from 'typeorm'
import { UserEntity } from './user.entity'
import type { GoalType } from '@athleteos/types'

@Entity('goals')
export class GoalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  @Index()
  user_id: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ length: 30 })
  type: GoalType

  @Column({ nullable: true, length: 50 })
  target_metric: string | null

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  target_value: number | null

  @Column({ nullable: true, length: 20 })
  target_unit: string | null

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  baseline_value: number | null

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  current_value: number | null

  @Column({ type: 'date', nullable: true })
  target_date: string | null

  @Column({ default: false })
  is_primary: boolean

  @Column({ default: 'active', length: 20 })
  status: 'active' | 'achieved' | 'abandoned'

  @CreateDateColumn()
  created_at: Date
}

import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm'
import { UserEntity } from '../users/user.entity'

@Entity('connected_accounts')
@Index(['user_id', 'provider'], { unique: true })
export class ConnectedAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column('uuid')
  @Index()
  user_id: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ type: 'varchar', length: 20 })
  provider: 'strava' | 'whoop' | 'garmin' | 'suunto'

  @Column({ type: 'varchar', length: 255 })
  provider_user_id: string

  // Tokens are stored encrypted — NEVER in plaintext
  @Column({ type: 'text' })
  access_token_encrypted: string

  @Column({ type: 'text', nullable: true })
  refresh_token_encrypted: string | null

  @Column({ type: 'timestamptz', nullable: true })
  token_expires_at: Date | null

  @Column({ type: 'text', array: true, default: [] })
  scopes: string[]

  @Column({ type: 'boolean', default: true })
  is_active: boolean

  @Column({ type: 'timestamptz', nullable: true })
  last_sync_at: Date | null

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  sync_status: 'pending' | 'syncing' | 'success' | 'error'

  @Column({ type: 'text', nullable: true })
  error_message: string | null

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date
}

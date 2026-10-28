import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToOne,
} from 'typeorm'
import { AthleteProfileEntity } from './athlete-profile.entity'

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, length: 255 })
  email: string

  @Column({ default: 'UTC', length: 100 })
  timezone: string

  @Column({ default: 'en', length: 10 })
  locale: string

  @CreateDateColumn()
  created_at: Date

  @UpdateDateColumn()
  updated_at: Date

  @OneToOne(() => AthleteProfileEntity, (p) => p.user)
  profile: AthleteProfileEntity
}

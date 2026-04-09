import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from './user.entity'
import { AthleteProfileEntity } from './athlete-profile.entity'
import { GoalEntity } from './goal.entity'
import { calculateHRZones, calculatePowerZones } from '@athleteos/utils'
import type { UpdateAthleteProfileDto, CreateGoalDto } from '@athleteos/types'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(AthleteProfileEntity)
    private readonly profileRepo: Repository<AthleteProfileEntity>,
    @InjectRepository(GoalEntity)
    private readonly goalsRepo: Repository<GoalEntity>,
  ) {}

  async findOrCreateUser(id: string, email: string): Promise<UserEntity> {
    let user = await this.usersRepo.findOneBy({ id })
    if (!user) {
      user = this.usersRepo.create({ id, email })
      await this.usersRepo.save(user)
      // Create empty profile
      const profile = this.profileRepo.create({ user_id: id, display_name: email.split('@')[0] })
      await this.profileRepo.save(profile)
    }
    return user
  }

  async getProfile(userId: string): Promise<AthleteProfileEntity> {
    const profile = await this.profileRepo.findOneBy({ user_id: userId })
    if (!profile) throw new NotFoundException('Athlete profile not found')
    return profile
  }

  async updateProfile(userId: string, dto: UpdateAthleteProfileDto): Promise<AthleteProfileEntity> {
    const profile = await this.getProfile(userId)

    // Auto-recalculate zones when FTP or LTHR changes
    const updates: Partial<AthleteProfileEntity> = { ...dto } as any

    if (dto.ftp_watts) {
      updates.power_zones = calculatePowerZones(dto.ftp_watts)
    }
    if (dto.lthr_bpm) {
      updates.hr_zones = calculateHRZones(dto.lthr_bpm)
    }
    if (dto.max_hr && !dto.lthr_bpm) {
      // Estimate LTHR as ~92% of max HR if not provided
      const estimatedLTHR = Math.round(dto.max_hr * 0.92)
      updates.hr_zones = calculateHRZones(estimatedLTHR)
    }

    await this.profileRepo.update(profile.id, updates)
    return this.getProfile(userId)
  }

  async getPrimaryGoal(userId: string): Promise<GoalEntity | null> {
    return this.goalsRepo.findOneBy({ user_id: userId, is_primary: true, status: 'active' })
  }

  async getGoals(userId: string): Promise<GoalEntity[]> {
    return this.goalsRepo.find({ where: { user_id: userId }, order: { created_at: 'DESC' } })
  }

  async createGoal(userId: string, dto: CreateGoalDto): Promise<GoalEntity> {
    // If this is marked primary, demote existing primary goals
    if (dto.target_metric) {
      await this.goalsRepo.update(
        { user_id: userId, is_primary: true },
        { is_primary: false },
      )
    }

    const goal = this.goalsRepo.create({
      user_id: userId,
      ...dto,
      is_primary: true,
      status: 'active',
    })
    return this.goalsRepo.save(goal)
  }

  async deleteUser(userId: string): Promise<void> {
    // GDPR: full deletion cascade
    await this.usersRepo.delete({ id: userId })
  }
}

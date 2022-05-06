import { ISubscriptionId } from '$enums/common';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
@Entity('member')
export default class Member {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'phone', type: 'varchar', length: 20, unique: true })
  phone: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ name: 'avatar', type: 'varchar', length: 500, nullable: true })
  avatar: string;

  @Column({ name: 'birthday', type: 'date', nullable: true })
  birthday: string;

  @Column({ name: 'password', type: 'text' })
  password: string;

  @Column({
    name: 'status',
    type: 'tinyint',
    default: 2,
    comment: '1: Active, 0: Inactive, 2: Uncompleted profile(default)',
  })
  status: number;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({
    name: 'subscription_id',
    type: 'bigint',
    nullable: true,
    default: null,
    comment: 'Current subscription trial: 0',
  })
  subscriptionId: number;

  @Column({ name: 'subscription_expire_at', type: 'datetime', nullable: true })
  subscriptionExpireAt: string | Date;

  @Column({ name: 'introduce', type: 'varchar', length: 500, nullable: true })
  introduce: string;

  @Column({ name: 'position', type: 'varchar', length: 255, nullable: true, comment: 'Job position' })
  position: string;

  @Column({ name: 'job_id', type: 'int', nullable: true, comment: 'Job' })
  jobId: number;

  @Column({ name: 'ken_id', type: 'int', nullable: true, comment: 'ken' })
  kenId: number;

  @Column({ name: 'address', type: 'varchar', length: 500, nullable: true, comment: 'address' })
  address: string;

  @Column({
    name: 'share_location_status',
    type: 'tinyint',
    comment: 'Visible in search result & map. 1: active, 0: inactive, 2:Active by time',
    default: 0,
  })
  shareLocationStatus: number;

  @Column({
    name: 'share_location_expire',
    type: 'datetime',
    comment: 'Time share location expire.',
    nullable: true,
  })
  shareLocationExpire: string | Date | null;

  @Column({
    name: 'notification_status',
    type: 'tinyint',
    comment: '0: OFF, 1: ON',
    default: 1,
    nullable: true,
  })
  notificationStatus: number;

  @Column({ name: 'gender', type: 'tinyint', comment: '1: Male, 2: Female, 3: Other', nullable: true })
  gender: number;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string;

  @CreateDateColumn({ name: 'created_date', type: 'datetime', nullable: true })
  createdAt: string | Date;

  @UpdateDateColumn({ name: 'update_date', type: 'datetime', nullable: true })
  updateDate: string | Date;
}

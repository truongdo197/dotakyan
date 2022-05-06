import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('verification_code')
export default class VerificationCode {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'phone', type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({
    name: 'type',
    type: 'tinyint',
    comment: 'Type of verify code. 1: Register, 2: Forgot password',
    default: 1,
  })
  type: number;

  @Column({ name: 'code', type: 'varchar', length: 20, comment: 'Verify code.' })
  code: string;

  @Column({ name: 'retry', type: 'tinyint', comment: 'Time retry', default: 0 })
  retry: number;

  @Column({ name: 'status', type: 'tinyint', comment: '1: active, 0: inactive', default: 1 })
  status: number;

  @Column({ name: 'expire_date', type: 'datetime' })
  expireDate: string | Date;

  @Column({ name: 'verification_date', type: 'datetime', nullable: true })
  verificationDate: string | Date;

  @CreateDateColumn({ name: 'created_date', type: 'datetime', nullable: true })
  createdAt: string | Date;
}

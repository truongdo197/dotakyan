import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';
@Entity('user', { schema: 'furima' })
export default class User {
  @PrimaryGeneratedColumn({ name: 'id', type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'username', type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ name: 'password', type: 'text' })
  password: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Column({ name: 'email', type: 'varchar', length: 255, nullable: true, unique: true })
  email: string | null;

  @Column({ name: 'mobile', type: 'varchar', length: 20, nullable: true, unique: true })
  mobile: string | null;

  @Column({ name: 'avatar', type: 'varchar', length: 255, nullable: true })
  avatar: string | null;

  @Column({ name: 'status', type: 'tinyint', default: 1, comment: '0: Inactive, 1: Active.' })
  status: number;

  @Column({ name: 'role_id', type: 'tinyint' })
  roleId: number;

  @CreateDateColumn({ name: 'created_date', type: 'datetime', nullable: true })
  createdAt: Date;

  @Column({ name: 'last_logged', type: 'datetime', nullable: true })
  lastLogged: Date | null;

  @Column({ name: 'last_change_pass', type: 'datetime', nullable: true })
  lastChangePass: Date | null;

  @UpdateDateColumn({ name: 'modified_date', type: 'datetime', nullable: true })
  modifiedDate: Date | null;

  @Column({ name: 'refresh_token', type: 'text', nullable: true })
  refreshToken: string | null;
}

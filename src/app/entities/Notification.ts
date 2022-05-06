import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
@Entity('notification')
export default class Notification {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'type', type: 'tinyint', nullable: false })
  type: number;

  @Column({ name: 'avatar', type: 'varchar', nullable: true, length: 500 })
  avatar: string;

  @Column({ name: 'created_by', type: 'bigint', unsigned: true, comment: 'Creator of notification' })
  createdBy: number;

  @Column({ name: 'member_id', type: 'bigint', unsigned: true, comment: 'Owner of notification' })
  memberId: number;

  @Column({
    name: 'object_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
    comment: 'Id of object_id, maybe a group id',
  })
  objectId: number;

  @Column({ name: 'is_read', type: 'tinyint', comment: '0: UnRead, 1 Read', default: 0 })
  isRead: number;

  @Column({ name: 'status', type: 'tinyint', comment: '0: Inactive, 1: active', default: 1 })
  status: number;

  @Column({ name: 'show_button', type: 'tinyint', comment: '0: Inactive, 1: active', default: 1 })
  showButton: number;

  @Column({ name: 'content', type: 'text', nullable: false })
  content: string;

  @UpdateDateColumn({ type: 'datetime', name: 'update_at' })
  updateAt: Date | string;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date | string;
}

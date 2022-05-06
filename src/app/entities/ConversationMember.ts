import { Entity, CreateDateColumn, Column, PrimaryColumn } from 'typeorm';
@Entity('conversation_member')
export default class ConversationMember {
  @PrimaryColumn({
    name: 'conversation_id',
    type: 'bigint',
    unsigned: true,
  })
  conversationId: number;

  @PrimaryColumn({
    name: 'member_id',
    type: 'bigint',
    unsigned: true,
  })
  memberId: number;

  @Column({ name: 'is_admin', type: 'tinyint', default: 0, comment: '0: active, 1. inactive' })
  isAdmin: number;

  @Column({ name: 'status', type: 'tinyint', default: 1, comment: '0: active, 1. inactive' })
  status: number;

  @PrimaryColumn({ name: 'member_type', type: 'tinyint', nullable: false, default: 1, comment: '1: member, 2: Admin' })
  memberType: number;

  @Column({ name: 'is_read', type: 'tinyint', nullable: true, default: 1, comment: '0: not read, 1. read' })
  isRead: number;

  @Column({ name: 'last_read_time', type: 'bigint', nullable: true })
  lastReadTime: number;

  @Column({ name: 'leave_at', type: 'datetime', nullable: true, comment: '' })
  leaveAt: string | Date;

  @Column({ name: 'remove_at', type: 'datetime', nullable: true, comment: 'Time member remove message' })
  removeAt: string | Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', nullable: true })
  createdAt: Date | string;
}

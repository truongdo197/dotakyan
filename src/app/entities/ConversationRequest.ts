import { Entity, CreateDateColumn, Column, PrimaryColumn } from 'typeorm';

@Entity('conversation_request')
export default class ConversationRequest {
  @PrimaryColumn({ name: 'conversation_id', type: 'bigint', unsigned: true })
  conversationId: number;

  @PrimaryColumn({ name: 'member_id', type: 'bigint', unsigned: true })
  memberId: number;

  @PrimaryColumn({ name: 'created_by', type: 'bigint', unsigned: true })
  createdBy: number;

  @Column({ name: 'status', type: 'tinyint', default: 2, comment: '0: Reject , 1: Accept, 2: requesting' })
  status: number;

  @Column({ name: 'type', type: 'tinyint', default: 1, comment: '1: Invite, 2: Request join.' })
  type: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: string | Date;
}

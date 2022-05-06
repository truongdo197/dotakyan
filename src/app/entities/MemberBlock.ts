import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('member_block')
export default class MemberBlock {
  @PrimaryColumn({ name: 'member_id', type: 'bigint', nullable: false })
  memberId: number;

  @PrimaryColumn({ name: 'target_id', type: 'bigint', nullable: false })
  targetId: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', nullable: true })
  createdAt: string | Date;
}

import { CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('job_follow')
export default class JobFollow {
  @PrimaryColumn({ name: 'member_id', type: 'bigint', unsigned: true })
  memberId: number;

  @PrimaryColumn({ name: 'job_id', type: 'bigint', unsigned: true, comment: 'Resource job.' })
  jobId: number;
}

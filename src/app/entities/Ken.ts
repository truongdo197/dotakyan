import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('ken')
export default class Ken {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column({ type: 'varchar', name: 'name', length: 250 })
  name: string;

  @Column({ type: 'tinyint', name: 'status', nullable: true, default: 1 })
  status: number | null;

  @Column('smallint', { name: 'order', nullable: true, default: 0 })
  order: number | null;

  @Column({ type: 'int', name: 'created_by', nullable: true })
  createdBy: number | null;

  @CreateDateColumn({ type: 'datetime', name: 'created_at', nullable: true })
  createdAt: Date | string;
}

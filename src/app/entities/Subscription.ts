import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('subscription')
export default class Subscription {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'name', type: 'varchar', nullable: true })
  name: string;

  @Column({ name: 'month', type: 'int', comment: 'Time of subscription' })
  month: number;

  @Column({ name: 'price', type: 'double', precision: 22, scale: 16 })
  price: number;

  @Column({ name: 'price_sale', type: 'double', precision: 22, scale: 16 })
  priceSale: number;

  @Column({ name: 'status', type: 'tinyint' })
  status: number;

  @Column({ name: 'order', type: 'tinyint' })
  order: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: number;

  @UpdateDateColumn({ name: 'update_at', type: 'datetime' })
  updateAt: number;
}

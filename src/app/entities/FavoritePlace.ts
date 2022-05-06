import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('favorite_place')
export default class FavoritePlace {
  @PrimaryGeneratedColumn({ name: 'id', type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'member_id', type: 'bigint', unsigned: true })
  memberId: number;

  @Column({ name: 'name_place', type: 'varchar', length: 500, nullable: true })
  namePlace: string;

  @Column({ name: 'description', type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({ name: 'lat', type: 'decimal', precision: 22, scale: 18, comment: 'Latitude', nullable: true })
  lat: number;

  @Column({ name: 'lng', type: 'decimal', precision: 22, scale: 18, comment: 'Longitude', nullable: true })
  lng: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', nullable: true })
  createdAt: Date | string;
}

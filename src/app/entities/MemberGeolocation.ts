import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('member_geolocation')
export default class MemberGeolocation {
  @PrimaryColumn({ name: 'member_id', type: 'bigint', nullable: false })
  memberId: number;

  @Column({ name: 'lat', type: 'decimal', precision: 22, scale: 18, comment: 'Latitude', nullable: true })
  lat: number;

  @Column({ name: 'lng', type: 'decimal', precision: 22, scale: 18, comment: 'Longitude', nullable: true })
  lng: number;

  @Column({ name: 'update_at', type: 'bigint', unsigned: true, nullable: true })
  updateAt: number;
}

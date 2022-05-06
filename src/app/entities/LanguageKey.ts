import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('language_key', { schema: 'furima' })
export default class LanguageKey {
  @PrimaryColumn('varchar', { name: 'key', length: 500 })
  key: string;

  @Column('varchar', { name: 'default_value', length: 500 })
  defaultValue: string;

  @Column('varchar', { primary: true, name: 'environment', length: 50 })
  environment: string;
}

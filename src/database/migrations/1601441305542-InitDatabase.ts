import {MigrationInterface, QueryRunner} from "typeorm";

export class InitDatabase1601441305542 implements MigrationInterface {
    name = 'InitDatabase1601441305542'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `language` (`code` varchar(50) NOT NULL, `name` varchar(50) NOT NULL, `status` tinyint NOT NULL, `vi_name` varchar(50) NOT NULL, `priority` smallint NOT NULL, `flag_icon` varchar(500) NOT NULL, `is_default` tinyint NOT NULL, `created_date` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`code`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `language_env` (`code` varchar(50) NOT NULL, `name` varchar(500) NOT NULL, `status` text NOT NULL, PRIMARY KEY (`code`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `language_static` (`language_key` varchar(500) NOT NULL, `language_default_value` varchar(500) NOT NULL, PRIMARY KEY (`language_key`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `language_static_by_env` (`language_static_key` varchar(500) NOT NULL, `language_env_code` varchar(50) NOT NULL, PRIMARY KEY (`language_static_key`, `language_env_code`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `language_static_by_lang` (`language_static_key` varchar(500) NOT NULL, `language_code` varchar(50) NOT NULL, `language_value` varchar(500) NOT NULL, PRIMARY KEY (`language_static_key`, `language_code`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `member` (`id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, `phone` varchar(20) NOT NULL, `email` varchar(255) NOT NULL, `avatar` varchar(500) NOT NULL, `password` text NOT NULL, `status` tinyint NOT NULL COMMENT '1: Active, 0: Inactive' DEFAULT 1, `is_visible` tinyint NOT NULL COMMENT 'Visible in search result & map. 1: active, 0: inactive' DEFAULT 1, `gender` tinyint NOT NULL COMMENT '1: Male, 2: Female, 3: Other', `refresh_token` text NULL, `created_date` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `update_date` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `member_geolocation` (`member_id` bigint NOT NULL, `lat` decimal(22,18) NOT NULL COMMENT 'Latitude', `lng` decimal(22,18) NOT NULL COMMENT 'Longitude', `update_at` bigint UNSIGNED NOT NULL, PRIMARY KEY (`member_id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `permission` (`id` int UNSIGNED NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `group_id` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `permission_group` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(150) NOT NULL, UNIQUE INDEX `IDX_032c209da98ae7c1a915b51c27` (`name`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `role` (`id` int NOT NULL AUTO_INCREMENT, `role_name` varchar(255) NOT NULL, `is_system` tinyint NOT NULL COMMENT '1: is a system, 0: not system' DEFAULT 0, `is_visible` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX `IDX_4810bc474fe6394c6f58cb7c9e` (`role_name`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `role_permission` (`role_id` int NOT NULL, `permission_id` int NOT NULL, PRIMARY KEY (`role_id`, `permission_id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `user` (`id` int UNSIGNED NOT NULL AUTO_INCREMENT, `username` varchar(100) NOT NULL, `password` text NOT NULL, `full_name` varchar(255) NULL, `email` varchar(255) NULL, `mobile` varchar(20) NULL, `avatar` varchar(255) NULL, `status` tinyint NOT NULL COMMENT '0: Inactive, 1: Active.' DEFAULT 1, `role_id` tinyint NOT NULL, `created_date` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6), `last_logged` datetime NULL, `last_change_pass` datetime NULL, `modified_date` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6), `refresh_token` text NULL, UNIQUE INDEX `IDX_78a916df40e02a9deb1c4b75ed` (`username`), UNIQUE INDEX `IDX_e12875dfb3b1d92d7d7c5377e2` (`email`), UNIQUE INDEX `IDX_29fd51e9cf9241d022c5a4e02e` (`mobile`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `user_permission` (`user_id` int NOT NULL, `permission_id` int NOT NULL, PRIMARY KEY (`user_id`, `permission_id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `role_permission` ADD CONSTRAINT `FK_3d0a7155eafd75ddba5a7013368` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `role_permission` DROP FOREIGN KEY `FK_3d0a7155eafd75ddba5a7013368`");
        await queryRunner.query("DROP TABLE `user_permission`");
        await queryRunner.query("DROP INDEX `IDX_29fd51e9cf9241d022c5a4e02e` ON `user`");
        await queryRunner.query("DROP INDEX `IDX_e12875dfb3b1d92d7d7c5377e2` ON `user`");
        await queryRunner.query("DROP INDEX `IDX_78a916df40e02a9deb1c4b75ed` ON `user`");
        await queryRunner.query("DROP TABLE `user`");
        await queryRunner.query("DROP TABLE `role_permission`");
        await queryRunner.query("DROP INDEX `IDX_4810bc474fe6394c6f58cb7c9e` ON `role`");
        await queryRunner.query("DROP TABLE `role`");
        await queryRunner.query("DROP INDEX `IDX_032c209da98ae7c1a915b51c27` ON `permission_group`");
        await queryRunner.query("DROP TABLE `permission_group`");
        await queryRunner.query("DROP TABLE `permission`");
        await queryRunner.query("DROP TABLE `member_geolocation`");
        await queryRunner.query("DROP TABLE `member`");
        await queryRunner.query("DROP TABLE `language_static_by_lang`");
        await queryRunner.query("DROP TABLE `language_static_by_env`");
        await queryRunner.query("DROP TABLE `language_static`");
        await queryRunner.query("DROP TABLE `language_env`");
        await queryRunner.query("DROP TABLE `language`");
    }

}

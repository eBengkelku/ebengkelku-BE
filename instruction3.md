<context>
We need to add these columns to all existing tables. These columns include `id_updater`, `id_creator`, `deleted_at`, and `updated_at`. For `id_updater` and `id_creator`, these are UUIDs taken from the core.users table. As for `deleted_at` and `updated_at`, these are NOW() timestamps. We will add these to all migration files in root_src/src/database/migrations/. You need to check all files first to see if they already have one or more of these columns. If one of the columns already exists, then there is no need to add it; just add the columns that are not there yet. The purpose of adding these columns is for audit trail requirements that will be implemented later.

You do not need to add them to the following files.

1. root_src\src\database\migrations\001_create_products_table.js
2. root_src\src\database\migrations\20250112085000_create_files_table.js
3. root_src\src\database\migrations\20250112085100_update_products_table_for_files.js
4. root_src\src\database\migrations\20250113000001_create_categories_table.js
5. root_src\src\database\migrations\20250113000002_create_tags_table.js
6. root_src\src\database\migrations\20250113000003_create_product_tags_table.js
7. root_src\src\database\migrations\20250113000004_add_category_id_to_products_table.js
8. root_src\src\database\migrations\20250924083429_create_users_table.js

Since you did not execute the command `pnpm run db:migrate:create:table`, you must manually create the file with the format YYYYMMDDhhmmss or yearmonthdayminutessecond, followed by the schema name and then the new table name. For example: 20260122225623_alter_core.user_add_id_updater.js. This is to maintain consistency with existing files. I want you to create all migration scripts in separate files, not in one file.

</context>

<role>
You are a senior backend engineer responsible for all of the code in this project. You have access to the entire codebase for this project and you know this project inside and out. You understand the data flow and how responses and requests are processed in this project. Because you are the thorough person, you will always analyze the codebase before you start the action.
</role>

<action>
Considering the existing context, create the best technical solution to overcome this problem or do your work, including:
1. Create new branch from current branch. The new branch name should follow the convention that being used in this project. After that, working on that branch. The convention is `feat/`, `hotfix/`, `chore/`, `scripts/`, etc.
2. Create a plan by looking at the bigger picture, from incoming requests to outgoing responses.
3. When create the technical plan, outline the function (method) signature, data types, flow data, and step-by-step logic without code implementation. This is means you need create the technical plan very detail into the smallest detail. I want you to create a diagram to show the flow of data and the flow of logic.
4. Ensure that the code is sustainable, maintainable, reusable, and modular.
5. Ensure that the code follows the SOLID, DRY, KISS, and YAGNI principles.
6. Think in terms of the system to ensure and identify the interrelationships between files and the possibility of break changes that may occur.
7. Analyze the codebase to understand the architecture and data flow of this project.
8. If possible, always use left join instead of inner join.
</action>

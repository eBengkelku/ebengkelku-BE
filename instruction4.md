<context>
We will create seeder data for the core.roles and core.permissions tables for the roles and permissions described below. These are the base roles and base permissions based on the identified business processes. Now, since you will see the ‘employee’ role in the description below, you can ignore it for now. Let's focus on the roles and permissions that are already clear. Then, we will populate the data again into the core.role_permissions table.

These are the roles and permissions.

Owner: workshop owner, can manage the workshop, manage master data (products, services, employees), access the analytics dashboard (sales reports, stock reports, operations, etc.).

Customer: order workshop products, book workshop services, rate/review workshops, find the nearest workshop.

Admin: all permissions.

Since you did not execute the command `pnpm run db:migrate:create:seeder`, you must manually create the file with the format YYYYMMDDhhmmss or yearmonthdayminutessecond, followed by the schema name and then the new table name. For example: 20260122225623_seeder_core.roles.js. This is to maintain consistency with existing files. I want you to create all migration scripts in separate files, not in one file. Put the file in the root_src/src/database/seeders/ directory.

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

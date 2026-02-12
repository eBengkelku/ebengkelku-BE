<context>
We are asked to create an integration test for the `register/customer` domain. So, our boss wants to know if our code really works (even though it has been tested manually and works). Our boss wants to know if the code really works or not when integration testing is performed. So, we have to create integration testing for the `register/customer` domain. We will create all successful and failed scenarios. Our manager has requested that we create at least 10 successful scenarios and 10 failed scenarios. Then, after the test is complete, we will delete the data from the database. For the database connection, we will use the one in .env. So, we will connect to the dev database.

We will place our test files in `root_src/src/domains/auth/register/customer/__tests__/integration`. All the necessary mocks will be placed in `root_src/src/domains/auth/register/customer/__mocks__/` and will be used for this integration test. Our manager has requested that we specifically test the `register/customer` domain and all endpoints created within that domain.

This is the database connection

```.env
DEV_DB_HOST=108.171.193.183                        # Database server IP/hostname
DEV_DB_PORT=6432                                 # Default PostgreSQL port
DEV_DB_USER=ebengkelku_dev                         # Database username
DEV_DB_PASSWORD=nuv7du                # Database password
DEV_DB_NAME=ebengkelku_dev                         # Database name
DEV_DB_SSL=false                                 # Set to 'true' if SSL required
```

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

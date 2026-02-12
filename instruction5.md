<context>
I want to create a cron job. This cron job will encrypt all data in the core.users tables. This is to ensure compliance with personal data protection regulations in Indonesia. As a result, all personal information from users will be fully encrypted. Therefore, we will use a private key and public key if we want to decrypt user data. This means that even database administrators or database engineers will not be able to see user data when they open the database. Since this is backend, we will focus on creating the private key.

Then, in terms of performance, we have to think about big o notation complexity. We have to use an algorithm that can make the performance of our cron job run smoothly and seamlessly. Because later, the usage scheme is that when users log in, their data will be entered as is (without being encrypted) except for passwords, which are already hashed from the start. Then, after a short delay, we run this cron job.

I also want you to search Google first to find out how we can generate the private and public keys. I know that the public key will be placed on the frontend. I want the script (maybe via pnpm package.json is runned), we will have the private key and public key in json file in root_src/src/config/{nama-folder}. In that folder we will have the json file and the README.md file that similar to root_src\config\jwks\README.md that describe how to obtain the private and public key. I want the private key name to be `PRIVATE_KEY_MY_KEY` and the public key name to be `PUBLIC_KEY_MY_KEY`. Then, also search Google to find out how and what algorithm will be used in creating this cron job.

We will create it in root_src/src/jobs/{job-folder-name}/.

Then, inside that folder, we will create an interfaces folder containing interface files, a constants folder containing constant files, and then there will be services and modules without folders. We will also use logging to monitor whether this job is successful or not. However, no personal data should be visible in the logging. The logging should also not contain any symbols or emoticons. So, focus on ASCII only.

Then, create unit tests that can cover at least 30 positive cases and at least 30 negative cases. Also create edge case scenarios.
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

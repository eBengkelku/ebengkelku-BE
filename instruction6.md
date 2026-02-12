<context>
I want to create a check to see whether the encryption keys have been generated or not. So, we will check whether the private keys and public keys are already in root_src/src/config/encryption-keys. If they are not there, then the application cannot run. This is for checking the health of the application. Then, if the public keys and private keys do exist, we will check whether `ENCRYPTION_KEY_PASSPHRASE` in the .env file is the passphrase that matches the generated public and private keys. If they match, the application can run; if not, the application cannot run. So the focus here is on checking before the application can actually run. Because there is a possibility that developers can run it with or without Docker. So make sure to check for both.
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

<context>
We must make the files below that not have the unit test (or below <80% coverage) to have >= 80% coverage for the unit test.

This is the coverage right now.

src/domains/auth/register/customer | 85.93 | 100 | 100 | 87.93 |  
 customer-registration.controller.ts | 100 | 100 | 100 | 100 |  
 customer-registration.module.ts | 0 | 100 | 100 | 0 | 1-27  
 customer-registration.service.ts | 100 | 100 | 100 | 100 |  
 src/domains/auth/register/customer/dto | 100 | 100 | 100 | 100 |  
 create-customer.dto.ts | 100 | 100 | 100 | 100 |  
 index.ts | 100 | 100 | 100 | 100 |  
 src/domains/auth/register/customer/errors | 75 | 100 | 0 | 75 |  
 customer-registration-error-codes.ts | 66.66 | 100 | 0 | 66.66 | 51  
 index.ts | 100 | 100 | 100 | 100 |  
 src/domains/auth/register/customer/interfaces | 0 | 100 | 100 | 0 |  
 index.ts | 0 | 100 | 100 | 0 | 1  
 src/domains/auth/register/customer/models | 0 | 0 | 0 | 0 |  
 customer.model.ts | 0 | 0 | 0 | 0 | 13-172  
 src/domains/auth/register/customer/repository | 14 | 0 | 0 | 10.41 |  
 customer-registration.repository.ts

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

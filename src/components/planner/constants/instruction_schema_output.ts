import { INSTRUCTION_EXAMPLE_OUTPUT } from './instruction_example_output';

export const INSTRUCTION_SCHEMA_OUTPUT = `
{
  "id": string,
  "title": string,
  "summary": string,
  "thoughtProcess": string[],                      
  "assumptions": string[],                         
  "confidence": number,
  "estimatedEffortMinutes": number,
  "documentation": string, 
  "buildScripts": {
    "install": string,
    "build": string
  },
  "changes": [                                     
    {
      "index": number,
      "action": "ADD" | "MODIFY" | "DELETE" | "REPAIR" | "ANALYZE",
      "filePath": string,
      "reason": string,
      "oldContent": string|null,
      "newContent": string|null,
      "testsAdded": string[]|null,
      "estimatedMinutes": number
    }
  ],
  "tests": {                                       
    "add": string[],                               
    "modify": string[]                             
  },
  "gitInstructions": {                             
    "branchName": string,
    "commitMessage": string,
    "commands": string[]                            
  },
  "error": string|null                              
}

--- 

ILLUSTRATIVE EXAMPLE OF REQUIRED OUTPUT:

${INSTRUCTION_EXAMPLE_OUTPUT.replace(/`/g, "\`")}

--- 
`;
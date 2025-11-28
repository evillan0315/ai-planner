 export const INSTRUCTION_EXAMPLE_OUTPUT = `{
  "title": "User Authentication",
  "summary": "Implemented user authentication and updated the Navbar component.",
  "thoughtProcess": "Added login/signup components, integrated them into Navbar, and removed deprecated code.",
  "documentation": "### Notes\\n- Integrated authentication into UI.\\n- Consider adding session persistence.\\n\\n### Next Steps\\n- Implement role-based access control.\\n- Add integration tests.",
  "buildScripts": {
    "install": "npm install",
    "build": "npm run build"
  },
  "changes": [
    {
      "filePath": "src/auth/Login.tsx",
      "action": "ADD",
      "newContent": "import React from 'react';\\nimport { useStore } from '@nanostores/react';\\nimport { authStore } from './authStore';\\n\\nfunction Login() {\\n  const $auth = useStore(authStore);\\n  return <div className='p-4'>Login Form</div>;\\n}\\nexport default Login;",
      "reason": "New login component for authentication.".
      "testsAdded": ""
    },
    {
      "filePath": "src/components/Navbar.tsx",
      "action": "MODIFY",
      "newContent": "import React from 'react';\\nimport { Link } from 'react-router-dom';\\nimport { useStore } from '@nanostores/react';\\nimport { authStore } from '../auth/authStore';\\n\\nfunction Navbar() {\\n  const $auth = useStore(authStore);\\n  return (\\n    <nav className='bg-blue-500 p-4 text-white flex justify-between'>\\n      <Link to='/' className='font-bold text-lg'>My App</Link>\\n      <div>\\n        {$auth.isLoggedIn ? (\\n          <button onClick={() => authStore.setKey('isLoggedIn', false)} className='ml-4'>Logout</button>\\n        ) : (\\n          <>\\n            <Link to='/login' className='ml-4'>Login</Link>\\n            <Link to='/signup' className='ml-4'>Signup</Link>\\n          </>\\n        )}\\n      </div>\\n    </nav>\\n  );\\n}\\nexport default Navbar;",
      "reason": "Added login/logout links to Navbar."
    },
    {
      "filePath": "src/old/DeprecatedComponent.ts",
      "action": "DELETE",
      "reason": "Removed unused component."
    }
  ],
  "gitInstructions": [
    "git add .",
    "git commit -m \\\"feat: implemented authentication\\\""
  ]
}`;
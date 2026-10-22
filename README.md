# HostelCare AI — Smart Hostel Complaint & Maintenance Management System

HostelCare AI is a web-based hostel complaint and maintenance management application designed to help students report hostel issues and help wardens, maintenance staff, and administrators manage complaints efficiently.

The application provides role-based dashboards, complaint tracking, maintenance assignment, resolution verification, and automated complaint classification suggestions.

## Features

### 1. Student Portal
- Register and access the student dashboard.
- Submit maintenance complaints with relevant details.
- Track complaint status and progress.
- View complaint history and updates.
- Confirm resolution and provide service feedback where available.

### 2. Hostel Warden Portal
- View and manage hostel complaints.
- Assign complaints to maintenance staff.
- Monitor complaint progress and overdue issues.
- Verify completed repairs.
- Manage hostel-related maintenance activities where available.

### 3. Maintenance Staff Portal
- View assigned maintenance tasks.
- Update complaint progress.
- Record repair notes and work details.
- Mark maintenance work as completed.

### 4. System Administrator Portal
- Access the system dashboard.
- Manage users and roles.
- Review and manage complaints.
- Manage hostel information and complaint categories where configured.
- Review system audit records where authorized.

### 5. Complaint Classification Assistant
- Analyze complaint descriptions using a local, rule-based heuristic classifier.
- Suggest a complaint category and priority.
- Help users identify urgent maintenance issues.
- Support manual selection when an automated suggestion is unavailable.

**AI availability:** Local heuristic classification does not require paid Gemini API credits. Live Gemini-based triage is optional and depends on valid server-side configuration, model availability, and API quota or billing access. The application must not represent a local suggestion as a live Gemini response.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Styling | Tailwind CSS |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| File storage | Firebase Storage |
| Server-side functions | Firebase Cloud Functions |
| Programming languages | JavaScript, JSX |
| Testing | Project test suite and configured development tools |
| Version control | Git and GitHub |
| Mobile readiness | PWA and Capacitor configuration |

## Application Architecture

The frontend is built with React and Vite. Firebase Authentication manages user sign-in, Cloud Firestore stores application data, Firebase Storage handles supported file uploads, and Cloud Functions provide trusted server-side operations.

The application uses role-based access controls to separate student, warden, maintenance staff, and administrator functionality.

## Project Structure

```text
HostelCare-AI/
├── functions/        # Firebase Cloud Functions
├── public/           # Public assets and PWA resources
├── src/
│   ├── components/   # Reusable interface components
│   ├── context/      # Application contexts
│   ├── pages/        # Role-specific pages
│   ├── routes/       # Routes and access guards
│   ├── services/     # Firebase and application services
│   └── utils/        # Shared utility functions
├── tests/            # Automated tests
├── firestore.rules   # Firestore security rules
├── storage.rules     # Firebase Storage security rules
├── firebase.json     # Firebase configuration
├── package.json      # Frontend dependencies and scripts
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js and npm compatible with the project configuration.
- A Firebase project for connected application functionality.
- Git, if you want to clone the repository.

Use Node.js 22 for Firebase Functions, as specified in `functions/package.json`.

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/schandana2702/HostelCare-AI.git
cd HostelCare-AI
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a local `.env` file in the project root using `.env.example` as the reference. Add the Firebase web-app configuration values required by the project.

Do not commit `.env` or place private credentials in source code.

For Gemini-based triage, configure `GEMINI_API_KEY` as a Firebase Functions secret if the feature is enabled. Never put the Gemini key in frontend environment variables or commit it to GitHub.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

### 5. Build the frontend

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Firebase Configuration and Security

Before using connected functionality, configure Firebase Authentication, Cloud Firestore, and Firebase Storage as required by the application.

Review and deploy the project's Firestore and Storage security rules before using real student or hostel data.

Privileged operations should be performed by trusted server-side code. Client-side role-based navigation is not a replacement for Firebase security rules and server-side authorization.

Never commit API keys, passwords, service-account files, or production user data.

## Testing

The repository contains a `tests/` directory for automated tests.

Run the test command configured in the root `package.json`:

```bash
npm test
```

If the project uses a different test script, check the available scripts with:

```bash
npm run
```

Record test results only after executing the tests. The Firebase Functions package currently does not define a separate `test` script.

## Deployment

Deployment requires a configured Firebase project, appropriate permissions, and verified application configuration.

Build the frontend first:

```bash
npm run build
```

Firebase Functions can be deployed separately after confirming the required Node.js runtime, secrets, dependencies, and function behavior:

```bash
firebase deploy --only functions
```

Deploy hosting, Firestore rules, or Storage rules only when those resources have been reviewed and are ready.

## Future Enhancements

Potential future improvements include:
- Expanded maintenance analytics and SLA reporting.
- Improved notifications and reminders.
- Additional accessibility and mobile usability improvements.
- Enhanced complaint classification and safety detection.
- Expanded automated integration and security testing.

## Repository

GitHub: https://github.com/schandana2702/HostelCare-AI

## Project Information

HostelCare AI is developed as a Software Engineering project focused on improving hostel maintenance workflows, complaint transparency, and coordination among students, wardens, maintenance staff, and administrators.
